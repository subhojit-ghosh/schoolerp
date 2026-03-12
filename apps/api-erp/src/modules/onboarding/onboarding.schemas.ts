import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;
const MOBILE_MIN_LENGTH = 10;

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.email().optional());

export const createInstitutionOnboardingSchema = z.object({
  institutionName: z.string().trim().min(1, "Institution name is required"),
  institutionSlug: z.string().trim().min(1, "Institution slug is required"),
  institutionShortName: z.string().trim().optional(),
  campusName: z.string().trim().min(1, "Campus name is required"),
  campusSlug: z.string().trim().optional(),
  adminName: z.string().trim().min(1, "Admin name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: optionalEmailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

export type CreateInstitutionOnboardingDto = z.infer<
  typeof createInstitutionOnboardingSchema
>;

export function parseCreateInstitutionOnboarding(value: unknown) {
  const result = createInstitutionOnboardingSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}
