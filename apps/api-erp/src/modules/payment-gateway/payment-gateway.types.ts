import type { PaymentProvider } from "@repo/contracts";

export type CreateOrderInput = {
  internalOrderId: string;
  amountInPaise: number;
  currency: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string | null;
  description: string;
};

export type CreateOrderResult = {
  externalOrderId: string;
  /** Provider-specific data passed to frontend SDK (Razorpay key+orderId, PayU hash params, etc.) */
  checkoutData: Record<string, unknown>;
};

export type VerifyPaymentInput = {
  externalOrderId: string;
  externalPaymentId: string;
  externalSignature: string;
};

export type VerifyPaymentResult = {
  success: boolean;
  externalPaymentId: string;
};

export type WebhookPaymentEvent = {
  type: "payment.captured" | "payment.failed";
  externalOrderId: string;
  externalPaymentId: string;
  amountInPaise: number;
};

export interface PaymentGatewayProvider {
  readonly provider: PaymentProvider;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  /** Returns null when signature is invalid or event is not relevant */
  parseWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<WebhookPaymentEvent | null>;
}
