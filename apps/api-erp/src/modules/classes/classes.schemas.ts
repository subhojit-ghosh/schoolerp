import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const CLASS_NAME_MIN_LENGTH = 1;
const SECTION_NAME_MIN_LENGTH = 1;
export const sortableClassColumns = {
  name: "name",
  status: "status",
  campus: "campus",
} as const;

const sectionSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(SECTION_NAME_MIN_LENGTH, "Section name is required"),
});

function hasUniqueSectionNames(sections: Array<z.infer<typeof sectionSchema>>) {
  const names = sections.map((section) => section.name.trim().toLowerCase());
  return new Set(names).size === names.length;
}

export const createClassSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(CLASS_NAME_MIN_LENGTH, "Class name is required"),
    sections: z.array(sectionSchema).min(1, "Add at least one section"),
  })
  .refine((value) => hasUniqueSectionNames(value.sections), {
    path: ["sections"],
    message: ERROR_MESSAGES.CLASSES.SECTION_NAME_EXISTS,
  });

export const updateClassSchema = createClassSchema;

export const setClassStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listClassesQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableClassColumns.name,
      sortableClassColumns.status,
      sortableClassColumns.campus,
    ])
    .optional(),
});

export const classIdSchema = z.object({
  classId: z.uuid(),
});

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
export type SetClassStatusDto = z.infer<typeof setClassStatusSchema>;
type ListClassesQueryInput = z.infer<typeof listClassesQuerySchema>;
export type ListClassesQueryDto = Omit<ListClassesQueryInput, "q"> & {
  search?: string;
};

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseCreateClass(body: unknown): CreateClassDto {
  return parseSchema(createClassSchema, body);
}

export function parseUpdateClass(body: unknown): UpdateClassDto {
  return parseSchema(updateClassSchema, body);
}

export function parseSetClassStatus(body: unknown): SetClassStatusDto {
  return parseSchema(setClassStatusSchema, body);
}

export function parseListClassesQuery(query: unknown): ListClassesQueryDto {
  const result = parseSchema(listClassesQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
