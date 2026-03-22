import { BELL_SCHEDULE_STATUS } from "@repo/contracts";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_PERIOD_INDEX = 1;

export const sortableBellScheduleColumns = {
  name: "name",
  status: "status",
  createdAt: "createdAt",
} as const;

const bellSchedulePeriodBodySchema = z
  .object({
    periodIndex: z.coerce.number().int().min(MIN_PERIOD_INDEX),
    label: z.string().trim().min(1).max(100).optional(),
    startTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    endTime: z.string().regex(TIME_24H_REGEX, "Invalid time format"),
    isBreak: z.boolean().optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: ERROR_MESSAGES.BELL_SCHEDULES.PERIOD_INVALID_TIME_RANGE,
    path: ["endTime"],
  });

export const listBellSchedulesQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableBellScheduleColumns.name,
      sortableBellScheduleColumns.status,
      sortableBellScheduleColumns.createdAt,
    ])
    .optional(),
});

export const createBellScheduleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export const updateBellScheduleSchema = createBellScheduleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required",
  },
);

export const setBellScheduleStatusSchema = z.object({
  status: z.enum([
    BELL_SCHEDULE_STATUS.ACTIVE,
    BELL_SCHEDULE_STATUS.INACTIVE,
    BELL_SCHEDULE_STATUS.DELETED,
  ]),
});

export const replaceBellSchedulePeriodsSchema = z
  .object({
    periods: z.array(bellSchedulePeriodBodySchema).min(1),
  })
  .superRefine((value, context) => {
    const indexes = value.periods.map((period) => period.periodIndex);
    const uniqueIndexes = new Set(indexes);

    if (uniqueIndexes.size !== indexes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_MESSAGES.BELL_SCHEDULES.PERIOD_DUPLICATE_INDEX,
        path: ["periods"],
      });
    }

    const sortedIndexes = [...uniqueIndexes].sort((left, right) => left - right);
    const contiguous = sortedIndexes.every(
      (periodIndex, index) => periodIndex === index + 1,
    );

    if (!contiguous) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_MESSAGES.BELL_SCHEDULES.PERIOD_DUPLICATE_INDEX,
        path: ["periods"],
      });
    }

    if (!value.periods.some((period) => !period.isBreak)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_MESSAGES.BELL_SCHEDULES.DEFAULT_SCHEDULE_REQUIRED,
        path: ["periods"],
      });
    }
  });

export const bellScheduleIdSchema = z.object({
  scheduleId: z.uuid(),
});

type ListBellSchedulesQueryInput = z.infer<typeof listBellSchedulesQuerySchema>;

export type ListBellSchedulesQueryDto = Omit<ListBellSchedulesQueryInput, "q"> & {
  search?: string;
};
export type CreateBellScheduleDto = z.infer<typeof createBellScheduleSchema>;
export type UpdateBellScheduleDto = z.infer<typeof updateBellScheduleSchema>;
export type SetBellScheduleStatusDto = z.infer<typeof setBellScheduleStatusSchema>;
export type ReplaceBellSchedulePeriodsDto = z.infer<
  typeof replaceBellSchedulePeriodsSchema
>;

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseListBellSchedulesQuery(
  query: unknown,
): ListBellSchedulesQueryDto {
  const result = parseSchema(listBellSchedulesQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}

export function parseCreateBellSchedule(body: unknown): CreateBellScheduleDto {
  return parseSchema(createBellScheduleSchema, body);
}

export function parseUpdateBellSchedule(body: unknown): UpdateBellScheduleDto {
  return parseSchema(updateBellScheduleSchema, body);
}

export function parseSetBellScheduleStatus(
  body: unknown,
): SetBellScheduleStatusDto {
  return parseSchema(setBellScheduleStatusSchema, body);
}

export function parseReplaceBellSchedulePeriods(
  body: unknown,
): ReplaceBellSchedulePeriodsDto {
  return parseSchema(replaceBellSchedulePeriodsSchema, body);
}
