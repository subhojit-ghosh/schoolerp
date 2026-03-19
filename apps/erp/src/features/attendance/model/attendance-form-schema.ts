import { attendanceStatusSchema } from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

export const attendanceSelectionSchema = z.object({
  attendanceDate: z.string().min(1, "Date is required"),
  classId: z.string().trim().min(1, "Class is required"),
  sectionId: z.string().trim().min(1, "Section is required"),
});

export const attendanceEntryFormSchema = attendanceSelectionSchema.extend({
  entries: z.array(
    z.object({
      studentId: z.uuid(),
      // Empty string = not yet marked by the teacher (draft state)
      status: attendanceStatusSchema.or(z.literal("")),
    }),
  ),
});

export const DEFAULT_ATTENDANCE_SELECTION_VALUES: AttendanceSelectionValues = {
  attendanceDate: DEFAULT_DATE,
  classId: "",
  sectionId: "",
};

export const UNSET_ATTENDANCE_STATUS = "" as const;

export type AttendanceSelectionValues = z.infer<
  typeof attendanceSelectionSchema
>;
export type AttendanceEntryFormValues = z.infer<
  typeof attendanceEntryFormSchema
>;
export type AttendanceStatusOption = z.infer<typeof attendanceStatusSchema>;

export type AttendanceClassSectionRecord =
  components["schemas"]["AttendanceClassSectionDto"];
export type AttendanceDayRecord = components["schemas"]["AttendanceDayDto"];
export type AttendanceDayViewRecord =
  components["schemas"]["AttendanceDayViewItemDto"];
