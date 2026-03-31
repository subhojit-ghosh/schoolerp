import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  expenseCategoryStatusSchema,
  expenseStatusSchema,
} from "@repo/contracts";

// ── Categories ───────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  budgetHeadCode: z.string().max(100).optional(),
  parentCategoryId: z.uuid().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  budgetHeadCode: z.string().max(100).optional().nullable(),
  parentCategoryId: z.uuid().optional().nullable(),
});

export const updateCategoryStatusSchema = z.object({
  status: expenseCategoryStatusSchema,
});

export const listCategoriesQuerySchema = z.object({
  q: z.string().optional(),
  status: expenseCategoryStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Expenses ────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  campusId: z.uuid().optional(),
  categoryId: z.uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  amountInPaise: z.number().int().positive(),
  expenseDate: z.string().min(1),
  departmentName: z.string().max(200).optional(),
  vendorName: z.string().max(200).optional(),
  referenceNumber: z.string().max(200).optional(),
  receiptUploadId: z.uuid().optional(),
});

export const updateExpenseSchema = z.object({
  campusId: z.uuid().optional().nullable(),
  categoryId: z.uuid().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  amountInPaise: z.number().int().positive().optional(),
  expenseDate: z.string().min(1).optional(),
  departmentName: z.string().max(200).optional().nullable(),
  vendorName: z.string().max(200).optional().nullable(),
  referenceNumber: z.string().max(200).optional().nullable(),
  receiptUploadId: z.uuid().optional().nullable(),
});

export const listExpensesQuerySchema = z.object({
  q: z.string().optional(),
  status: expenseStatusSchema.optional(),
  categoryId: z.string().optional(),
  campusId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z
    .enum(["expenseDate", "amountInPaise", "createdAt"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Workflow ────────────────────────────────────────────────────────────────

export const rejectExpenseSchema = z.object({
  rejectionReason: z.string().min(1).max(2000),
});

export const markPaidSchema = z.object({
  paymentMethod: z.string().min(1).max(100),
  paymentReference: z.string().max(200).optional(),
});

// ── Summary ─────────────────────────────────────────────────────────────────

export const expenseSummaryQuerySchema = z.object({
  campusId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryStatusDto = z.infer<
  typeof updateCategoryStatusSchema
>;
export type ListCategoriesQueryDto = z.infer<typeof listCategoriesQuerySchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQueryDto = z.infer<typeof listExpensesQuerySchema>;
export type RejectExpenseDto = z.infer<typeof rejectExpenseSchema>;
export type MarkPaidDto = z.infer<typeof markPaidSchema>;
export type ExpenseSummaryQueryDto = z.infer<typeof expenseSummaryQuerySchema>;

// ── Parse helpers ───────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateCategory(input: unknown) {
  return parseOrBadRequest(createCategorySchema, input);
}
export function parseUpdateCategory(input: unknown) {
  return parseOrBadRequest(updateCategorySchema, input);
}
export function parseUpdateCategoryStatus(input: unknown) {
  return parseOrBadRequest(updateCategoryStatusSchema, input);
}
export function parseListCategories(input: unknown) {
  return parseOrBadRequest(listCategoriesQuerySchema, input);
}
export function parseCreateExpense(input: unknown) {
  return parseOrBadRequest(createExpenseSchema, input);
}
export function parseUpdateExpense(input: unknown) {
  return parseOrBadRequest(updateExpenseSchema, input);
}
export function parseListExpenses(input: unknown) {
  return parseOrBadRequest(listExpensesQuerySchema, input);
}
export function parseRejectExpense(input: unknown) {
  return parseOrBadRequest(rejectExpenseSchema, input);
}
export function parseMarkPaid(input: unknown) {
  return parseOrBadRequest(markPaidSchema, input);
}
export function parseExpenseSummaryQuery(input: unknown) {
  return parseOrBadRequest(expenseSummaryQuerySchema, input);
}
