import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookPaymentEvent,
} from "../payment-gateway.types";

type CustomCredentials = {
  webhookSecret: string;
};

/**
 * Custom/generic payment gateway provider.
 * Creates an internal order and returns checkout data containing the order ID.
 * Payment confirmation happens exclusively via webhook.
 * Useful for: custom in-house PG integrations, bank direct integrations,
 * or any PG not natively supported.
 */
export class CustomProvider implements PaymentGatewayProvider {
  readonly provider = "custom" as const;
  private readonly webhookSecret: string;

  constructor(credentials: CustomCredentials) {
    this.webhookSecret = credentials.webhookSecret;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // For custom providers, the external order ID is our internal order ID
    // The PG or custom integration will call our webhook with this ID
    return {
      externalOrderId: input.internalOrderId,
      checkoutData: {
        orderId: input.internalOrderId,
        amountInPaise: input.amountInPaise,
        currency: input.currency,
        description: input.description,
        customerName: input.customerName,
        customerMobile: input.customerMobile,
      },
    };
  }

  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<VerifyPaymentResult> {
    // Custom providers must use webhooks — client-side verify is a pass-through
    return { success: true, externalPaymentId: input.externalPaymentId };
  }

  async parseWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<WebhookPaymentEvent | null> {
    // Expects HMAC-SHA256 of the raw body using webhookSecret
    const expectedSignature = createHmac("sha256", this.webhookSecret)
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
      type: "payment.captured" | "payment.failed";
      orderId: string;
      paymentId: string;
      amountInPaise: number;
    };

    if (
      event.type === "payment.captured" ||
      event.type === "payment.failed"
    ) {
      return {
        type: event.type,
        externalOrderId: event.orderId,
        externalPaymentId: event.paymentId,
        amountInPaise: event.amountInPaise,
      };
    }

    return null;
  }
}

export function isCustomCredentials(raw: unknown): raw is CustomCredentials {
  return (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as Record<string, unknown>)["webhookSecret"] === "string"
  );
}
