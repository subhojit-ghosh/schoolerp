import { guardianRelationshipSchema } from "@repo/contracts";
import { z } from "zod";
import { baseListQuerySchema, parseListQuerySchema } from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const ADMISSION_NUMBER_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

function hasExactlyOnePrimaryGuardian(guardians: { isPrimary: boolean }[]) {
  return guardians.filter((guardian) => guardian.isPrimary).length === 1;
}

export const createGuardianLinkSchema = z.object({
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
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean().default(false),
});

export const currentEnrollmentSchema = z.object({
  academicYearId: z.uuid(),
  classId: z.uuid(),
  sectionId: z.uuid(),
});

export const createStudentSchema = z
  .object({
    admissionNumber: z
      .string()
      .trim()
      .min(ADMISSION_NUMBER_MIN_LENGTH, "Admission number is required"),
    firstName: z.string().trim().min(NAME_MIN_LENGTH, "First name is required"),
    lastName: z.string().trim().optional(),
    classId: z.uuid(),
    sectionId: z.uuid(),
    campusId: z.uuid(),
    guardians: z
      .array(createGuardianLinkSchema)
      .min(1, "At least one guardian is required"),
    currentEnrollment: currentEnrollmentSchema
      .nullish()
      .transform((value) => value ?? null),
  })
  .refine((value) => hasExactlyOnePrimaryGuardian(value.guardians), {
    path: ["guardians"],
    message: "Select exactly one primary guardian.",
  });

export const updateStudentSchema = createStudentSchema;

export const sortableStudentColumns = {
  admissionNumber: "admissionNumber",
  campus: "campus",
  name: "name",
} as const;

export const listStudentsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableStudentColumns.admissionNumber,
      sortableStudentColumns.campus,
      sortableStudentColumns.name,
    ])
    .optional(),
});

export const studentIdSchema = z.object({
  studentId: z.uuid(),
});

export type CreateGuardianLinkDto = z.infer<typeof createGuardianLinkSchema>;
export type CurrentEnrollmentDto = z.infer<typeof currentEnrollmentSchema>;
export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
type ListStudentsQueryInput = z.infer<typeof listStudentsQuerySchema>;
export type ListStudentsQueryDto = Omit<ListStudentsQueryInput, "q"> & {
  search?: string;
};

export function parseCreateStudent(input: unknown) {
  return createStudentSchema.parse(input);
}

export function parseUpdateStudent(input: unknown) {
  return updateStudentSchema.parse(input);
}

export function parseListStudentsQuery(query: unknown): ListStudentsQueryDto {
  const result = parseListQuerySchema(listStudentsQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
