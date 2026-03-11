import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

export const createAcademicYearSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    makeCurrent: z.boolean(),
  })
  .refine((value) => value.startDate < value.endDate, {
    message: ERROR_MESSAGES.ACADEMIC_YEARS.INVALID_DATE_RANGE,
    path: ["endDate"],
  });

export const academicYearIdSchema = z.object({
  academicYearId: z.uuid(),
});

export const institutionIdSchema = z.object({
  institutionId: z.uuid(),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;

export function parseCreateAcademicYear(body: unknown): CreateAcademicYearDto {
  const result = createAcademicYearSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}
