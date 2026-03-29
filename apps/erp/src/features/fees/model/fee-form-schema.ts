import {
  FEE_ADJUSTMENT_TYPES,
  FEE_CATEGORIES,
  FEE_PAYMENT_METHODS,
  FEE_STRUCTURE_SCOPES,
  FEE_STRUCTURE_STATUSES,
} from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

export const FEE_STRUCTURE_SCOPE_OPTIONS = [
  FEE_STRUCTURE_SCOPES.INSTITUTION,
  FEE_STRUCTURE_SCOPES.CAMPUS,
] as const;

export const FEE_PAYMENT_METHOD_OPTIONS = [
  FEE_PAYMENT_METHODS.CASH,
  FEE_PAYMENT_METHODS.UPI,
  FEE_PAYMENT_METHODS.BANK_TRANSFER,
  FEE_PAYMENT_METHODS.CARD,
] as const;
export const FEE_STRUCTURE_STATUS_OPTIONS = [
  FEE_STRUCTURE_STATUSES.ACTIVE,
  FEE_STRUCTURE_STATUSES.ARCHIVED,
] as const;
export const FEE_ADJUSTMENT_TYPE_OPTIONS = [
  FEE_ADJUSTMENT_TYPES.WAIVER,
  FEE_ADJUSTMENT_TYPES.DISCOUNT,
] as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalTextSchema = z.string().trim().optional().or(z.literal(""));
const amountFieldSchema = z
  .string()
  .trim()
  .min(1, "Enter a valid amount")
  .refine((value) => Number(value) > 0, "Enter a valid amount");
const dateFieldSchema = z
  .string()
  .min(1, "Due date is required")
  .regex(DATE_PATTERN, "Date must be in YYYY-MM-DD format");

const installmentSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  amount: amountFieldSchema,
  dueDate: dateFieldSchema,
});

export const FEE_CATEGORY_OPTIONS = [
  FEE_CATEGORIES.TUITION,
  FEE_CATEGORIES.TRANSPORT,
  FEE_CATEGORIES.HOSTEL,
  FEE_CATEGORIES.LAB,
  FEE_CATEGORIES.MISC,
] as const;

export const feeStructureFormSchema = z.object({
  academicYearId: z.uuid("Select an academic year"),
  name: z.string().trim().min(1, "Structure name is required"),
  description: optionalTextSchema,
  scope: z.enum(FEE_STRUCTURE_SCOPE_OPTIONS),
  category: z.string().optional().or(z.literal("")),
  installments: z
    .array(installmentSchema)
    .min(1, "Add at least one installment"),
});

export const feeAssignmentFormSchema = z.object({
  feeStructureId: z.uuid("Select a fee structure"),
  studentId: z.uuid("Select a student"),
  notes: optionalTextSchema,
});

export const feePaymentFormSchema = z.object({
  feeAssignmentId: z.uuid("Select an assignment"),
  amount: amountFieldSchema,
  paymentDate: dateFieldSchema,
  paymentMethod: z.enum(FEE_PAYMENT_METHOD_OPTIONS),
  referenceNumber: optionalTextSchema,
  notes: optionalTextSchema,
});

export function createFeePaymentFormSchema(outstandingAmountInPaise: number) {
  return feePaymentFormSchema.refine(
    (value) => Number(value.amount) * 100 <= outstandingAmountInPaise,
    {
      message: "Amount cannot exceed the outstanding balance",
      path: ["amount"],
    },
  );
}

export const feeStructureUpdateFormSchema = z.object({
  name: z.string().trim().min(1, "Structure name is required"),
  description: optionalTextSchema,
  installments: z
    .array(installmentSchema)
    .min(1, "Add at least one installment"),
});

export const feeAssignmentUpdateFormSchema = z.object({
  dueDate: dateFieldSchema,
  notes: optionalTextSchema,
});

export const feeBulkAssignmentFormSchema = z.object({
  feeStructureId: z.uuid("Select a fee structure"),
  classId: z.uuid("Select a class"),
  notes: optionalTextSchema,
});

export const feeAdjustmentFormSchema = z.object({
  adjustmentType: z.enum(FEE_ADJUSTMENT_TYPE_OPTIONS),
  amount: amountFieldSchema,
  reason: optionalTextSchema,
});

export type FeeStructureFormValues = z.infer<typeof feeStructureFormSchema>;
export type FeeStructureUpdateFormValues = z.infer<
  typeof feeStructureUpdateFormSchema
>;
export type FeeAssignmentFormValues = z.infer<typeof feeAssignmentFormSchema>;
export type FeeAssignmentUpdateFormValues = z.infer<
  typeof feeAssignmentUpdateFormSchema
>;
export type FeePaymentFormValues = z.infer<typeof feePaymentFormSchema>;
export type FeeBulkAssignmentFormValues = z.infer<
  typeof feeBulkAssignmentFormSchema
>;
export type FeeAdjustmentFormValues = z.infer<typeof feeAdjustmentFormSchema>;

export type FeeStructureRecord = components["schemas"]["FeeStructureDto"];
export type FeeAssignmentRecord = components["schemas"]["FeeAssignmentDto"];
export type FeePaymentRecord = components["schemas"]["FeePaymentDto"];
