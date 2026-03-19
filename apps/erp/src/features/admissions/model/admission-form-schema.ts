import {
  ADMISSION_APPLICATION_STATUSES,
  ADMISSION_ENQUIRY_STATUSES,
} from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const REQUIRED_TEXT_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;
const EMPTY_TEXT = "";

export const ADMISSION_ENQUIRY_STATUS_OPTIONS = [
  ADMISSION_ENQUIRY_STATUSES.NEW,
  ADMISSION_ENQUIRY_STATUSES.IN_PROGRESS,
  ADMISSION_ENQUIRY_STATUSES.CONVERTED,
  ADMISSION_ENQUIRY_STATUSES.CLOSED,
] as const;

export const ADMISSION_APPLICATION_STATUS_OPTIONS = [
  ADMISSION_APPLICATION_STATUSES.DRAFT,
  ADMISSION_APPLICATION_STATUSES.SUBMITTED,
  ADMISSION_APPLICATION_STATUSES.REVIEWED,
  ADMISSION_APPLICATION_STATUSES.APPROVED,
  ADMISSION_APPLICATION_STATUSES.REJECTED,
] as const;

const optionalTextSchema = z.string().trim();
const optionalEmailSchema = z.union([
  z.literal(EMPTY_TEXT),
  z.email("Enter a valid email"),
]);
const optionalEnquiryIdSchema = z.union([
  z.literal(EMPTY_TEXT),
  z.uuid("Select a valid enquiry"),
]);
const customFieldValuesSchema = z.record(z.string(), z.unknown());

export const admissionEnquiryFormSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(REQUIRED_TEXT_MIN_LENGTH, "Student name is required"),
  guardianName: z
    .string()
    .trim()
    .min(REQUIRED_TEXT_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: optionalEmailSchema,
  source: optionalTextSchema,
  status: z.enum(ADMISSION_ENQUIRY_STATUS_OPTIONS),
  notes: optionalTextSchema,
});

export const admissionApplicationFormSchema = z.object({
  enquiryId: optionalEnquiryIdSchema,
  studentFirstName: z
    .string()
    .trim()
    .min(REQUIRED_TEXT_MIN_LENGTH, "Student first name is required"),
  studentLastName: optionalTextSchema,
  guardianName: z
    .string()
    .trim()
    .min(REQUIRED_TEXT_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: optionalEmailSchema,
  desiredClassName: optionalTextSchema,
  desiredSectionName: optionalTextSchema,
  status: z.enum(ADMISSION_APPLICATION_STATUS_OPTIONS),
  notes: optionalTextSchema,
  customFieldValues: customFieldValuesSchema,
});

export type AdmissionEnquiryFormValues = z.infer<
  typeof admissionEnquiryFormSchema
>;
export type AdmissionApplicationFormValues = z.infer<
  typeof admissionApplicationFormSchema
>;

export type AdmissionEnquiryRecord =
  components["schemas"]["AdmissionEnquiryDto"];
export type AdmissionApplicationRecord =
  components["schemas"]["AdmissionApplicationDto"];

export type AdmissionEnquiryMutationBody =
  components["schemas"]["CreateAdmissionEnquiryBodyDto"];
export type AdmissionApplicationMutationBody =
  components["schemas"]["CreateAdmissionApplicationBodyDto"];

export const ADMISSION_ENQUIRY_FORM_DEFAULT_VALUES: AdmissionEnquiryFormValues =
  {
    studentName: "",
    guardianName: "",
    mobile: "",
    email: "",
    source: "",
    status: ADMISSION_ENQUIRY_STATUSES.NEW,
    notes: "",
  };

export const ADMISSION_APPLICATION_FORM_DEFAULT_VALUES: AdmissionApplicationFormValues =
  {
    enquiryId: "",
    studentFirstName: "",
    studentLastName: "",
    guardianName: "",
    mobile: "",
    email: "",
    desiredClassName: "",
    desiredSectionName: "",
    status: ADMISSION_APPLICATION_STATUSES.DRAFT,
    notes: "",
    customFieldValues: {},
  };

export function toAdmissionEnquiryMutationBody(
  values: AdmissionEnquiryFormValues,
): AdmissionEnquiryMutationBody {
  return {
    studentName: values.studentName,
    guardianName: values.guardianName,
    mobile: values.mobile,
    email: values.email || undefined,
    source: values.source || undefined,
    status: values.status,
    notes: values.notes || undefined,
  };
}

export function toAdmissionApplicationMutationBody(
  values: AdmissionApplicationFormValues,
): AdmissionApplicationMutationBody {
  return {
    enquiryId: values.enquiryId || undefined,
    studentFirstName: values.studentFirstName,
    studentLastName: values.studentLastName || undefined,
    guardianName: values.guardianName,
    mobile: values.mobile,
    email: values.email || undefined,
    desiredClassName: values.desiredClassName || undefined,
    desiredSectionName: values.desiredSectionName || undefined,
    status: values.status,
    notes: values.notes || undefined,
    customFieldValues:
      Object.keys(values.customFieldValues).length > 0
        ? values.customFieldValues
        : undefined,
  };
}
