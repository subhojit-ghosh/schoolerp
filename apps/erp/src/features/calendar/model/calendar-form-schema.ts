import { z } from "zod";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const calendarFormSchema = z
  .object({
    title: z.string().trim().min(1, "Event title is required"),
    description: z.string().trim().max(500).optional(),
    eventDate: z.string().date(),
    isAllDay: z.boolean(),
    startTime: z.string().regex(TIME_24H_REGEX, "Invalid time format").optional(),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format").optional(),
    eventType: z.enum(["event", "holiday", "exam", "deadline"]),
  })
  .refine(
    (value) => {
      if (value.isAllDay) {
        return true;
      }

      if (!value.startTime || !value.endTime) {
        return false;
      }

      return value.endTime > value.startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type CalendarFormValues = z.infer<typeof calendarFormSchema>;
