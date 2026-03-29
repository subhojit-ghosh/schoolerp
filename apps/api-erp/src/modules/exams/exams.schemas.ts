import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const TERM_NAME_MAX_LENGTH = 100;
const SUBJECT_NAME_MAX_LENGTH = 100;
const MARKS_MIN_VALUE = 0;
const SCALE_NAME_MAX_LENGTH = 100;
const GRADE_MAX_LENGTH = 10;
const GRADE_LABEL_MAX_LENGTH = 50;

function normalizeSubjectKey(studentId: string, subjectName: string) {
  return `${studentId}:${subjectName.trim().toLowerCase()}`;
}

// ── Grading scale schemas ───────────────────────────────────────────────────

const gradingScaleBandSchema = z.object({
  grade: z.string().trim().min(1).max(GRADE_MAX_LENGTH),
  label: z.string().trim().min(1).max(GRADE_LABEL_MAX_LENGTH),
  minPercent: z.number().int().min(0).max(100),
  sortOrder: z.number().int().min(0),
});

export const createGradingScaleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(SCALE_NAME_MAX_LENGTH),
  bands: z
    .array(gradingScaleBandSchema)
    .min(1, "At least one grade band is required"),
});

export const updateGradingScaleSchema = z.object({
  name: z.string().trim().min(1).max(SCALE_NAME_MAX_LENGTH).optional(),
  bands: z.array(gradingScaleBandSchema).min(1).optional(),
});

// ── Exam term schemas ───────────────────────────────────────────────────────

export const createExamTermSchema = z
  .object({
    academicYearId: z.uuid(),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(TERM_NAME_MAX_LENGTH),
    examType: z
      .enum(["unit_test", "midterm", "final", "practical"])
      .optional()
      .default("final"),
    weightageInBp: z.number().int().min(0).max(10000).optional().default(10000),
    gradingScaleId: z.uuid().optional().nullable(),
    defaultPassingPercent: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .default(33),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((value) => value.startDate < value.endDate, {
    path: ["endDate"],
    message: ERROR_MESSAGES.EXAMS.INVALID_TERM_DATE_RANGE,
  });

// ── Marks schemas ───────────────────────────────────────────────────────────

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
    graceMarks: z.number().int().min(0).optional().default(0),
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

// ── Query schemas ───────────────────────────────────────────────────────────

export const examReportCardQuerySchema = z.object({
  studentId: z.uuid(),
});

export const classAnalysisQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid().optional(),
});

export const ranksQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid().optional(),
});

export const batchReportCardsQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid().optional(),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreateGradingScaleDto = z.infer<typeof createGradingScaleSchema>;
export type UpdateGradingScaleDto = z.infer<typeof updateGradingScaleSchema>;
export type CreateExamTermDto = z.infer<typeof createExamTermSchema>;
export type UpsertExamMarkEntryDto = z.infer<typeof upsertExamMarkEntrySchema>;
export type UpsertExamMarksDto = z.infer<typeof upsertExamMarksSchema>;
export type ExamReportCardQueryDto = z.infer<typeof examReportCardQuerySchema>;
export type ClassAnalysisQueryDto = z.infer<typeof classAnalysisQuerySchema>;
export type RanksQueryDto = z.infer<typeof ranksQuerySchema>;
export type BatchReportCardsQueryDto = z.infer<
  typeof batchReportCardsQuerySchema
>;

// ── Parsers ─────────────────────────────────────────────────────────────────

function parseOrThrow<T>(result: z.ZodSafeParseResult<T>) {
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateGradingScale(body: unknown): CreateGradingScaleDto {
  return parseOrThrow(createGradingScaleSchema.safeParse(body));
}

export function parseUpdateGradingScale(body: unknown): UpdateGradingScaleDto {
  return parseOrThrow(updateGradingScaleSchema.safeParse(body));
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

export function parseClassAnalysisQuery(query: unknown): ClassAnalysisQueryDto {
  return parseOrThrow(classAnalysisQuerySchema.safeParse(query));
}

export function parseRanksQuery(query: unknown): RanksQueryDto {
  return parseOrThrow(ranksQuerySchema.safeParse(query));
}

export function parseBatchReportCardsQuery(
  query: unknown,
): BatchReportCardsQueryDto {
  return parseOrThrow(batchReportCardsQuerySchema.safeParse(query));
}
