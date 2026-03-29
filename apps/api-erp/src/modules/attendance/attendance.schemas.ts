import { BadRequestException } from "@nestjs/common";
import { attendanceStatusSchema } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function hasUniqueStudentIds(entries: { studentId: string }[]) {
  return (
    new Set(entries.map((entry) => entry.studentId)).size === entries.length
  );
}

export const attendanceDateSchema = z
  .string()
  .regex(DATE_PATTERN, "Attendance date must be in YYYY-MM-DD format");

export const attendanceScopeSchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
});

export const attendanceDayQuerySchema = z.object({
  attendanceDate: attendanceDateSchema,
  classId: z.uuid(),
  sectionId: z.uuid(),
});

export const attendanceClassSectionQuerySchema = z.object({});

export const attendanceDayViewQuerySchema = z.object({
  attendanceDate: attendanceDateSchema,
});

export const attendanceEntrySchema = z.object({
  studentId: z.uuid(),
  status: attendanceStatusSchema,
});

export const upsertAttendanceDaySchema = z
  .object({
    attendanceDate: attendanceDateSchema,
    classId: z.uuid(),
    sectionId: z.uuid(),
    entries: z
      .array(attendanceEntrySchema)
      .min(1, ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND),
  })
  .refine((value) => hasUniqueStudentIds(value.entries), {
    path: ["entries"],
    message:
      "Each student can appear only once in the daily attendance submission.",
  });

export const attendanceOverviewQuerySchema = z.object({
  date: attendanceDateSchema,
});

export const attendanceClassReportQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
  startDate: attendanceDateSchema,
  endDate: attendanceDateSchema,
});

export const attendanceStudentReportQuerySchema = z.object({
  studentId: z.uuid(),
  startDate: attendanceDateSchema,
  endDate: attendanceDateSchema,
});

export const monthlyRegisterQuerySchema = z.object({
  classId: z.uuid(),
  sectionId: z.uuid(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const consolidatedReportQuerySchema = z.object({
  campusId: z.uuid().optional(),
  startDate: attendanceDateSchema,
  endDate: attendanceDateSchema,
});

export const chronicAbsenteesQuerySchema = z.object({
  campusId: z.uuid().optional(),
  startDate: attendanceDateSchema,
  endDate: attendanceDateSchema,
  threshold: z.coerce.number().int().min(0).max(100).optional().default(75),
});

export type AttendanceClassSectionQueryDto = z.infer<
  typeof attendanceClassSectionQuerySchema
>;
export type AttendanceDayQueryDto = z.infer<typeof attendanceDayQuerySchema>;
export type AttendanceDayViewQueryDto = z.infer<
  typeof attendanceDayViewQuerySchema
>;
export type UpsertAttendanceDayDto = z.infer<typeof upsertAttendanceDaySchema>;
export type AttendanceOverviewQueryDto = z.infer<
  typeof attendanceOverviewQuerySchema
>;
export type AttendanceClassReportQueryDto = z.infer<
  typeof attendanceClassReportQuerySchema
>;
export type AttendanceStudentReportQueryDto = z.infer<
  typeof attendanceStudentReportQuerySchema
>;
export type MonthlyRegisterQueryDto = z.infer<
  typeof monthlyRegisterQuerySchema
>;
export type ConsolidatedReportQueryDto = z.infer<
  typeof consolidatedReportQuerySchema
>;
export type ChronicAbsenteesQueryDto = z.infer<
  typeof chronicAbsenteesQuerySchema
>;

function parseSchema<T>(schema: z.ZodSchema<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseAttendanceClassSectionQuery(input: unknown) {
  return parseSchema(attendanceClassSectionQuerySchema, input);
}

export function parseAttendanceDayQuery(input: unknown) {
  return parseSchema(attendanceDayQuerySchema, input);
}

export function parseAttendanceDayViewQuery(input: unknown) {
  return parseSchema(attendanceDayViewQuerySchema, input);
}

export function parseUpsertAttendanceDay(input: unknown) {
  return parseSchema(upsertAttendanceDaySchema, input);
}

export function parseAttendanceOverviewQuery(input: unknown) {
  return parseSchema(attendanceOverviewQuerySchema, input);
}

export function parseAttendanceClassReportQuery(input: unknown) {
  return parseSchema(attendanceClassReportQuerySchema, input);
}

export function parseAttendanceStudentReportQuery(input: unknown) {
  return parseSchema(attendanceStudentReportQuerySchema, input);
}

export function parseMonthlyRegisterQuery(input: unknown) {
  return parseSchema(monthlyRegisterQuerySchema, input);
}

export function parseConsolidatedReportQuery(input: unknown) {
  return parseSchema(consolidatedReportQuerySchema, input);
}

export function parseChronicAbsenteesQuery(input: unknown) {
  return parseSchema(chronicAbsenteesQuerySchema, input);
}
