import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  eq,
  feeAssignments,
  feePayments,
  lt,
  paymentOrders,
  type AppDatabase,
} from "@repo/database";
import {
  FEE_PAYMENT_METHODS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  PAYMENT_ORDER_STATUSES,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { PaymentGatewayConfigService } from "./payment-gateway-config.service";
import { NotificationFactory } from "../communications/notification.factory";

const ORDER_EXPIRY_MINUTES = 30;

export type CreatePaymentOrderInput = {
  institutionId: string;
  feeAssignmentId: string;
  amountInPaise: number;
  studentName: string;
  guardianMobile: string;
  guardianEmail?: string | null;
  description: string;
  createdByUserId: string;
};

export type PaymentOrderResult = {
  orderId: string;
  provider: string;
  checkoutData: Record<string, unknown>;
  expiresAt: Date;
};

@Injectable()
export class PaymentOrderService {
  private readonly logger = new Logger(PaymentOrderService.name);

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly configService: PaymentGatewayConfigService,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  /**
   * Create a payment order: registers it with the PG and stores it locally.
   * Returns checkout data for the frontend SDK.
   */
  async createOrder(
    input: CreatePaymentOrderInput,
  ): Promise<PaymentOrderResult> {
    const provider = await this.configService.resolveProvider(
      input.institutionId,
    );

    const internalOrderId = randomUUID();
    const expiresAt = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);

    const result = await provider.createOrder({
      internalOrderId,
      amountInPaise: input.amountInPaise,
      currency: "INR",
      customerName: input.studentName,
      customerMobile: input.guardianMobile,
      customerEmail: input.guardianEmail,
      description: input.description,
    });

    await this.db.insert(paymentOrders).values({
      id: internalOrderId,
      institutionId: input.institutionId,
      feeAssignmentId: input.feeAssignmentId,
      amountInPaise: input.amountInPaise,
      currency: "INR",
      status: PAYMENT_ORDER_STATUSES.PENDING,
      provider: provider.provider,
      externalOrderId: result.externalOrderId,
      checkoutData: JSON.stringify(result.checkoutData),
      studentName: input.studentName,
      guardianMobile: input.guardianMobile,
      guardianEmail: input.guardianEmail ?? null,
      expiresAt,
    });

    return {
      orderId: internalOrderId,
      provider: provider.provider,
      checkoutData: result.checkoutData,
      expiresAt,
    };
  }

  /**
   * Verify a client-side payment callback.
   * Called after the frontend PG SDK redirects back with payment params.
   * On success, records the fee payment.
   */
  async verifyClientPayment(input: {
    institutionId: string;
    internalOrderId: string;
    externalOrderId: string;
    externalPaymentId: string;
    externalSignature: string;
    createdByUserId: string;
  }) {
    const order = await this.getOrderOrThrow(
      input.institutionId,
      input.internalOrderId,
    );

    if (order.status !== PAYMENT_ORDER_STATUSES.PENDING) {
      throw new BadRequestException(`Payment order is already ${order.status}`);
    }

    if (new Date() > new Date(order.expiresAt)) {
      await this.markOrderExpired(order.id);
      throw new BadRequestException("Payment order has expired");
    }

    const provider = await this.configService.resolveProvider(
      input.institutionId,
    );

    const result = await provider.verifyPayment({
      externalOrderId: input.externalOrderId,
      externalPaymentId: input.externalPaymentId,
      externalSignature: input.externalSignature,
    });

    if (!result.success) {
      await this.db
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUSES.FAILED,
          externalPaymentId: input.externalPaymentId,
          externalSignature: input.externalSignature,
          failedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));

      throw new BadRequestException("Payment verification failed");
    }

    await this.confirmPayment({
      order,
      externalPaymentId: result.externalPaymentId,
      externalSignature: input.externalSignature,
      amountInPaise: order.amountInPaise,
      createdByUserId: input.createdByUserId,
    });

    return { success: true };
  }

  /**
   * Handle an inbound webhook event from the payment gateway.
   * Called by the webhook controller with raw body + signature.
   */
  async handleWebhook(input: {
    institutionId: string;
    payload: Buffer;
    signature: string;
  }): Promise<void> {
    const provider = await this.configService.resolveProvider(
      input.institutionId,
    );

    const event = await provider.parseWebhookEvent(
      input.payload,
      input.signature,
    );

    if (!event) {
      this.logger.debug(
        `Webhook ignored for institution ${input.institutionId} (invalid signature or unknown event)`,
      );
      return;
    }

    const orders = await this.db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.institutionId, input.institutionId),
          eq(paymentOrders.externalOrderId, event.externalOrderId),
          eq(paymentOrders.status, PAYMENT_ORDER_STATUSES.PENDING),
        ),
      )
      .limit(1);

    const order = orders[0];

    if (!order) {
      this.logger.warn(
        `Webhook: no pending order found for externalOrderId=${event.externalOrderId} (institution ${input.institutionId})`,
      );
      return;
    }

    if (event.type === "payment.captured") {
      await this.confirmPayment({
        order,
        externalPaymentId: event.externalPaymentId,
        externalSignature: null,
        amountInPaise: event.amountInPaise,
        createdByUserId: null,
      });
    } else if (event.type === "payment.failed") {
      await this.db
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUSES.FAILED,
          externalPaymentId: event.externalPaymentId,
          failedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));
    }
  }

  /**
   * Expire all pending orders older than their expiresAt.
   * Called by a cron job.
   */
  async expireStaleOrders(): Promise<number> {
    const result = await this.db
      .update(paymentOrders)
      .set({ status: PAYMENT_ORDER_STATUSES.EXPIRED })
      .where(
        and(
          eq(paymentOrders.status, PAYMENT_ORDER_STATUSES.PENDING),
          lt(paymentOrders.expiresAt, new Date()),
        ),
      )
      .returning({ id: paymentOrders.id });

    return result.length;
  }

  private async confirmPayment(input: {
    order: typeof paymentOrders.$inferSelect;
    externalPaymentId: string;
    externalSignature: string | null;
    amountInPaise: number;
    createdByUserId: string | null;
  }) {
    const paymentId = randomUUID();

    await this.db.transaction(async (tx) => {
      // Mark order as paid
      await tx
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUSES.PAID,
          externalPaymentId: input.externalPaymentId,
          externalSignature: input.externalSignature,
          paidAt: new Date(),
        })
        .where(eq(paymentOrders.id, input.order.id));

      // Create fee payment record
      await tx.insert(feePayments).values({
        id: paymentId,
        institutionId: input.order.institutionId,
        feeAssignmentId: input.order.feeAssignmentId,
        amountInPaise: input.amountInPaise,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: FEE_PAYMENT_METHODS.ONLINE,
        referenceNumber: input.externalPaymentId,
        onlinePaymentOrderId: input.order.id,
        notes: null,
      });

      // Recompute assignment status
      const [assignment] = await tx
        .select({
          assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        })
        .from(feeAssignments)
        .where(eq(feeAssignments.id, input.order.feeAssignmentId))
        .limit(1);

      if (assignment) {
        // Get total paid for this assignment (including new payment)
        const paidRows = await tx
          .select({
            amountInPaise: feePayments.amountInPaise,
          })
          .from(feePayments)
          .where(
            and(
              eq(feePayments.feeAssignmentId, input.order.feeAssignmentId),
              eq(feePayments.institutionId, input.order.institutionId),
            ),
          );

        const totalPaid = paidRows.reduce((sum, r) => sum + r.amountInPaise, 0);
        const outstanding = assignment.assignedAmountInPaise - totalPaid;
        const newStatus =
          outstanding <= 0 ? "paid" : totalPaid > 0 ? "partial" : "pending";

        await tx
          .update(feeAssignments)
          .set({ status: newStatus })
          .where(eq(feeAssignments.id, input.order.feeAssignmentId));
      }
    });

    // Non-blocking notification
    this.notificationFactory
      .notify({
        institutionId: input.order.institutionId,
        createdByUserId: input.createdByUserId ?? input.order.institutionId,
        type: NOTIFICATION_TYPES.FEE_PAYMENT_RECEIVED,
        channel: NOTIFICATION_CHANNELS.FINANCE,
        tone: NOTIFICATION_TONES.POSITIVE,
        audience: "guardians",
        title: "Online payment received",
        message: `Online payment of ₹${(input.amountInPaise / 100).toFixed(2)} received for ${input.order.studentName ?? "student"}.`,
        senderLabel: "Payment Gateway",
      })
      .catch(() => {});
  }

  private async getOrderOrThrow(institutionId: string, orderId: string) {
    const rows = await this.db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.id, orderId),
          eq(paymentOrders.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!rows[0]) {
      throw new NotFoundException("Payment order not found");
    }

    return rows[0];
  }

  private async markOrderExpired(orderId: string) {
    await this.db
      .update(paymentOrders)
      .set({ status: PAYMENT_ORDER_STATUSES.EXPIRED })
      .where(eq(paymentOrders.id, orderId));
  }
}
