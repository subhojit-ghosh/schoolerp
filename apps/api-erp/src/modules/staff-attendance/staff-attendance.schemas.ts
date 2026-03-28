import { BadRequestException } from "@nestjs/common";
import { staffAttendanceStatusSchema } from "@repo/contracts";
import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function hasUniqueStaffMembershipIds(
  entries: { staffMembershipId: string }[],
) {
  return (
    new Set(entries.map((entry) => entry.staffMembershipId)).size ===
    entries.length
  );
}

export const staffAttendanceDateSchema = z
  .string()
  .regex(DATE_PATTERN, "Attendance date must be in YYYY-MM-DD format");

export const staffAttendanceRosterQuerySchema = z.object({
  campusId: z.uuid(),
  attendanceDate: staffAttendanceDateSchema,
});

export const staffAttendanceEntrySchema = z.object({
  staffMembershipId: z.uuid(),
  status: staffAttendanceStatusSchema,
  notes: z.string().optional(),
});

export const upsertStaffAttendanceDaySchema = z
  .object({
    campusId: z.uuid(),
    attendanceDate: staffAttendanceDateSchema,
    entries: z.array(staffAttendanceEntrySchema).min(1, "At least one entry is required"),
  })
  .refine((value) => hasUniqueStaffMembershipIds(value.entries), {
    path: ["entries"],
    message:
      "Each staff member can appear only once in the daily attendance submission.",
  });

export const staffAttendanceDayViewQuerySchema = z.object({
  attendanceDate: staffAttendanceDateSchema,
});

export const staffAttendanceReportQuerySchema = z.object({
  campusId: z.uuid(),
  fromDate: staffAttendanceDateSchema,
  toDate: staffAttendanceDateSchema,
});

export type StaffAttendanceRosterQueryDto = z.infer<
  typeof staffAttendanceRosterQuerySchema
>;
export type UpsertStaffAttendanceDayDto = z.infer<
  typeof upsertStaffAttendanceDaySchema
>;
export type StaffAttendanceDayViewQueryDto = z.infer<
  typeof staffAttendanceDayViewQuerySchema
>;
export type StaffAttendanceReportQueryDto = z.infer<
  typeof staffAttendanceReportQuerySchema
>;

function parseSchema<T>(schema: z.ZodSchema<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseStaffAttendanceRosterQuery(input: unknown) {
  return parseSchema(staffAttendanceRosterQuerySchema, input);
}

export function parseUpsertStaffAttendanceDay(input: unknown) {
  return parseSchema(upsertStaffAttendanceDaySchema, input);
}

export function parseStaffAttendanceDayViewQuery(input: unknown) {
  return parseSchema(staffAttendanceDayViewQuerySchema, input);
}

export function parseStaffAttendanceReportQuery(input: unknown) {
  return parseSchema(staffAttendanceReportQuerySchema, input);
}
