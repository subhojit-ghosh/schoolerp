import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const onboardingFormSchema = z.object({
  institutionName: z.string().trim().min(1, "School name is required"),
  institutionSlug: z
    .string()
    .trim()
    .min(3, "Subdomain must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  campusName: z.string().trim().min(1, "Default campus is required"),
  adminName: z.string().trim().min(1, "Admin name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address")])
    .transform((value) => value || ""),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
