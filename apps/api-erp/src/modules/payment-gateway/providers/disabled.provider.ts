import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookPaymentEvent,
} from "../payment-gateway.types";

/**
 * Disabled payment gateway — acts as a sentinel when no PG is configured.
 * All operations fail with a clear error.
 */
export class DisabledProvider implements PaymentGatewayProvider {
  readonly provider = "disabled" as const;

  async createOrder(_input: CreateOrderInput): Promise<CreateOrderResult> {
    throw new Error(
      "Online payment is not configured for this institution. " +
        "Please configure a payment gateway in Settings > Payment.",
    );
  }

  async verifyPayment(
    _input: VerifyPaymentInput,
  ): Promise<VerifyPaymentResult> {
    throw new Error("Online payment is not configured for this institution.");
  }

  async parseWebhookEvent(
    _payload: Buffer,
    _signature: string,
  ): Promise<WebhookPaymentEvent | null> {
    return null;
  }
}
