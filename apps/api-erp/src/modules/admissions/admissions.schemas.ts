import {
  admissionFormFieldOptionSchema,
  admissionFormFieldScopeSchema,
  admissionFormFieldTypeSchema,
  admissionApplicationStatusSchema,
  admissionDocumentStatusSchema,
  admissionEnquiryStatusSchema,
} from "@repo/contracts";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;
const SORT_ORDER_MIN = 0;
const FEE_AMOUNT_MIN = 1;

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);
const optionalCustomFieldValuesSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

export const createAdmissionEnquirySchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Student name is required"),
  guardianName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  source: optionalStringSchema,
  status: admissionEnquiryStatusSchema.default("new"),
  notes: optionalStringSchema,
});

export const updateAdmissionEnquirySchema = createAdmissionEnquirySchema;

export const createAdmissionApplicationSchema = z.object({
  enquiryId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  studentFirstName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Student first name is required"),
  studentLastName: optionalStringSchema,
  guardianName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  desiredClassName: optionalStringSchema,
  desiredSectionName: optionalStringSchema,
  status: admissionApplicationStatusSchema.default("draft"),
  notes: optionalStringSchema,
  customFieldValues: optionalCustomFieldValuesSchema,
});

export const updateAdmissionApplicationSchema =
  createAdmissionApplicationSchema;

export const admissionFormFieldIdSchema = z.object({
  fieldId: z.uuid(),
});

export const listAdmissionFormFieldsQuerySchema = z.object({
  scope: admissionFormFieldScopeSchema.optional(),
});

export const upsertAdmissionFormFieldSchema = z.object({
  key: z.string().trim().min(NAME_MIN_LENGTH, "Field key is required"),
  label: z.string().trim().min(NAME_MIN_LENGTH, "Field label is required"),
  scope: admissionFormFieldScopeSchema,
  fieldType: admissionFormFieldTypeSchema,
  placeholder: optionalStringSchema,
  helpText: optionalStringSchema,
  required: z.boolean().default(false),
  active: z.boolean().default(true),
  options: z.array(admissionFormFieldOptionSchema).optional(),
  sortOrder: z.number().int().default(0),
});

export const sortableAdmissionEnquiryColumns = {
  campus: "campus",
  createdAt: "createdAt",
  status: "status",
  studentName: "studentName",
} as const;

export const sortableAdmissionApplicationColumns = {
  campus: "campus",
  createdAt: "createdAt",
  status: "status",
  studentName: "studentName",
} as const;

export const listAdmissionEnquiriesQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableAdmissionEnquiryColumns.campus,
      sortableAdmissionEnquiryColumns.createdAt,
      sortableAdmissionEnquiryColumns.status,
      sortableAdmissionEnquiryColumns.studentName,
    ])
    .optional(),
});

export const listAdmissionApplicationsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableAdmissionApplicationColumns.campus,
      sortableAdmissionApplicationColumns.createdAt,
      sortableAdmissionApplicationColumns.status,
      sortableAdmissionApplicationColumns.studentName,
    ])
    .optional(),
});

// ── Document checklist schemas ──────────────────────────────────────────────

export const createDocumentChecklistItemSchema = z.object({
  documentName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Document name is required"),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().min(SORT_ORDER_MIN).default(0),
  isActive: z.boolean().default(true),
});

export const updateDocumentChecklistItemSchema =
  createDocumentChecklistItemSchema;

// ── Application documents schemas ───────────────────────────────────────────

export const upsertApplicationDocumentSchema = z.object({
  checklistItemId: z.uuid(),
  status: admissionDocumentStatusSchema.default("pending"),
  uploadUrl: optionalStringSchema,
  notes: optionalStringSchema,
});

export const verifyRejectApplicationDocumentSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  notes: optionalStringSchema,
});

// ── Convert to student schema ───────────────────────────────────────────────

export const convertToStudentSchema = z.object({
  admissionNumber: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Admission number is required"),
  classId: z.uuid(),
  sectionId: z.uuid(),
});

// ── Waitlist schema ─────────────────────────────────────────────────────────

export const waitlistApplicationSchema = z.object({
  waitlistPosition: z.number().int().min(1, "Position must be at least 1"),
});

// ── Registration fee schema ─────────────────────────────────────────────────

export const recordRegistrationFeeSchema = z.object({
  amountInPaise: z
    .number()
    .int()
    .min(FEE_AMOUNT_MIN, "Amount must be positive"),
});

