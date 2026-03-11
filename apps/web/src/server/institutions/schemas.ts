import { z } from "zod";
import { zfd } from "zod-form-data";
import { V } from "@/constants";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: slugSchema,
  institutionType: z.string().min(1, "Institution type is required"),
  adminName: V.name,
  adminEmail: V.email,
  adminPassword: V.password,
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
  adminName: zfd.text(createInstitutionSchema.shape.adminName),
  adminEmail: zfd.text(createInstitutionSchema.shape.adminEmail),
  adminPassword: zfd.text(createInstitutionSchema.shape.adminPassword),
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
