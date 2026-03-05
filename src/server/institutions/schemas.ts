import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: slugSchema,
  institutionType: z.string().min(1, "Institution type is required"),
});

export const updateInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  slug: slugSchema.optional(),
  institutionType: z.string().min(1).optional(),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

// UI-level constants — stored as plain text in DB
export const INSTITUTION_TYPES = [
  { value: "primary_school", label: "Primary School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
] as const;
