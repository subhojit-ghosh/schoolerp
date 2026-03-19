import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const SUBJECT_NAME_MIN_LENGTH = 1;

export const sortableSubjectColumns = {
  name: "name",
  status: "status",
  code: "code",
} as const;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(SUBJECT_NAME_MIN_LENGTH, "Subject name is required"),
  code: z.string().trim().min(1).max(20).optional(),
});

export const updateSubjectSchema = createSubjectSchema;

export const setSubjectStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listSubjectsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableSubjectColumns.name,
      sortableSubjectColumns.status,
      sortableSubjectColumns.code,
    ])
    .optional(),
});

export const subjectIdSchema = z.object({
  subjectId: z.uuid(),
});

export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;
export type SetSubjectStatusDto = z.infer<typeof setSubjectStatusSchema>;
type ListSubjectsQueryInput = z.infer<typeof listSubjectsQuerySchema>;
export type ListSubjectsQueryDto = Omit<ListSubjectsQueryInput, "q"> & {
  search?: string;
};

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseCreateSubject(body: unknown): CreateSubjectDto {
  return parseSchema(createSubjectSchema, body);
}

export function parseUpdateSubject(body: unknown): UpdateSubjectDto {
  return parseSchema(updateSubjectSchema, body);
}

export function parseSetSubjectStatus(body: unknown): SetSubjectStatusDto {
  return parseSchema(setSubjectStatusSchema, body);
}

export function parseListSubjectsQuery(query: unknown): ListSubjectsQueryDto {
  const result = parseSchema(listSubjectsQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}

export function normalizeSubjectCode(code: string | undefined) {
  const value = code?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function normalizeSubjectName(name: string) {
  return name.trim();
}
