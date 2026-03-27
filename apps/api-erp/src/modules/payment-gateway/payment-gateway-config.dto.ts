export class PaymentConfigDto {
  declare id: string;
  declare provider: string;
  declare displayLabel: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class UpsertPaymentConfigBodyDto {
  declare provider: string;
  declare credentials: Record<string, string>;
  displayLabel?: string | null;
}

export class CreatePaymentOrderBodyDto {
  declare feeAssignmentId: string;
  declare amountInPaise: number;
  studentName?: string;
  guardianMobile?: string;
  guardianEmail?: string | null;
  description?: string;
}

export class VerifyPaymentBodyDto {
  declare internalOrderId: string;
  declare externalOrderId: string;
  declare externalPaymentId: string;
  externalSignature?: string;
}

export class PaymentOrderResultDto {
  declare orderId: string;
  declare provider: string;
  declare checkoutData: Record<string, unknown>;
  declare expiresAt: Date;
}
