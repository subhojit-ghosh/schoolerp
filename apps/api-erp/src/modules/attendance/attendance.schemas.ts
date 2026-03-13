import { BadRequestException } from "@nestjs/common";
import { attendanceStatusSchema } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAME_MIN_LENGTH = 1;

function hasUniqueStudentIds(entries: { studentId: string }[]) {
  return new Set(entries.map((entry) => entry.studentId)).size === entries.length;
}

export const attendanceDateSchema = z
  .string()
  .regex(DATE_PATTERN, "Attendance date must be in YYYY-MM-DD format");

export const attendanceScopeSchema = z.object({
  campusId: z.uuid(),
  classId: z.string().trim().min(NAME_MIN_LENGTH, "Class is required"),
  sectionId: z.string().trim().min(NAME_MIN_LENGTH, "Section is required"),
});

export const attendanceDayQuerySchema = z.object({
  attendanceDate: attendanceDateSchema,
  campusId: z.uuid(),
  classId: z.string().trim().min(NAME_MIN_LENGTH, "Class is required"),
  sectionId: z.string().trim().min(NAME_MIN_LENGTH, "Section is required"),
});

export const attendanceClassSectionQuerySchema = z.object({
  campusId: z.uuid(),
});

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
    campusId: z.uuid(),
    classId: z.string().trim().min(NAME_MIN_LENGTH, "Class is required"),
    sectionId: z.string().trim().min(NAME_MIN_LENGTH, "Section is required"),
    entries: z
      .array(attendanceEntrySchema)
      .min(1, ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND),
  })
  .refine((value) => hasUniqueStudentIds(value.entries), {
    path: ["entries"],
    message: "Each student can appear only once in the daily attendance submission.",
  });

export type AttendanceClassSectionQueryDto = z.infer<
  typeof attendanceClassSectionQuerySchema
>;
export type AttendanceDayQueryDto = z.infer<typeof attendanceDayQuerySchema>;
export type AttendanceDayViewQueryDto = z.infer<
  typeof attendanceDayViewQuerySchema
>;
export type UpsertAttendanceDayDto = z.infer<typeof upsertAttendanceDaySchema>;

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
