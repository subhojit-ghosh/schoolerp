import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export const studentStrengthQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  campusId: z.uuid().optional(),
});

export type StudentStrengthQueryInput = z.infer<
  typeof studentStrengthQuerySchema
>;

export function parseStudentStrengthQuery(
  input: unknown,
): StudentStrengthQueryInput {
  const result = studentStrengthQuerySchema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}
