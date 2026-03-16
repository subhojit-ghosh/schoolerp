import {
  admissionApplicationStatusSchema,
  admissionEnquiryStatusSchema,
} from "@repo/contracts";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const createAdmissionEnquirySchema = z.object({
  campusId: z.uuid(),
  studentName: z.string().trim().min(NAME_MIN_LENGTH, "Student name is required"),
  guardianName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
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
  campusId: z.uuid(),
  studentFirstName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Student first name is required"),
  studentLastName: optionalStringSchema,
  guardianName: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  desiredClassName: optionalStringSchema,
  desiredSectionName: optionalStringSchema,
  status: admissionApplicationStatusSchema.default("draft"),
  notes: optionalStringSchema,
});

export const updateAdmissionApplicationSchema = createAdmissionApplicationSchema;

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

export const admissionEnquiryIdSchema = z.object({
  enquiryId: z.uuid(),
});

export const admissionApplicationIdSchema = z.object({
  applicationId: z.uuid(),
});

export type CreateAdmissionEnquiryDto = z.infer<typeof createAdmissionEnquirySchema>;
export type UpdateAdmissionEnquiryDto = z.infer<typeof updateAdmissionEnquirySchema>;
export type CreateAdmissionApplicationDto = z.infer<
  typeof createAdmissionApplicationSchema
>;
export type UpdateAdmissionApplicationDto = z.infer<
  typeof updateAdmissionApplicationSchema
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
  const result = parseListQuerySchema(listAdmissionApplicationsQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
