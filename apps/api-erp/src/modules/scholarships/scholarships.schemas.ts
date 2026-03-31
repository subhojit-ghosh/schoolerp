import { BadRequestException } from "@nestjs/common";
import {
  scholarshipTypeSchema,
  scholarshipStatusSchema,
  scholarshipApplicationStatusSchema,
  dbtStatusSchema,
} from "@repo/contracts";
import { z } from "zod";

// ── Scholarships ────────────────────────────────────────────────────────────

export const createScholarshipSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  scholarshipType: scholarshipTypeSchema,
  amountInPaise: z.number().int().positive().optional(),
  percentageDiscount: z.number().int().min(1).max(10000).optional(),
  eligibilityCriteria: z.string().max(2000).optional(),
  maxRecipients: z.number().int().positive().optional(),
  academicYearId: z.uuid().optional(),
  renewalRequired: z.boolean().default(false),
  renewalPeriodMonths: z.number().int().positive().optional(),
});

export const updateScholarshipSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  scholarshipType: scholarshipTypeSchema.optional(),
  amountInPaise: z.number().int().positive().optional().nullable(),
  percentageDiscount: z.number().int().min(1).max(10000).optional().nullable(),
  eligibilityCriteria: z.string().max(2000).optional().nullable(),
  maxRecipients: z.number().int().positive().optional().nullable(),
  academicYearId: z.uuid().optional().nullable(),
  renewalRequired: z.boolean().optional(),
  renewalPeriodMonths: z.number().int().positive().optional().nullable(),
});

export const updateScholarshipStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listScholarshipsQuerySchema = z.object({
  q: z.string().optional(),
  scholarshipType: scholarshipTypeSchema.optional(),
  status: z.enum(["active", "inactive"]).optional(),
  academicYearId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Applications ────────────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  scholarshipId: z.uuid(),
  studentId: z.uuid(),
});

export const listApplicationsQuerySchema = z.object({
  q: z.string().optional(),
  scholarshipId: z.string().optional(),
  status: scholarshipApplicationStatusSchema.optional(),
  dbtStatus: dbtStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const reviewApplicationSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

export const updateDbtStatusSchema = z.object({
  dbtStatus: dbtStatusSchema,
  dbtTransactionId: z.string().max(200).optional(),
});

export const renewApplicationSchema = z.object({
  applicationId: z.uuid(),
});

export const listExpiringApplicationsQuerySchema = z.object({
  daysUntilExpiry: z.coerce.number().int().positive().default(30),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreateScholarshipDto = z.infer<typeof createScholarshipSchema>;
export type UpdateScholarshipDto = z.infer<typeof updateScholarshipSchema>;
export type UpdateScholarshipStatusDto = z.infer<
  typeof updateScholarshipStatusSchema
>;
export type ListScholarshipsQueryDto = z.infer<
  typeof listScholarshipsQuerySchema
>;
export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
export type ListApplicationsQueryDto = z.infer<
  typeof listApplicationsQuerySchema
>;
export type ReviewApplicationDto = z.infer<typeof reviewApplicationSchema>;
export type UpdateDbtStatusDto = z.infer<typeof updateDbtStatusSchema>;
export type RenewApplicationDto = z.infer<typeof renewApplicationSchema>;
export type ListExpiringApplicationsQueryDto = z.infer<
  typeof listExpiringApplicationsQuerySchema
>;

// ── Parse helpers ───────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateScholarship(input: unknown) {
  return parseOrBadRequest(createScholarshipSchema, input);
}
export function parseUpdateScholarship(input: unknown) {
  return parseOrBadRequest(updateScholarshipSchema, input);
}
export function parseUpdateScholarshipStatus(input: unknown) {
  return parseOrBadRequest(updateScholarshipStatusSchema, input);
}
export function parseListScholarshipsQuery(input: unknown) {
  return parseOrBadRequest(listScholarshipsQuerySchema, input);
}
export function parseCreateApplication(input: unknown) {
  return parseOrBadRequest(createApplicationSchema, input);
}
export function parseListApplicationsQuery(input: unknown) {
  return parseOrBadRequest(listApplicationsQuerySchema, input);
}
export function parseReviewApplication(input: unknown) {
  return parseOrBadRequest(reviewApplicationSchema, input);
}
export function parseUpdateDbtStatus(input: unknown) {
  return parseOrBadRequest(updateDbtStatusSchema, input);
}
export function parseRenewApplication(input: unknown) {
  return parseOrBadRequest(renewApplicationSchema, input);
}
export function parseListExpiringApplicationsQuery(input: unknown) {
  return parseOrBadRequest(listExpiringApplicationsQuerySchema, input);
}
