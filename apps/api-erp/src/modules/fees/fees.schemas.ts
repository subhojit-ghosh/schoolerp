import { BadRequestException } from "@nestjs/common";
import {
  FEE_ADJUSTMENT_TYPES,
  FEE_ASSIGNMENT_STATUSES,
  FEE_PAYMENT_METHODS,
  FEE_STRUCTURE_SCOPES,
  FEE_STRUCTURE_STATUSES,
} from "@repo/contracts";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const MONEY_MIN_AMOUNT = 0;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalTextSchema = z
  .string()
  .trim()
  .nullish()
  .or(z.literal(""))
  .transform((value) => value || undefined);
const dateStringSchema = z
  .string()
  .min(1, "Due date is required")
  .regex(DATE_PATTERN, "Date must be in YYYY-MM-DD format");

const installmentSchema = z.object({
  label: z.string().trim().min(1, "Installment label is required"),
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
  dueDate: dateStringSchema,
});

export const createFeeStructureSchema = z.object({
  academicYearId: z.uuid(),
  name: z.string().trim().min(1, "Fee structure name is required"),
  description: optionalTextSchema,
  scope: z.enum([
    FEE_STRUCTURE_SCOPES.INSTITUTION,
    FEE_STRUCTURE_SCOPES.CAMPUS,
  ]),
  installments: z
    .array(installmentSchema)
    .min(1, "At least one installment is required"),
});

export const updateFeeStructureSchema = z.object({
  name: z.string().trim().min(1, "Fee structure name is required").optional(),
  description: optionalTextSchema,
  installments: z.array(installmentSchema).min(1).optional(),
});

export const createFeeAssignmentSchema = z.object({
  feeStructureId: z.uuid(),
  studentId: z.uuid(),
  notes: optionalTextSchema,
});

export const updateFeeAssignmentSchema = z.object({
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT).optional(),
  dueDate: dateStringSchema.optional(),
  notes: optionalTextSchema,
});

export const createFeePaymentSchema = z.object({
  feeAssignmentId: z.uuid(),
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
  paymentDate: dateStringSchema,
  paymentMethod: z.enum([
    FEE_PAYMENT_METHODS.CASH,
    FEE_PAYMENT_METHODS.UPI,
    FEE_PAYMENT_METHODS.BANK_TRANSFER,
    FEE_PAYMENT_METHODS.CARD,
  ]),
  referenceNumber: optionalTextSchema,
  notes: optionalTextSchema,
});

export const bulkFeeAssignmentSchema = z.object({
  feeStructureId: z.uuid(),
  classId: z.uuid(),
  notes: optionalTextSchema,
});

export const setFeeStructureStatusSchema = z.object({
  status: z.enum([
    FEE_STRUCTURE_STATUSES.ACTIVE,
    FEE_STRUCTURE_STATUSES.ARCHIVED,
  ]),
});

export const createFeeAdjustmentSchema = z.object({
  feeAssignmentId: z.uuid(),
  adjustmentType: z.enum([
    FEE_ADJUSTMENT_TYPES.WAIVER,
    FEE_ADJUSTMENT_TYPES.DISCOUNT,
  ]),
  amount: z.coerce.number().gt(MONEY_MIN_AMOUNT),
  reason: optionalTextSchema,
});

export const reverseFeePaymentSchema = z.object({
  reason: optionalTextSchema,
});

export const sortableFeeStructureColumns = {
  name: "name",
  dueDate: "dueDate",
  amount: "amount",
  academicYear: "academicYear",
} as const;

export const sortableFeeAssignmentColumns = {
  studentName: "studentName",
  dueDate: "dueDate",
  status: "status",
  amount: "amount",
} as const;

export const listFeeStructuresQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableFeeStructureColumns.name,
      sortableFeeStructureColumns.dueDate,
      sortableFeeStructureColumns.amount,
      sortableFeeStructureColumns.academicYear,
    ])
    .optional(),
  academicYearId: z.uuid().optional(),
  status: z
    .enum([FEE_STRUCTURE_STATUSES.ACTIVE, FEE_STRUCTURE_STATUSES.ARCHIVED])
    .optional(),
});

export const listFeeAssignmentsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableFeeAssignmentColumns.studentName,
      sortableFeeAssignmentColumns.dueDate,
      sortableFeeAssignmentColumns.status,
      sortableFeeAssignmentColumns.amount,
    ])
    .optional(),
  feeStructureId: z.uuid().optional(),
  status: z
    .enum([
      FEE_ASSIGNMENT_STATUSES.PENDING,
      FEE_ASSIGNMENT_STATUSES.PARTIAL,
      FEE_ASSIGNMENT_STATUSES.PAID,
    ])
    .optional(),
});

