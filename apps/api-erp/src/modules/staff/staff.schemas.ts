import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { HONORIFICS, STATUS } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const STAFF_GENDER = ["male", "female", "other"] as const;
export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contractual",
] as const;

const staffProfileSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  designation: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  department: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  dateOfJoining: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  gender: z
    .enum(STAFF_GENDER)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  bloodGroup: z
    .enum(BLOOD_GROUPS)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  address: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  emergencyContactName: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  emergencyContactMobile: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  qualification: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  experienceYears: z.coerce.number().int().min(0).optional().nullable(),
  employmentType: z
    .enum(EMPLOYMENT_TYPES)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

const staffBaseSchema = z.object({
  honorific: z
    .enum(HONORIFICS)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  name: z.string().trim().min(NAME_MIN_LENGTH, "Staff name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Staff mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  status: z.enum([
    STATUS.MEMBER.ACTIVE,
    STATUS.MEMBER.INACTIVE,
    STATUS.MEMBER.SUSPENDED,
  ]),
  profile: staffProfileSchema.optional(),
});

export const createStaffSchema = staffBaseSchema.extend({
  temporaryPassword: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    ),
});

export const updateStaffSchema = staffBaseSchema;

export const setStaffStatusSchema = z.object({
  status: z.enum([
    STATUS.MEMBER.ACTIVE,
    STATUS.MEMBER.INACTIVE,
    STATUS.MEMBER.SUSPENDED,
  ]),
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
  designation: "designation",
  name: "name",
  status: "status",
} as const;

export const listStaffQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableStaffColumns.campus,
      sortableStaffColumns.designation,
      sortableStaffColumns.name,
      sortableStaffColumns.status,
    ])
    .optional(),
  status: z
    .union([
      z.enum([
        STATUS.MEMBER.ACTIVE,
        STATUS.MEMBER.INACTIVE,
        STATUS.MEMBER.SUSPENDED,
      ]),
      z
        .enum([
          STATUS.MEMBER.ACTIVE,
          STATUS.MEMBER.INACTIVE,
          STATUS.MEMBER.SUSPENDED,
        ])
        .array(),
    ])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
});

export const createSubjectTeacherAssignmentSchema = z.object({
  subjectId: z.string().trim().min(1, "Subject is required"),
  classId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  academicYearId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
export type SetStaffStatusDto = z.infer<typeof setStaffStatusSchema>;
export type StaffProfileDto = z.infer<typeof staffProfileSchema>;
export type CreateStaffRoleAssignmentDto = z.infer<
  typeof createStaffRoleAssignmentSchema
>;
export type CreateSubjectTeacherAssignmentDto = z.infer<
  typeof createSubjectTeacherAssignmentSchema
>;
type ListStaffQueryInput = z.infer<typeof listStaffQuerySchema>;
export type ListStaffQueryDto = Omit<ListStaffQueryInput, "q" | "status"> & {
  search?: string;
  status?: ("active" | "inactive" | "suspended")[];
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

export function parseCreateSubjectTeacherAssignment(body: unknown) {
  return parseSchema(createSubjectTeacherAssignmentSchema, body);
}

export function parseListStaffQuery(query: unknown): ListStaffQueryDto {
  const result = parseListQuerySchema(listStaffQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
    status: result.status,
  };
}
