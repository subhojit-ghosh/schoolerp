import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const onboardingFormSchema = z.object({
  institutionName: z.string().trim().min(1, "School name is required"),
  institutionSlug: z.string().trim().min(1, "Subdomain slug is required"),
  campusName: z.string().trim().min(1, "Default campus is required"),
  adminName: z.string().trim().min(1, "Admin name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: z.string().trim().optional(),
  password: z.string().min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
