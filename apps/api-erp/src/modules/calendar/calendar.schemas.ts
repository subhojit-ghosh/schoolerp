import { CALENDAR_EVENT_TYPES } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TITLE_MIN_LENGTH = 1;

export const sortableCalendarColumns = {
  date: "date",
  title: "title",
  status: "status",
  type: "type",
} as const;

const baseCalendarEventSchema = z
  .object({
    title: z.string().trim().min(TITLE_MIN_LENGTH, "Event title is required"),
    description: z.string().trim().min(1).max(500).optional(),
    eventDate: z.string().date(),
    startTime: z
      .string()
      .regex(TIME_24H_REGEX, "Invalid time format")
      .optional(),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format").optional(),
    isAllDay: z.boolean().default(true),
    eventType: z.enum([
      CALENDAR_EVENT_TYPES.HOLIDAY,
      CALENDAR_EVENT_TYPES.EXAM,
      CALENDAR_EVENT_TYPES.EVENT,
      CALENDAR_EVENT_TYPES.DEADLINE,
    ]),
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
      message: ERROR_MESSAGES.CALENDAR.INVALID_TIME_RANGE,
      path: ["endTime"],
    },
  );

export const createCalendarEventSchema = baseCalendarEventSchema;
export const updateCalendarEventSchema = baseCalendarEventSchema;

export const setCalendarEventStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listCalendarEventsQuerySchema = baseListQuerySchema.extend({
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  sort: z
    .enum([
      sortableCalendarColumns.date,
      sortableCalendarColumns.title,
      sortableCalendarColumns.status,
      sortableCalendarColumns.type,
    ])
    .optional(),
});

export type CreateCalendarEventDto = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventDto = z.infer<typeof updateCalendarEventSchema>;
export type SetCalendarEventStatusDto = z.infer<
  typeof setCalendarEventStatusSchema
>;

type ListCalendarEventsQueryInput = z.infer<
  typeof listCalendarEventsQuerySchema
>;
export type ListCalendarEventsQueryDto = Omit<
  ListCalendarEventsQueryInput,
  "q"
> & {
  search?: string;
};

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseCreateCalendarEvent(
  body: unknown,
): CreateCalendarEventDto {
  return parseSchema(createCalendarEventSchema, body);
}

export function parseUpdateCalendarEvent(
  body: unknown,
): UpdateCalendarEventDto {
  return parseSchema(updateCalendarEventSchema, body);
}

export function parseSetCalendarEventStatus(
  body: unknown,
): SetCalendarEventStatusDto {
  return parseSchema(setCalendarEventStatusSchema, body);
}

export function parseListCalendarEventsQuery(
  query: unknown,
): ListCalendarEventsQueryDto {
  const result = parseSchema(listCalendarEventsQuerySchema, query);

  return {
    fromDate: result.fromDate,
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
    toDate: result.toDate,
  };
}

export function normalizeCalendarValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}
