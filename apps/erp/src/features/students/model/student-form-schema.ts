import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;
const REQUIRED_TEXT_MIN_LENGTH = 1;

export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  "father",
  "mother",
  "guardian",
] as const;

export const EMPTY_CURRENT_ENROLLMENT = {
  academicYearId: "",
  className: "",
  sectionName: "",
} as const;

const enrollmentIdentifierSchema = z.uuid("Select an academic year");

export const guardianFormSchema = z.object({
  name: z.string().trim().min(REQUIRED_TEXT_MIN_LENGTH, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z.email().optional().or(z.literal("")),
  relationship: z.enum(GUARDIAN_RELATIONSHIP_OPTIONS),
  isPrimary: z.boolean(),
});

export const currentEnrollmentFormSchema = z
  .object({
    academicYearId: z.string().trim(),
    className: z.string().trim(),
    sectionName: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    const fields = [value.academicYearId, value.className, value.sectionName];
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
    } else if (!enrollmentIdentifierSchema.safeParse(value.academicYearId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["academicYearId"],
        message: "Select an academic year",
      });
    }

    if (!value.className) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["className"],
        message: "Class is required",
      });
    }

    if (!value.sectionName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionName"],
        message: "Section is required",
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
    values.currentEnrollment.className,
    values.currentEnrollment.sectionName,
  ].some(Boolean);

  return {
    ...values,
    currentEnrollment: hasEnrollment
      ? {
          academicYearId: values.currentEnrollment.academicYearId,
          className: values.currentEnrollment.className,
          sectionName: values.currentEnrollment.sectionName,
        }
      : null,
  };
}
