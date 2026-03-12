import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

export const academicYearFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    makeCurrent: z.boolean(),
  })
  .refine((value) => value.startDate < value.endDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });

export type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>;
export type AcademicYearRecord = components["schemas"]["AcademicYearDto"];
