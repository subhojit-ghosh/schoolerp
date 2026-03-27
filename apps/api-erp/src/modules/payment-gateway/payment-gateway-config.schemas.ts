import { z } from "zod";
import { PAYMENT_PROVIDERS } from "@repo/contracts";

const allProviders = Object.values(PAYMENT_PROVIDERS) as [string, ...string[]];

const upsertPaymentConfigSchema = z.object({
  provider: z.enum(allProviders as [string, ...string[]]),
  credentials: z.record(z.string(), z.string().min(1)),
  displayLabel: z.string().optional().nullable(),
});

const createPaymentOrderSchema = z.object({
  feeAssignmentId: z.string().min(1),
  amountInPaise: z.number().int().positive(),
  studentName: z.string().optional(),
  guardianMobile: z.string().optional(),
  guardianEmail: z.string().optional().nullable(),
  description: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  internalOrderId: z.string().min(1),
  externalOrderId: z.string().min(1),
  externalPaymentId: z.string().min(1),
  externalSignature: z.string().optional().default(""),
});

export type UpsertPaymentConfig = z.infer<typeof upsertPaymentConfigSchema>;
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export function parseUpsertPaymentConfig(
  raw: unknown,
): UpsertPaymentConfig {
  return upsertPaymentConfigSchema.parse(raw);
}

export function parseCreatePaymentOrder(
  raw: unknown,
): CreatePaymentOrderInput {
  return createPaymentOrderSchema.parse(raw);
}

export function parseVerifyPayment(raw: unknown): VerifyPaymentInput {
  return verifyPaymentSchema.parse(raw);
}
