import { WEEKDAY_KEYS } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import { parseListQuerySchema } from "../../lib/list-query";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_PERIOD_INDEX = 1;

const weekdaySchema = z.enum([
  WEEKDAY_KEYS.MONDAY,
  WEEKDAY_KEYS.TUESDAY,
  WEEKDAY_KEYS.WEDNESDAY,
  WEEKDAY_KEYS.THURSDAY,
  WEEKDAY_KEYS.FRIDAY,
  WEEKDAY_KEYS.SATURDAY,
  WEEKDAY_KEYS.SUNDAY,
]);

const timetableEntryBodySchema = z
  .object({
    dayOfWeek: weekdaySchema,
    periodIndex: z.coerce.number().int().min(MIN_PERIOD_INDEX),
    startTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    subjectId: z.uuid(),
    bellSchedulePeriodId: z.uuid().optional(),
    staffId: z.uuid().optional(),
    room: z.string().trim().min(1).max(100).optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: ERROR_MESSAGES.TIMETABLE.INVALID_TIME_RANGE,
    path: ["endTime"],
  });

function hasUniqueSlots(
  entries: Array<z.infer<typeof timetableEntryBodySchema>>,
) {
  const keys = entries.map(
    (entry) => `${entry.dayOfWeek}:${entry.periodIndex}`,
  );
  return new Set(keys).size === keys.length;
}

export const timetableScopeQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
});

export const replaceSectionTimetableSchema = z
  .object({
    classId: z.uuid(),
    entries: z.array(timetableEntryBodySchema),
  })
  .refine((value) => hasUniqueSlots(value.entries), {
    message: ERROR_MESSAGES.TIMETABLE.DUPLICATE_PERIOD,
    path: ["entries"],
  });

export const timetableEntryIdSchema = z.object({
  entryId: z.uuid(),
});

export const timetableStaffOptionsQuerySchema = z.object({
  classId: z.uuid().optional(),
  subjectId: z.uuid(),
});

export const teacherTimetableQuerySchema = z.object({
  staffId: z.uuid(),
});

export const copySectionTimetableSchema = z.object({
  classId: z.uuid(),
  sourceClassId: z.uuid(),
  sourceSectionId: z.uuid(),
});

export type TimetableScopeQueryDto = z.infer<typeof timetableScopeQuerySchema>;
export type ReplaceSectionTimetableDto = z.infer<
  typeof replaceSectionTimetableSchema
>;
export type TimetableStaffOptionsQueryDto = z.infer<
  typeof timetableStaffOptionsQuerySchema
>;
export type TeacherTimetableQueryDto = z.infer<
  typeof teacherTimetableQuerySchema
>;
export type CopySectionTimetableDto = z.infer<
  typeof copySectionTimetableSchema
>;

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseTimetableScopeQuery(
  query: unknown,
): TimetableScopeQueryDto {
  return parseSchema(timetableScopeQuerySchema, query);
}

export function parseReplaceSectionTimetable(
  body: unknown,
): ReplaceSectionTimetableDto {
  return parseSchema(replaceSectionTimetableSchema, body);
}

export function parseTimetableStaffOptionsQuery(
  query: unknown,
): TimetableStaffOptionsQueryDto {
  return parseSchema(timetableStaffOptionsQuerySchema, query);
}

export function parseTeacherTimetableQuery(
  query: unknown,
): TeacherTimetableQueryDto {
  return parseSchema(teacherTimetableQuerySchema, query);
}

export function parseCopySectionTimetable(
  body: unknown,
): CopySectionTimetableDto {
  return parseSchema(copySectionTimetableSchema, body);
}
