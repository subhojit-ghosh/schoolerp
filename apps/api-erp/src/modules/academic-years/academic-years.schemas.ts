import { BadRequestException } from "@nestjs/common";
import { ACADEMIC_YEAR_NAME_MAX_LENGTH } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const academicYearWriteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(ACADEMIC_YEAR_NAME_MAX_LENGTH),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    isCurrent: z.boolean(),
  })
  .refine((value) => value.startDate < value.endDate, {
    message: ERROR_MESSAGES.ACADEMIC_YEARS.INVALID_DATE_RANGE,
    path: ["endDate"],
  });

export const createAcademicYearSchema = academicYearWriteSchema;
export const updateAcademicYearSchema = academicYearWriteSchema;

export const academicYearIdSchema = z.object({
  academicYearId: z.uuid(),
});

export const institutionIdSchema = z.object({
  institutionId: z.uuid(),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;

export function parseCreateAcademicYear(body: unknown): CreateAcademicYearDto {
  const result = createAcademicYearSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseUpdateAcademicYear(body: unknown): UpdateAcademicYearDto {
  const result = updateAcademicYearSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}
