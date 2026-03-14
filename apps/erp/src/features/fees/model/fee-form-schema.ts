import { FEE_PAYMENT_METHODS, FEE_STRUCTURE_SCOPES } from "@repo/contracts";
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

const optionalTextSchema = z.string().trim().optional().or(z.literal(""));
const amountFieldSchema = z
  .string()
  .trim()
  .min(1, "Enter a valid amount")
  .refine((value) => Number(value) > 0, "Enter a valid amount");

export const feeStructureFormSchema = z.object({
  academicYearId: z.uuid("Select an academic year"),
  campusId: z.uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Structure name is required"),
  description: optionalTextSchema,
  scope: z.enum(FEE_STRUCTURE_SCOPE_OPTIONS),
  amount: amountFieldSchema,
  dueDate: z.string().min(1, "Due date is required"),
});

export const feeAssignmentFormSchema = z.object({
  feeStructureId: z.uuid("Select a fee structure"),
  studentId: z.uuid("Select a student"),
  amount: amountFieldSchema,
  dueDate: z.string().min(1, "Due date is required"),
  notes: optionalTextSchema,
});

export const feePaymentFormSchema = z.object({
  feeAssignmentId: z.uuid("Select an assignment"),
  amount: amountFieldSchema,
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(FEE_PAYMENT_METHOD_OPTIONS),
  referenceNumber: optionalTextSchema,
  notes: optionalTextSchema,
});

export type FeeStructureFormValues = z.infer<typeof feeStructureFormSchema>;
export type FeeAssignmentFormValues = z.infer<typeof feeAssignmentFormSchema>;
export type FeePaymentFormValues = z.infer<typeof feePaymentFormSchema>;

export type FeeStructureRecord = components["schemas"]["FeeStructureDto"];
export type FeeAssignmentRecord = components["schemas"]["FeeAssignmentDto"];
export type FeePaymentRecord = components["schemas"]["FeePaymentDto"];
