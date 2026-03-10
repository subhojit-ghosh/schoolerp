import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants";

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

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

