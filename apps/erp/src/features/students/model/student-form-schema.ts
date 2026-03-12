import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;

export const guardianFormSchema = z.object({
  name: z.string().trim().min(1, "Guardian name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z.email().optional().or(z.literal("")),
  relationship: z.enum(["father", "mother", "guardian"]),
  isPrimary: z.boolean(),
});

export const studentFormSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().optional(),
  campusId: z.uuid("Select a campus"),
  guardians: z.array(guardianFormSchema).min(1, "Add at least one guardian"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type StudentRecord = components["schemas"]["StudentDto"];
