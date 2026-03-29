import { z } from "zod";

export const createHomeworkSchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
  subjectId: z.uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  attachmentInstructions: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
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
});

export const listHomeworkQuerySchema = z.object({
  q: z.string().optional(),
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

export type CreateHomeworkDto = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkDto = z.infer<typeof updateHomeworkSchema>;
export type ListHomeworkQueryDto = z.infer<typeof listHomeworkQuerySchema>;

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
