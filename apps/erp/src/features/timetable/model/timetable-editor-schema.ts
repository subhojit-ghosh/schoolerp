import { WEEKDAY_KEYS } from "@repo/contracts";
import { z } from "zod";

export const timetableCellValueSchema = z.object({
  subjectId: z.uuid("Select a subject"),
  staffId: z.uuid().optional().nullable(),
  room: z.string().trim().max(100).optional(),
  bellSchedulePeriodId: z.uuid().optional().nullable(),
});

export type TimetableCellValue = {
  bellSchedulePeriodId?: string | null;
  classId?: string;
  className?: string;
  id?: string;
  room?: string;
  sectionId?: string;
  sectionName?: string;
  staffId?: string | null;
  staffName?: string | null;
  subjectId: string;
  subjectName: string;
};

export const timetableCellFormSchema = timetableCellValueSchema;

export type TimetableCellFormValues = z.infer<typeof timetableCellFormSchema>;

export const WEEKDAY_OPTIONS = [
  { label: "Monday", value: WEEKDAY_KEYS.MONDAY },
  { label: "Tuesday", value: WEEKDAY_KEYS.TUESDAY },
  { label: "Wednesday", value: WEEKDAY_KEYS.WEDNESDAY },
  { label: "Thursday", value: WEEKDAY_KEYS.THURSDAY },
  { label: "Friday", value: WEEKDAY_KEYS.FRIDAY },
  { label: "Saturday", value: WEEKDAY_KEYS.SATURDAY },
  { label: "Sunday", value: WEEKDAY_KEYS.SUNDAY },
] as const;

export type TimetableWeekday = (typeof WEEKDAY_OPTIONS)[number]["value"];

export const DEFAULT_SCHOOL_DAY_VALUES = [
  WEEKDAY_KEYS.MONDAY,
  WEEKDAY_KEYS.TUESDAY,
  WEEKDAY_KEYS.WEDNESDAY,
  WEEKDAY_KEYS.THURSDAY,
  WEEKDAY_KEYS.FRIDAY,
] as const satisfies readonly TimetableWeekday[];
