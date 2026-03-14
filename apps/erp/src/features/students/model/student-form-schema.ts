import {
  GUARDIAN_RELATIONSHIPS,
  guardianRelationshipSchema,
} from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;
const REQUIRED_TEXT_MIN_LENGTH = 1;

export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  GUARDIAN_RELATIONSHIPS.FATHER,
  GUARDIAN_RELATIONSHIPS.MOTHER,
  GUARDIAN_RELATIONSHIPS.GUARDIAN,
] as const;

export const EMPTY_CURRENT_ENROLLMENT = {
  academicYearId: "",
  classId: "",
  sectionId: "",
} as const;

const academicYearIdentifierSchema = z.uuid("Select an academic year");
const classIdentifierSchema = z.uuid("Select a class");
const sectionIdentifierSchema = z.uuid("Select a section");

export const guardianFormSchema = z.object({
  name: z.string().trim().min(REQUIRED_TEXT_MIN_LENGTH, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z.email().optional().or(z.literal("")),
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean(),
});

export const currentEnrollmentFormSchema = z
  .object({
    academicYearId: z.string().trim(),
    classId: z.string().trim(),
    sectionId: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    const fields = [value.academicYearId, value.classId, value.sectionId];
    const hasAnyValue = fields.some(Boolean);

    if (!hasAnyValue) {
      return;
    }

    if (!value.academicYearId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["academicYearId"],
        message: "Academic year is required",
      });
    } else if (!academicYearIdentifierSchema.safeParse(value.academicYearId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["academicYearId"],
        message: "Select an academic year",
      });
    }

    if (!value.classId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classId"],
        message: "Class is required",
      });
    } else if (!classIdentifierSchema.safeParse(value.classId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classId"],
        message: "Select a class",
      });
    }

    if (!value.sectionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionId"],
        message: "Section is required",
      });
    } else if (!sectionIdentifierSchema.safeParse(value.sectionId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionId"],
        message: "Select a section",
      });
    }
  });

export const studentFormSchema = z
  .object({
    admissionNumber: z
      .string()
      .trim()
      .min(REQUIRED_TEXT_MIN_LENGTH, "Admission number is required"),
    firstName: z
      .string()
      .trim()
      .min(REQUIRED_TEXT_MIN_LENGTH, "First name is required"),
    lastName: z.string().trim().optional(),
    classId: z.uuid("Select a class"),
    sectionId: z.uuid("Select a section"),
    campusId: z.uuid("Select a campus"),
    guardians: z.array(guardianFormSchema).min(1, "Add at least one guardian"),
    currentEnrollment: currentEnrollmentFormSchema,
  })
  .refine(
    (value) => value.guardians.filter((guardian) => guardian.isPrimary).length === 1,
    {
      path: ["guardians"],
      message: "Select exactly one primary guardian",
    },
  );

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type StudentMutationBody = components["schemas"]["CreateStudentBodyDto"];
export type StudentRecord = components["schemas"]["StudentDto"];

export function toStudentMutationBody(
  values: StudentFormValues,
): StudentMutationBody {
  const hasEnrollment = [
    values.currentEnrollment.academicYearId,
    values.currentEnrollment.classId,
    values.currentEnrollment.sectionId,
  ].some(Boolean);

  return {
    ...values,
    currentEnrollment: hasEnrollment
      ? {
          academicYearId: values.currentEnrollment.academicYearId,
          classId: values.currentEnrollment.classId,
          sectionId: values.currentEnrollment.sectionId,
        }
      : null,
  };
}
