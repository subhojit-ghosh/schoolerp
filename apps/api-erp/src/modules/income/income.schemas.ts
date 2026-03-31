import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { incomeCategorySchema } from "@repo/contracts";

// ── Records ─────────────────────────────────────────────────────────────────

export const createRecordSchema = z.object({
  campusId: z.uuid().optional(),
  category: incomeCategorySchema,
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  amountInPaise: z.number().int().positive(),
  incomeDate: z.string().min(1),
  sourceEntity: z.string().max(200).optional(),
  referenceNumber: z.string().max(200).optional(),
  receiptUploadId: z.uuid().optional(),
});

export const updateRecordSchema = z.object({
  campusId: z.uuid().optional().nullable(),
  category: incomeCategorySchema.optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  amountInPaise: z.number().int().positive().optional(),
  incomeDate: z.string().min(1).optional(),
  sourceEntity: z.string().max(200).optional().nullable(),
  referenceNumber: z.string().max(200).optional().nullable(),
  receiptUploadId: z.uuid().optional().nullable(),
});

export const listRecordsQuerySchema = z.object({
  q: z.string().optional(),
  category: incomeCategorySchema.optional(),
  campusId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z
    .enum(["incomeDate", "amountInPaise", "createdAt"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Summary ─────────────────────────────────────────────────────────────────

export const incomeSummaryQuerySchema = z.object({
  campusId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreateRecordDto = z.infer<typeof createRecordSchema>;
export type UpdateRecordDto = z.infer<typeof updateRecordSchema>;
export type ListRecordsQueryDto = z.infer<typeof listRecordsQuerySchema>;
export type IncomeSummaryQueryDto = z.infer<typeof incomeSummaryQuerySchema>;

// ── Parse helpers ───────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateRecord(input: unknown) {
  return parseOrBadRequest(createRecordSchema, input);
}
export function parseUpdateRecord(input: unknown) {
  return parseOrBadRequest(updateRecordSchema, input);
}
export function parseListRecords(input: unknown) {
  return parseOrBadRequest(listRecordsQuerySchema, input);
}
export function parseIncomeSummaryQuery(input: unknown) {
  return parseOrBadRequest(incomeSummaryQuerySchema, input);
}
