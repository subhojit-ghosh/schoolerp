import { guardianRelationshipSchema } from "@repo/contracts";
import { z } from "zod";

const NAME_MIN_LENGTH = 1;
const MOBILE_MIN_LENGTH = 10;

export const guardianIdSchema = z.object({
  guardianId: z.uuid(),
});

export const updateGuardianSchema = z.object({
  name: z.string().trim().min(NAME_MIN_LENGTH, "Guardian name is required"),
  mobile: z
    .string()
    .trim()
    .min(MOBILE_MIN_LENGTH, "Guardian mobile is required"),
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  campusId: z.uuid(),
});

export const linkGuardianStudentSchema = z.object({
  studentId: z.uuid(),
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean().default(false),
});

export const updateGuardianStudentLinkSchema = z.object({
  relationship: guardianRelationshipSchema,
  isPrimary: z.boolean(),
});

export type UpdateGuardianDto = z.infer<typeof updateGuardianSchema>;
export type LinkGuardianStudentDto = z.infer<typeof linkGuardianStudentSchema>;
export type UpdateGuardianStudentLinkDto = z.infer<
  typeof updateGuardianStudentLinkSchema
>;

export function parseUpdateGuardian(input: unknown) {
  return updateGuardianSchema.parse(input);
}

export function parseLinkGuardianStudent(input: unknown) {
  return linkGuardianStudentSchema.parse(input);
}

export function parseUpdateGuardianStudentLink(input: unknown) {
  return updateGuardianStudentLinkSchema.parse(input);
}
