import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookPaymentEvent,
} from "../payment-gateway.types";

type CashfreeCredentials = {
  appId: string;
  secretKey: string;
  environment: "sandbox" | "production";
};

export class CashfreeProvider implements PaymentGatewayProvider {
  readonly provider = "cashfree" as const;
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(credentials: CashfreeCredentials) {
    this.appId = credentials.appId;
    this.secretKey = credentials.secretKey;
    this.baseUrl =
      credentials.environment === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const body = JSON.stringify({
      order_id: input.internalOrderId,
      order_amount: input.amountInPaise / 100,
      order_currency: input.currency,
      customer_details: {
        customer_id: input.customerMobile,
        customer_name: input.customerName,
        customer_phone: input.customerMobile,
        customer_email: input.customerEmail ?? undefined,
      },
      order_meta: {
        return_url: "",
        notify_url: "",
      },
    });

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": this.appId,
        "x-client-secret": this.secretKey,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cashfree createOrder failed: ${error}`);
    }

    const data = (await response.json()) as {
      order_id: string;
      payment_session_id: string;
    };

    return {
      externalOrderId: data.order_id,
      checkoutData: {
        paymentSessionId: data.payment_session_id,
        orderId: data.order_id,
        environment: this.baseUrl.includes("sandbox") ? "sandbox" : "production",
      },
    };
  }

  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<VerifyPaymentResult> {
    // Cashfree uses a different verification — fetch order status from API
    const response = await fetch(
      `${this.baseUrl}/orders/${input.externalOrderId}`,
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": this.appId,
          "x-client-secret": this.secretKey,
        },
      },
    );

    if (!response.ok) {
      return { success: false, externalPaymentId: input.externalPaymentId };
    }

    const data = (await response.json()) as { order_status: string };

    return {
      success: data.order_status === "PAID",
      externalPaymentId: input.externalPaymentId,
    };
  }

  async parseWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<WebhookPaymentEvent | null> {
    const rawBody = payload.toString();
    const expectedSignature = createHmac("sha256", this.secretKey)
      .update(rawBody)
      .digest("base64");

    const expected = Buffer.from(expectedSignature, "base64");
    const received = Buffer.from(signature, "base64");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const event = JSON.parse(rawBody) as {
      type: string;
      data: {
        order: { order_id: string; order_amount: number };
        payment: { cf_payment_id: string };
      };
    };

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      return {
        type: "payment.captured",
        externalOrderId: event.data.order.order_id,
        externalPaymentId: String(event.data.payment.cf_payment_id),
        amountInPaise: Math.round(event.data.order.order_amount * 100),
      };
    }

    if (event.type === "PAYMENT_FAILED_WEBHOOK") {
      return {
        type: "payment.failed",
        externalOrderId: event.data.order.order_id,
        externalPaymentId: String(event.data.payment.cf_payment_id),
        amountInPaise: Math.round(event.data.order.order_amount * 100),
      };
    }

    return null;
  }
}

export function isCashfreeCredentials(
  raw: unknown,
): raw is CashfreeCredentials {
  return (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as Record<string, unknown>)["appId"] === "string" &&
    typeof (raw as Record<string, unknown>)["secretKey"] === "string"
  );
}
