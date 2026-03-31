import {
  disciplinarySeveritySchema,
  guardianRelationshipSchema,
} from "@repo/contracts";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const ADMISSION_NUMBER_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;
const DESCRIPTION_MIN_LENGTH = 1;
const TC_NUMBER_MIN_LENGTH = 1;
const optionalCustomFieldValuesSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

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
    guardians: z
      .array(createGuardianLinkSchema)
      .min(1, "At least one guardian is required"),
    customFieldValues: optionalCustomFieldValuesSchema,
    currentEnrollment: currentEnrollmentSchema
      .nullish()
      .transform((value) => value ?? null),
    photoUrl: z
      .url()
      .nullish()
      .transform((value) => value ?? null),
    previousSchoolName: z
      .string()
      .trim()
      .nullish()
      .transform((value) => value || null),
    previousSchoolBoard: z
      .string()
      .trim()
      .nullish()
      .transform((value) => value || null),
    previousSchoolClass: z
      .string()
      .trim()
      .nullish()
      .transform((value) => value || null),
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

// ── Sibling links ────────────────────────────────────────────────────────

export const createSiblingLinkSchema = z.object({
  siblingStudentId: z.uuid(),
});

export type CreateSiblingLinkDto = z.infer<typeof createSiblingLinkSchema>;

// ── Medical records ──────────────────────────────────────────────────────

export const upsertMedicalRecordSchema = z.object({
  allergies: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  conditions: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  medications: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  emergencyMedicalInfo: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  doctorName: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  doctorPhone: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  insuranceInfo: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
});

export type UpsertMedicalRecordDto = z.infer<typeof upsertMedicalRecordSchema>;

// ── Disciplinary records ─────────────────────────────────────────────────

export const createDisciplinaryRecordSchema = z.object({
  incidentDate: z.string().date(),
  severity: disciplinarySeveritySchema,
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN_LENGTH, "Description is required"),
  actionTaken: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  parentNotified: z.boolean().default(false),
});

export type CreateDisciplinaryRecordDto = z.infer<
  typeof createDisciplinaryRecordSchema
>;

// ── Transfer certificates ────────────────────────────────────────────────

export const issueTransferCertificateSchema = z.object({
  tcNumber: z
    .string()
    .trim()
    .min(TC_NUMBER_MIN_LENGTH, "TC number is required"),
  issueDate: z.string().date(),
  reason: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  conductRemarks: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
});

export type IssueTransferCertificateDto = z.infer<
  typeof issueTransferCertificateSchema
>;

// ── Parse functions ──────────────────────────────────────────────────────

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

export function parseCreateSiblingLink(input: unknown) {
  return createSiblingLinkSchema.parse(input);
}

export function parseUpsertMedicalRecord(input: unknown) {
  return upsertMedicalRecordSchema.parse(input);
}

export function parseCreateDisciplinaryRecord(input: unknown) {
  return createDisciplinaryRecordSchema.parse(input);
}

export function parseIssueTransferCertificate(input: unknown) {
  return issueTransferCertificateSchema.parse(input);
}
