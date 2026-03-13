import { authContextKeySchema } from "@repo/contracts";
import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.email().optional());

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: optionalEmailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH),
  tenantSlug: z.string().trim().min(1).optional(),
});

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  tenantSlug: z.string().trim().min(1).optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

export const switchCampusSchema = z.object({
  campusId: z.uuid(),
});

export const switchContextSchema = z.object({
  contextKey: authContextKeySchema,
});

export type SignUpDto = z.infer<typeof signUpSchema>;
export type SignInDto = z.infer<typeof signInSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type SwitchCampusDto = z.infer<typeof switchCampusSchema>;
export type SwitchContextDto = z.infer<typeof switchContextSchema>;

function parseSchema<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseSignUp(value: unknown): SignUpDto {
  return parseSchema(signUpSchema, value);
}

export function parseSignIn(value: unknown): SignInDto {
  return parseSchema(signInSchema, value);
}

export function parseForgotPassword(value: unknown): ForgotPasswordDto {
  return parseSchema(forgotPasswordSchema, value);
}

export function parseResetPassword(value: unknown): ResetPasswordDto {
  return parseSchema(resetPasswordSchema, value);
}

export function parseSwitchCampus(value: unknown): SwitchCampusDto {
  return parseSchema(switchCampusSchema, value);
}

export function parseSwitchContext(value: unknown): SwitchContextDto {
  return parseSchema(switchContextSchema, value);
}
