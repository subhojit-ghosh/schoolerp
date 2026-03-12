import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const signInFormSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
  password: z.string().min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export const signUpFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: z.email(),
  password: z.string().min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
