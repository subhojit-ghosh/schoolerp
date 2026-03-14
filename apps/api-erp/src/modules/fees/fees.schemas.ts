import { BadRequestException } from "@nestjs/common";
import { FEE_PAYMENT_METHODS, FEE_STRUCTURE_SCOPES } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const MONEY_MIN_AMOUNT = 0;

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const createFeeStructureSchema = z
  .object({
    academicYearId: z.uuid(),
    campusId: z
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    name: z.string().trim().min(1, "Fee structure name is required"),
    description: optionalTextSchema,
    scope: z.enum([
      FEE_STRUCTURE_SCOPES.INSTITUTION,
      FEE_STRUCTURE_SCOPES.CAMPUS,
    ]),
    amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
    dueDate: z.string().min(1, "Due date is required"),
  })
  .superRefine((value, ctx) => {
    if (value.scope === FEE_STRUCTURE_SCOPES.CAMPUS && !value.campusId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["campusId"],
        message: ERROR_MESSAGES.FEES.FEE_STRUCTURE_SCOPE_INVALID,
      });
    }
  });

export const createFeeAssignmentSchema = z.object({
  feeStructureId: z.uuid(),
  studentId: z.uuid(),
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
  dueDate: z.string().min(1, "Due date is required"),
  notes: optionalTextSchema,
});

export const createFeePaymentSchema = z.object({
  feeAssignmentId: z.uuid(),
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum([
    FEE_PAYMENT_METHODS.CASH,
    FEE_PAYMENT_METHODS.UPI,
    FEE_PAYMENT_METHODS.BANK_TRANSFER,
    FEE_PAYMENT_METHODS.CARD,
  ]),
  referenceNumber: optionalTextSchema,
  notes: optionalTextSchema,
});

export type CreateFeeStructureDto = z.infer<typeof createFeeStructureSchema>;
export type CreateFeeAssignmentDto = z.infer<typeof createFeeAssignmentSchema>;
export type CreateFeePaymentDto = z.infer<typeof createFeePaymentSchema>;

function parseWithBadRequest<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateFeeStructure(input: unknown) {
  return parseWithBadRequest(createFeeStructureSchema, input);
}

export function parseCreateFeeAssignment(input: unknown) {
  return parseWithBadRequest(createFeeAssignmentSchema, input);
}

export function parseCreateFeePayment(input: unknown) {
  return parseWithBadRequest(createFeePaymentSchema, input);
}
