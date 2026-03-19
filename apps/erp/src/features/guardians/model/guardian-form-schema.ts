import {
  GUARDIAN_RELATIONSHIPS,
  guardianRelationshipSchema,
} from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;

export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  GUARDIAN_RELATIONSHIPS.FATHER,
  GUARDIAN_RELATIONSHIPS.MOTHER,
  GUARDIAN_RELATIONSHIPS.GUARDIAN,
] as const;

export const guardianFormSchema = z.object({
  name: z.string().trim().min(1, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z.email().optional().or(z.literal("")),
});

export const guardianStudentLinkFormSchema = z.object({
  studentId: z.uuid("Select a student"),
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean(),
});

export type GuardianFormValues = z.infer<typeof guardianFormSchema>;
export type GuardianStudentLinkFormValues = z.infer<
  typeof guardianStudentLinkFormSchema
>;
export type GuardianRecord = components["schemas"]["GuardianDto"];
