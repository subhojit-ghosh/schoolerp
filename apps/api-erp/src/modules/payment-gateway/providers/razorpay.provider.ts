import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookPaymentEvent,
} from "../payment-gateway.types";

type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
};

export class RazorpayProvider implements PaymentGatewayProvider {
  readonly provider = "razorpay" as const;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(credentials: RazorpayCredentials) {
    this.keyId = credentials.keyId;
    this.keySecret = credentials.keySecret;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const body = JSON.stringify({
      amount: input.amountInPaise,
      currency: input.currency,
      receipt: input.internalOrderId,
      notes: {
        description: input.description,
        customer: input.customerName,
      },
    });

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Razorpay createOrder failed: ${error}`);
    }

    const data = (await response.json()) as { id: string };

    return {
      externalOrderId: data.id,
      checkoutData: {
        key: this.keyId,
        orderId: data.id,
        amount: input.amountInPaise,
        currency: input.currency,
        name: input.description,
        prefill: {
          name: input.customerName,
          contact: input.customerMobile,
          email: input.customerEmail ?? "",
        },
      },
    };
  }

  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<VerifyPaymentResult> {
    const payload = `${input.externalOrderId}|${input.externalPaymentId}`;
    const expectedSignature = createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(input.externalSignature, "hex");

    const match =
      expected.length === received.length &&
      timingSafeEqual(expected, received);

    return { success: match, externalPaymentId: input.externalPaymentId };
  }

  async parseWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<WebhookPaymentEvent | null> {
    // Razorpay sends X-Razorpay-Signature header
    // webhookSecret is used here, not keySecret
    const expectedSignature = createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(signature, "hex");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const event = JSON.parse(payload.toString()) as {
      event: string;
      payload: {
        payment: {
          entity: {
            id: string;
            order_id: string;
            amount: number;
          };
        };
      };
    };

    if (event.event === "payment.captured") {
      return {
        type: "payment.captured",
        externalOrderId: event.payload.payment.entity.order_id,
        externalPaymentId: event.payload.payment.entity.id,
        amountInPaise: event.payload.payment.entity.amount,
      };
    }

    if (event.event === "payment.failed") {
      return {
        type: "payment.failed",
        externalOrderId: event.payload.payment.entity.order_id,
        externalPaymentId: event.payload.payment.entity.id,
        amountInPaise: event.payload.payment.entity.amount,
      };
    }

    return null;
  }
}

export function isRazorpayCredentials(
  raw: unknown,
): raw is RazorpayCredentials {
  return (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as Record<string, unknown>)["keyId"] === "string" &&
    typeof (raw as Record<string, unknown>)["keySecret"] === "string"
  );
}
