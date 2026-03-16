import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const TERM_NAME_MAX_LENGTH = 100;
const SUBJECT_NAME_MAX_LENGTH = 100;
const MARKS_MIN_VALUE = 0;

function normalizeSubjectKey(studentId: string, subjectName: string) {
  return `${studentId}:${subjectName.trim().toLowerCase()}`;
}

export const createExamTermSchema = z
  .object({
    academicYearId: z.uuid(),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(TERM_NAME_MAX_LENGTH),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((value) => value.startDate < value.endDate, {
    path: ["endDate"],
    message: ERROR_MESSAGES.EXAMS.INVALID_TERM_DATE_RANGE,
  });

export const upsertExamMarkEntrySchema = z
  .object({
    studentId: z.uuid(),
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
    remarks: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
  })
  .refine((value) => value.obtainedMarks <= value.maxMarks, {
    path: ["obtainedMarks"],
    message: ERROR_MESSAGES.EXAMS.INVALID_MARK_RANGE,
  });

export const upsertExamMarksSchema = z
  .object({
    entries: z.array(upsertExamMarkEntrySchema),
  })
  .refine(
    (value) => {
      const keys = value.entries.map((entry) =>
        normalizeSubjectKey(entry.studentId, entry.subjectName),
      );

      return new Set(keys).size === keys.length;
    },
    {
      path: ["entries"],
      message: ERROR_MESSAGES.EXAMS.DUPLICATE_MARK_ENTRY,
    },
  );

export const examReportCardQuerySchema = z.object({
  studentId: z.uuid(),
});

export type CreateExamTermDto = z.infer<typeof createExamTermSchema>;
export type UpsertExamMarkEntryDto = z.infer<typeof upsertExamMarkEntrySchema>;
export type UpsertExamMarksDto = z.infer<typeof upsertExamMarksSchema>;
export type ExamReportCardQueryDto = z.infer<typeof examReportCardQuerySchema>;

function parseOrThrow<T>(result: z.ZodSafeParseResult<T>) {
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateExamTerm(body: unknown): CreateExamTermDto {
  return parseOrThrow(createExamTermSchema.safeParse(body));
}

export function parseUpsertExamMarks(body: unknown): UpsertExamMarksDto {
  return parseOrThrow(upsertExamMarksSchema.safeParse(body));
}

export function parseExamReportCardQuery(
  query: unknown,
): ExamReportCardQueryDto {
  return parseOrThrow(examReportCardQuerySchema.safeParse(query));
}
