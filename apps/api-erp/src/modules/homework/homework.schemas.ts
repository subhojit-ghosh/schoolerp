import { z } from "zod";
import { HOMEWORK_SUBMISSION_STATUS } from "@repo/contracts";

const MAX_URL_LENGTH = 2048;

export const createHomeworkSchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
  subjectId: z.uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  attachmentInstructions: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  parentVisible: z.boolean().optional(),
  attachmentUrl: z.url().max(MAX_URL_LENGTH).optional().nullable(),
});

export const updateHomeworkSchema = z.object({
  classId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  subjectId: z.uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  attachmentInstructions: z.string().max(2000).optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  parentVisible: z.boolean().optional(),
  attachmentUrl: z.url().max(MAX_URL_LENGTH).optional().nullable(),
});

export const listHomeworkQuerySchema = z.object({
  q: z.string().optional(),
  campusId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z
    .enum(["dueDate", "title", "status", "publishedAt", "createdAt"])
    .default("dueDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const upsertSubmissionSchema = z.object({
  studentId: z.uuid(),
  status: z.enum([
    HOMEWORK_SUBMISSION_STATUS.SUBMITTED,
    HOMEWORK_SUBMISSION_STATUS.NOT_SUBMITTED,
    HOMEWORK_SUBMISSION_STATUS.LATE,
  ]),
  remarks: z.string().max(1000).optional().nullable(),
  attachmentUrl: z.url().max(MAX_URL_LENGTH).optional().nullable(),
});

export const bulkUpsertSubmissionsSchema = z.object({
  submissions: z.array(upsertSubmissionSchema).min(1),
});

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
});

export type CreateHomeworkDto = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkDto = z.infer<typeof updateHomeworkSchema>;
export type ListHomeworkQueryDto = z.infer<typeof listHomeworkQuerySchema>;
export type UpsertSubmissionDto = z.infer<typeof upsertSubmissionSchema>;
export type BulkUpsertSubmissionsDto = z.infer<
  typeof bulkUpsertSubmissionsSchema
>;
export type ListSubmissionsQueryDto = z.infer<
  typeof listSubmissionsQuerySchema
>;

import { BadRequestException } from "@nestjs/common";

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateHomework(input: unknown) {
  return parseOrBadRequest(createHomeworkSchema, input);
}

export function parseUpdateHomework(input: unknown) {
  return parseOrBadRequest(updateHomeworkSchema, input);
}

export function parseListHomeworkQuery(input: unknown) {
  return parseOrBadRequest(listHomeworkQuerySchema, input);
}

export function parseBulkUpsertSubmissions(input: unknown) {
  return parseOrBadRequest(bulkUpsertSubmissionsSchema, input);
}

export function parseListSubmissionsQuery(input: unknown) {
  return parseOrBadRequest(listSubmissionsQuerySchema, input);
}
