import { guardianRelationshipSchema } from "@repo/contracts";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

export const guardianIdSchema = z.object({
  guardianId: z.uuid(),
});

export const sortableGuardianColumns = {
  campus: "campus",
  name: "name",
  status: "status",
} as const;

export const updateGuardianSchema = z.object({
  name: z.string().trim().min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  campusId: z.uuid(),
});

export const linkGuardianStudentSchema = z.object({
  studentId: z.uuid(),
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean().default(false),
});

export const updateGuardianStudentLinkSchema = z.object({
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean(),
});

export const listGuardiansQuerySchema = baseListQuerySchema.extend({
  campusId: z.uuid().optional(),
  sort: z
    .enum([
      sortableGuardianColumns.campus,
      sortableGuardianColumns.name,
      sortableGuardianColumns.status,
    ])
    .optional(),
});

export type UpdateGuardianDto = z.infer<typeof updateGuardianSchema>;
export type LinkGuardianStudentDto = z.infer<typeof linkGuardianStudentSchema>;
export type UpdateGuardianStudentLinkDto = z.infer<
  typeof updateGuardianStudentLinkSchema
>;
type ListGuardiansQueryInput = z.infer<typeof listGuardiansQuerySchema>;
export type ListGuardiansQueryDto = Omit<ListGuardiansQueryInput, "q"> & {
  search?: string;
};

export function parseUpdateGuardian(input: unknown) {
  return updateGuardianSchema.parse(input);
}

export function parseLinkGuardianStudent(input: unknown) {
  return linkGuardianStudentSchema.parse(input);
}

export function parseUpdateGuardianStudentLink(input: unknown) {
  return updateGuardianStudentLinkSchema.parse(input);
}

export function parseListGuardiansQuery(query: unknown): ListGuardiansQueryDto {
  const result = parseListQuerySchema(listGuardiansQuerySchema, query);

  return {
    campusId: result.campusId,
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
