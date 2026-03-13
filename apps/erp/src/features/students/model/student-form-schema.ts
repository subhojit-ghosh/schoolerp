import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;
export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  "father",
  "mother",
  "guardian",
] as const;

export const guardianFormSchema = z.object({
  name: z.string().trim().min(1, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z.email().optional().or(z.literal("")),
  relationship: z.enum(GUARDIAN_RELATIONSHIP_OPTIONS),
  isPrimary: z.boolean(),
});

export const studentFormSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().optional(),
  className: z.string().trim().min(1, "Class is required"),
  sectionName: z.string().trim().min(1, "Section is required"),
  campusId: z.uuid("Select a campus"),
  guardians: z.array(guardianFormSchema).min(1, "Add at least one guardian"),
}).refine(
  (value) => value.guardians.filter((guardian) => guardian.isPrimary).length === 1,
  {
    path: ["guardians"],
    message: "Select exactly one primary guardian",
  },
);

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type StudentRecord = components["schemas"]["StudentDto"];