export const admissionEnquiryIdSchema = z.object({
  enquiryId: z.uuid(),
});

export const admissionApplicationIdSchema = z.object({
  applicationId: z.uuid(),
});

export const checklistItemIdSchema = z.object({
  itemId: z.uuid(),
});

export const applicationDocumentIdSchema = z.object({
  documentId: z.uuid(),
});

export type CreateAdmissionEnquiryDto = z.infer<
  typeof createAdmissionEnquirySchema
>;
export type UpdateAdmissionEnquiryDto = z.infer<
  typeof updateAdmissionEnquirySchema
>;
export type CreateAdmissionApplicationDto = z.infer<
  typeof createAdmissionApplicationSchema
>;
export type UpdateAdmissionApplicationDto = z.infer<
  typeof updateAdmissionApplicationSchema
>;
export type UpsertAdmissionFormFieldDto = z.infer<
  typeof upsertAdmissionFormFieldSchema
>;
export type ListAdmissionFormFieldsQueryDto = z.infer<
  typeof listAdmissionFormFieldsQuerySchema
>;
export type CreateDocumentChecklistItemDto = z.infer<
  typeof createDocumentChecklistItemSchema
>;
export type UpdateDocumentChecklistItemDto = z.infer<
  typeof updateDocumentChecklistItemSchema
>;
export type UpsertApplicationDocumentDto = z.infer<
  typeof upsertApplicationDocumentSchema
>;
export type VerifyRejectApplicationDocumentDto = z.infer<
  typeof verifyRejectApplicationDocumentSchema
>;
export type ConvertToStudentDto = z.infer<typeof convertToStudentSchema>;
export type WaitlistApplicationDto = z.infer<
  typeof waitlistApplicationSchema
>;
export type RecordRegistrationFeeDto = z.infer<
  typeof recordRegistrationFeeSchema
>;

type ListAdmissionEnquiriesQueryInput = z.infer<
  typeof listAdmissionEnquiriesQuerySchema
>;

type ListAdmissionApplicationsQueryInput = z.infer<
  typeof listAdmissionApplicationsQuerySchema
>;

export type ListAdmissionEnquiriesQueryDto = Omit<
  ListAdmissionEnquiriesQueryInput,
  "q"
> & {
  search?: string;
};

export type ListAdmissionApplicationsQueryDto = Omit<
  ListAdmissionApplicationsQueryInput,
  "q"
> & {
  search?: string;
};

export function parseCreateAdmissionEnquiry(input: unknown) {
  return createAdmissionEnquirySchema.parse(input);
}

export function parseUpdateAdmissionEnquiry(input: unknown) {
  return updateAdmissionEnquirySchema.parse(input);
}

export function parseCreateAdmissionApplication(input: unknown) {
  return createAdmissionApplicationSchema.parse(input);
}

export function parseUpdateAdmissionApplication(input: unknown) {
  return updateAdmissionApplicationSchema.parse(input);
}

export function parseListAdmissionFormFieldsQuery(query: unknown) {
  return listAdmissionFormFieldsQuerySchema.parse(query);
}

export function parseUpsertAdmissionFormField(input: unknown) {
  return upsertAdmissionFormFieldSchema.parse(input);
}

export function parseListAdmissionEnquiriesQuery(
  query: unknown,
): ListAdmissionEnquiriesQueryDto {
  const result = parseListQuerySchema(listAdmissionEnquiriesQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}

export function parseListAdmissionApplicationsQuery(
  query: unknown,
): ListAdmissionApplicationsQueryDto {
  const result = parseListQuerySchema(
    listAdmissionApplicationsQuerySchema,
    query,
  );

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}

export function parseCreateDocumentChecklistItem(input: unknown) {
  return createDocumentChecklistItemSchema.parse(input);
}

export function parseUpdateDocumentChecklistItem(input: unknown) {
  return updateDocumentChecklistItemSchema.parse(input);
}

export function parseUpsertApplicationDocument(input: unknown) {
  return upsertApplicationDocumentSchema.parse(input);
}

export function parseVerifyRejectApplicationDocument(input: unknown) {
  return verifyRejectApplicationDocumentSchema.parse(input);
}

export function parseConvertToStudent(input: unknown) {
  return convertToStudentSchema.parse(input);
}

export function parseWaitlistApplication(input: unknown) {
  return waitlistApplicationSchema.parse(input);
}

export function parseRecordRegistrationFee(input: unknown) {
  return recordRegistrationFeeSchema.parse(input);
}
