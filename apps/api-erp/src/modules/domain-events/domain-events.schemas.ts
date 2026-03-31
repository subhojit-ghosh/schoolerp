import { z } from "zod";
import { DOMAIN_EVENT_STATUS, DOMAIN_EVENT_TYPES } from "@repo/contracts";
import {
  baseListQuerySchema,
  parseListQuerySchema,
  type BaseListQuery,
} from "../../lib/list-query";
import type { ListDomainEventsQueryDto } from "./domain-events.dto";

export const sortableDomainEventColumns = {
  createdAt: "createdAt",
  eventType: "eventType",
  status: "status",
} as const;

export const listDomainEventsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableDomainEventColumns.createdAt,
      sortableDomainEventColumns.eventType,
      sortableDomainEventColumns.status,
    ])
    .optional(),
  eventType: z
    .enum([
      DOMAIN_EVENT_TYPES.ATTENDANCE_MARKED,
      DOMAIN_EVENT_TYPES.ATTENDANCE_ABSENT,
      DOMAIN_EVENT_TYPES.ATTENDANCE_ABSENT_STREAK,
      DOMAIN_EVENT_TYPES.FEE_PAYMENT_RECEIVED,
      DOMAIN_EVENT_TYPES.FEE_OVERDUE,
      DOMAIN_EVENT_TYPES.ADMISSION_APPROVED,
      DOMAIN_EVENT_TYPES.STUDENT_CREATED,
      DOMAIN_EVENT_TYPES.ANNOUNCEMENT_PUBLISHED,
      DOMAIN_EVENT_TYPES.LEAVE_APPROVED,
      DOMAIN_EVENT_TYPES.LEAVE_REJECTED,
      DOMAIN_EVENT_TYPES.EMERGENCY_BROADCAST,
    ])
    .optional(),
  status: z
    .enum([
      DOMAIN_EVENT_STATUS.PENDING,
      DOMAIN_EVENT_STATUS.PROCESSING,
      DOMAIN_EVENT_STATUS.PROCESSED,
      DOMAIN_EVENT_STATUS.FAILED,
    ])
    .optional(),
});

export type ListDomainEventsQuery = BaseListQuery & {
  sort?: keyof typeof sortableDomainEventColumns;
  eventType?: string;
  status?: string;
};

export function parseListDomainEventsQuery(
  query: ListDomainEventsQueryDto,
): ListDomainEventsQuery {
  const parsed = parseListQuerySchema(listDomainEventsQuerySchema, query);

  return {
    page: parsed.page,
    limit: parsed.limit,
    search: parsed.q,
    sort: parsed.sort,
    order: parsed.order,
    eventType: parsed.eventType,
    status: parsed.status,
  };
}
