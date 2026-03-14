import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { STATUS } from "../../constants";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

export const createStaffSchema = z.object({
  name: z.string().trim().min(NAME_MIN_LENGTH, "Staff name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Staff mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  campusId: z.uuid(),
  roleId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  status: z.enum([
    STATUS.MEMBER.ACTIVE,
    STATUS.MEMBER.INACTIVE,
    STATUS.MEMBER.SUSPENDED,
  ]),
});

export const updateStaffSchema = createStaffSchema;

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;

function parseSchema<T>(schema: z.ZodSchema<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateStaff(body: unknown) {
  return parseSchema(createStaffSchema, body);
}

export function parseUpdateStaff(body: unknown) {
  return parseSchema(updateStaffSchema, body);
}
