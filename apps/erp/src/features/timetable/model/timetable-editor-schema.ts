import { WEEKDAY_KEYS } from "@repo/contracts";
import { z } from "zod";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timetableEntryFormSchema = z
  .object({
    dayOfWeek: z.enum([
      WEEKDAY_KEYS.MONDAY,
      WEEKDAY_KEYS.TUESDAY,
      WEEKDAY_KEYS.WEDNESDAY,
      WEEKDAY_KEYS.THURSDAY,
      WEEKDAY_KEYS.FRIDAY,
      WEEKDAY_KEYS.SATURDAY,
      WEEKDAY_KEYS.SUNDAY,
    ]),
    periodIndex: z.number().int().min(1),
    startTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    subjectId: z.uuid("Select a subject"),
    room: z.string().trim().max(100).optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ["endTime"],
    message: "End time must be after start time",
  });

export const timetableEditorFormSchema = z.object({
  entries: z.array(timetableEntryFormSchema),
});

export type TimetableEditorFormValues = z.infer<typeof timetableEditorFormSchema>;

export const WEEKDAY_OPTIONS = [
  { label: "Monday", value: WEEKDAY_KEYS.MONDAY },
  { label: "Tuesday", value: WEEKDAY_KEYS.TUESDAY },
  { label: "Wednesday", value: WEEKDAY_KEYS.WEDNESDAY },
  { label: "Thursday", value: WEEKDAY_KEYS.THURSDAY },
  { label: "Friday", value: WEEKDAY_KEYS.FRIDAY },
  { label: "Saturday", value: WEEKDAY_KEYS.SATURDAY },
  { label: "Sunday", value: WEEKDAY_KEYS.SUNDAY },
] as const;
