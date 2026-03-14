import { BadRequestException } from "@nestjs/common";
import { ACADEMIC_YEAR_NAME_MAX_LENGTH } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

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
export const sortableAcademicYearColumns = {
  current: "current",
  endDate: "endDate",
  name: "name",
  startDate: "startDate",
} as const;

export const listAcademicYearsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableAcademicYearColumns.current,
      sortableAcademicYearColumns.endDate,
      sortableAcademicYearColumns.name,
      sortableAcademicYearColumns.startDate,
    ])
    .optional(),
});

export const academicYearIdSchema = z.object({
  academicYearId: z.uuid(),
});

export const institutionIdSchema = z.object({
  institutionId: z.uuid(),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;
type ListAcademicYearsQueryInput = z.infer<typeof listAcademicYearsQuerySchema>;
export type ListAcademicYearsQueryDto = Omit<
  ListAcademicYearsQueryInput,
  "q"
> & {
  search?: string;
};

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

export function parseListAcademicYearsQuery(
  query: unknown,
): ListAcademicYearsQueryDto {
  const result = parseListQuerySchema(listAcademicYearsQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
