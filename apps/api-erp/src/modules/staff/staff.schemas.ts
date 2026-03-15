import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { STATUS } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

export const createStaffSchema = z.object({
  name: z.string().trim().min(NAME_MIN_LENGTH, "Staff name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Staff mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  campusId: z.uuid(),
  status: z.enum([
    STATUS.MEMBER.ACTIVE,
    STATUS.MEMBER.INACTIVE,
    STATUS.MEMBER.SUSPENDED,
  ]),
});

export const updateStaffSchema = createStaffSchema;

export const setStaffStatusSchema = z.object({
  status: z.enum([STATUS.MEMBER.ACTIVE, STATUS.MEMBER.INACTIVE]),
});

export const createStaffRoleAssignmentSchema = z.object({
  roleId: z.string().trim().min(1, "Role is required"),
  campusId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  classId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  sectionId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const sortableStaffColumns = {
  campus: "campus",
  name: "name",
  status: "status",
} as const;

export const listStaffQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableStaffColumns.campus,
      sortableStaffColumns.name,
      sortableStaffColumns.status,
    ])
    .optional(),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
export type SetStaffStatusDto = z.infer<typeof setStaffStatusSchema>;
export type CreateStaffRoleAssignmentDto = z.infer<
  typeof createStaffRoleAssignmentSchema
>;
type ListStaffQueryInput = z.infer<typeof listStaffQuerySchema>;
export type ListStaffQueryDto = Omit<ListStaffQueryInput, "q"> & {
  search?: string;
};

function parseSchema<T>(schema: z.ZodSchema<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateStaff(body: unknown) {
  return parseSchema(createStaffSchema, body);
}

export function parseUpdateStaff(body: unknown) {
  return parseSchema(updateStaffSchema, body);
}

export function parseSetStaffStatus(body: unknown) {
  return parseSchema(setStaffStatusSchema, body);
}

export function parseCreateStaffRoleAssignment(body: unknown) {
  return parseSchema(createStaffRoleAssignmentSchema, body);
}

export function parseListStaffQuery(query: unknown): ListStaffQueryDto {
  const result = parseListQuerySchema(listStaffQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