export const listFeeDuesQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableFeeAssignmentColumns.studentName,
      sortableFeeAssignmentColumns.dueDate,
      sortableFeeAssignmentColumns.amount,
    ])
    .optional(),
  overdue: z.coerce.boolean().optional(),
});

export const collectionSummaryQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
});

export const feeDefaulterQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  campusId: z.uuid().optional(),
  classId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
});

export type CreateFeeStructureDto = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureDto = z.infer<typeof updateFeeStructureSchema>;
export type CreateFeeAssignmentDto = z.infer<typeof createFeeAssignmentSchema>;
export type UpdateFeeAssignmentDto = z.infer<typeof updateFeeAssignmentSchema>;
export type CreateFeePaymentDto = z.infer<typeof createFeePaymentSchema>;
export type BulkFeeAssignmentDto = z.infer<typeof bulkFeeAssignmentSchema>;
export type SetFeeStructureStatusDto = z.infer<
  typeof setFeeStructureStatusSchema
>;
export type CreateFeeAdjustmentDto = z.infer<typeof createFeeAdjustmentSchema>;
export type ReverseFeePaymentDto = z.infer<typeof reverseFeePaymentSchema>;

type ListFeeStructuresQueryInput = z.infer<typeof listFeeStructuresQuerySchema>;
export type ListFeeStructuresQueryDto = Omit<
  ListFeeStructuresQueryInput,
  "q"
> & {
  search?: string;
};

type ListFeeAssignmentsQueryInput = z.infer<
  typeof listFeeAssignmentsQuerySchema
>;
export type ListFeeAssignmentsQueryDto = Omit<
  ListFeeAssignmentsQueryInput,
  "q"
> & {
  search?: string;
};

type ListFeeDuesQueryInput = z.infer<typeof listFeeDuesQuerySchema>;
export type ListFeeDuesQueryDto = Omit<ListFeeDuesQueryInput, "q"> & {
  search?: string;
};

export type CollectionSummaryQueryDto = z.infer<
  typeof collectionSummaryQuerySchema
>;

export type FeeDefaulterQueryInput = z.infer<typeof feeDefaulterQuerySchema>;

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

export function parseUpdateFeeStructure(input: unknown) {
  return parseWithBadRequest(updateFeeStructureSchema, input);
}

export function parseCreateFeeAssignment(input: unknown) {
  return parseWithBadRequest(createFeeAssignmentSchema, input);
}

export function parseUpdateFeeAssignment(input: unknown) {
  return parseWithBadRequest(updateFeeAssignmentSchema, input);
}

export function parseCreateFeePayment(input: unknown) {
  return parseWithBadRequest(createFeePaymentSchema, input);
}

export function parseBulkFeeAssignment(input: unknown) {
  return parseWithBadRequest(bulkFeeAssignmentSchema, input);
}

export function parseSetFeeStructureStatus(input: unknown) {
  return parseWithBadRequest(setFeeStructureStatusSchema, input);
}

export function parseCreateFeeAdjustment(input: unknown) {
  return parseWithBadRequest(createFeeAdjustmentSchema, input);
}

export function parseReverseFeePayment(input: unknown) {
  return parseWithBadRequest(reverseFeePaymentSchema, input);
}

export function parseListFeeStructuresQuery(
  query: unknown,
): ListFeeStructuresQueryDto {
  const result = parseListQuerySchema(listFeeStructuresQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
    academicYearId: result.academicYearId,
    status: result.status,
  };
}

export function parseListFeeAssignmentsQuery(
  query: unknown,
): ListFeeAssignmentsQueryDto {
  const result = parseListQuerySchema(listFeeAssignmentsQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
    feeStructureId: result.feeStructureId,
    status: result.status,
  };
}

export function parseListFeeDuesQuery(query: unknown): ListFeeDuesQueryDto {
  const result = parseListQuerySchema(listFeeDuesQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
    overdue: result.overdue,
  };
}

export function parseCollectionSummaryQuery(
  query: unknown,
): CollectionSummaryQueryDto {
  return parseWithBadRequest(collectionSummaryQuerySchema, query);
}

export function parseFeeDefaulterQuery(
  query: unknown,
): FeeDefaulterQueryInput {
  return parseWithBadRequest(feeDefaulterQuerySchema, query);
}
