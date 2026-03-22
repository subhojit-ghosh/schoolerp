import { z } from "zod";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const bellSchedulePeriodFormSchema = z
  .object({
    periodIndex: z.number().int().min(1),
    label: z.string().trim().max(100).optional(),
    startTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    isBreak: z.boolean(),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ["endTime"],
    message: "End time must be after start time",
  });

export const bellScheduleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Schedule name is required").max(100),
    isDefault: z.boolean(),
    periods: z.array(bellSchedulePeriodFormSchema).min(1),
  })
  .superRefine((value, context) => {
    if (!value.periods.some((period) => !period.isBreak)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one teaching period",
        path: ["periods"],
      });
    }
  });

export type BellScheduleFormValues = z.infer<typeof bellScheduleFormSchema>;
