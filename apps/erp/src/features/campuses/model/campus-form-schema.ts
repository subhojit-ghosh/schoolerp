import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const REQUIRED_TEXT_MIN_LENGTH = 1;

export const campusFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(REQUIRED_TEXT_MIN_LENGTH, "Campus name is required"),
  slug: z.string().trim().optional(),
  code: z.string().trim().optional(),
  isDefault: z.boolean(),
});

export type CampusFormValues = z.infer<typeof campusFormSchema>;
export type CampusMutationBody = components["schemas"]["CreateCampusBodyDto"];
export type CampusRecord = components["schemas"]["CampusDto"];

export function toCampusMutationBody(
  values: CampusFormValues,
): CampusMutationBody {
  return {
    name: values.name,
    slug: values.slug || undefined,
    code: values.code || undefined,
    isDefault: values.isDefault,
  };
}
