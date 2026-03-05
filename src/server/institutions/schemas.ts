import { z } from "zod";
import { zfd } from "zod-form-data";

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

// FormData variants for server actions (wraps the same validation rules)
export const createInstitutionFormSchema = zfd.formData({
  name: zfd.text(createInstitutionSchema.shape.name),
  slug: zfd.text(createInstitutionSchema.shape.slug),
  institutionType: zfd.text(createInstitutionSchema.shape.institutionType),
});

export const updateInstitutionFormSchema = zfd.formData({
  name: zfd.text(updateInstitutionSchema.shape.name),
  slug: zfd.text(updateInstitutionSchema.shape.slug),
  institutionType: zfd.text(updateInstitutionSchema.shape.institutionType),
});

// UI-level constants — stored as plain text in DB
export const INSTITUTION_TYPES = [
  { value: "primary_school", label: "Primary School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
] as const;
