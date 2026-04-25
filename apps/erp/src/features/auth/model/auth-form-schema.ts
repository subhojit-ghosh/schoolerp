import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;
const SLUG_MIN_LENGTH = 3;

export const signInFormSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required"),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "Confirm your new password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const signUpFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: z.email(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export const institutionSignUpFormSchema = z.object({
  institutionName: z.string().trim().min(1, "School name is required"),
  adminName: z.string().trim().min(1, "Admin name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Mobile number must be at least 10 digits"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Enter a valid email address"),
  institutionSlug: z
    .string()
    .trim()
    .min(SLUG_MIN_LENGTH, "School URL must be at least 3 characters"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
export type InstitutionSignUpFormValues = z.infer<
  typeof institutionSignUpFormSchema
>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
