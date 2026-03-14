import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const TERM_NAME_MAX_LENGTH = 100;
const SUBJECT_NAME_MAX_LENGTH = 100;
const MARKS_MIN_VALUE = 0;

export const examTermFormSchema = z
  .object({
    academicYearId: z.uuid("Select an academic year"),
    name: z
      .string()
      .trim()
      .min(1, "Term name is required")
      .max(TERM_NAME_MAX_LENGTH),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((value) => value.startDate < value.endDate, {
    path: ["endDate"],
    message: "End date must be after the start date",
  });

export const examMarkEntryFormSchema = z
  .object({
    studentId: z.uuid("Select a student"),
    subjectName: z
      .string()
      .trim()
      .min(1, "Subject name is required")
      .max(SUBJECT_NAME_MAX_LENGTH),
    maxMarks: z
      .number()
      .int()
      .min(MARKS_MIN_VALUE, "Max marks must be zero or more"),
    obtainedMarks: z
      .number()
      .int()
      .min(MARKS_MIN_VALUE, "Obtained marks must be zero or more"),
    remarks: z.string().trim().optional(),
  })
  .refine((value) => value.obtainedMarks <= value.maxMarks, {
    path: ["obtainedMarks"],
    message: "Obtained marks cannot exceed max marks",
  });

export const examMarksFormSchema = z.object({
  entries: z
    .array(examMarkEntryFormSchema)
    .min(1, "Add at least one marks row"),
});

export type ExamTermFormValues = z.infer<typeof examTermFormSchema>;
export type ExamMarksFormValues = z.infer<typeof examMarksFormSchema>;
export type ExamTermRecord = components["schemas"]["ExamTermDto"];
export type ExamMarkRecord = components["schemas"]["ExamMarkDto"];
