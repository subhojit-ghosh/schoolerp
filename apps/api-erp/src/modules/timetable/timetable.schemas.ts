import { TIMETABLE_VERSION_STATUS, WEEKDAY_KEYS } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import { parseListQuerySchema } from "../../lib/list-query";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_PERIOD_INDEX = 1;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
  versionId: z.uuid().optional(),
  date: z.string().regex(DATE_REGEX).optional(),
});

export const replaceSectionTimetableSchema = z
  .object({
    classId: z.uuid(),
    versionId: z.uuid(),
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
  date: z.string().regex(DATE_REGEX).optional(),
});

export const copySectionTimetableSchema = z.object({
  classId: z.uuid(),
  versionId: z.uuid(),
  sourceClassId: z.uuid(),
  sourceSectionId: z.uuid(),
  sourceVersionId: z.uuid().optional(),
});

export const listTimetableVersionsQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
});

export const createTimetableVersionSchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  bellScheduleId: z.uuid().optional(),
  duplicateFromVersionId: z.uuid().optional(),
});

export const updateTimetableVersionSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    bellScheduleId: z.uuid().optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const publishTimetableVersionSchema = z
  .object({
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: z.string().regex(DATE_REGEX).optional(),
  })
  .refine(
    (value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom,
    {
      message: ERROR_MESSAGES.TIMETABLE.ASSIGNMENT_DATE_RANGE_INVALID,
      path: ["effectiveTo"],
    },
  );

export const setTimetableVersionStatusSchema = z.object({
  status: z.enum([
    TIMETABLE_VERSION_STATUS.DRAFT,
    TIMETABLE_VERSION_STATUS.PUBLISHED,
    TIMETABLE_VERSION_STATUS.ARCHIVED,
  ]),
});

export const timetableVersionIdSchema = z.object({
  versionId: z.uuid(),
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
export type ListTimetableVersionsQueryDto = z.infer<
  typeof listTimetableVersionsQuerySchema
>;
export type CreateTimetableVersionDto = z.infer<
  typeof createTimetableVersionSchema
>;
export type UpdateTimetableVersionDto = z.infer<
  typeof updateTimetableVersionSchema
>;
export type PublishTimetableVersionDto = z.infer<
  typeof publishTimetableVersionSchema
>;
export type SetTimetableVersionStatusDto = z.infer<
  typeof setTimetableVersionStatusSchema
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

export function parseListTimetableVersionsQuery(
  query: unknown,
): ListTimetableVersionsQueryDto {
  return parseSchema(listTimetableVersionsQuerySchema, query);
}

export function parseCreateTimetableVersion(
  body: unknown,
): CreateTimetableVersionDto {
  return parseSchema(createTimetableVersionSchema, body);
}

export function parseUpdateTimetableVersion(
  body: unknown,
): UpdateTimetableVersionDto {
  return parseSchema(updateTimetableVersionSchema, body);
}

export function parsePublishTimetableVersion(
  body: unknown,
): PublishTimetableVersionDto {
  return parseSchema(publishTimetableVersionSchema, body);
}

export function parseSetTimetableVersionStatus(
  body: unknown,
): SetTimetableVersionStatusDto {
  return parseSchema(setTimetableVersionStatusSchema, body);
}
