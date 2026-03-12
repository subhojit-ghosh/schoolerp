import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Mobile number is required"),
  email: z.email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Mobile number or email is required"),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
export type SignInDto = z.infer<typeof signInSchema>;

function parseSchema<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseSignUp(value: unknown) {
  return parseSchema(signUpSchema, value);
}

export function parseSignIn(value: unknown) {
  return parseSchema(signInSchema, value);
}
