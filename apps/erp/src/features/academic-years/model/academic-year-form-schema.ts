import { ACADEMIC_YEAR_NAME_MAX_LENGTH } from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

export const academicYearFormSchema = z
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
    path: ["endDate"],
    message: "End date must be after the start date",
  });

export type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;
export type AcademicYearRecord = components["schemas"]["AcademicYearDto"];
export const ACADEMIC_YEAR_FORM_DEFAULT_VALUES: AcademicYearFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};
