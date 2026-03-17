import { z } from "zod";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import {
  ANNOUNCEMENT_AUDIENCE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  STATUS,
} from "../../constants/status";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const TITLE_MIN_LENGTH = 1;
const BODY_MIN_LENGTH = 1;

export const sortableAnnouncementColumns = {
  publishedAt: "publishedAt",
  status: "status",
  title: "title",
  audience: "audience",
} as const;

export const listAnnouncementsQuerySchema = baseListQuerySchema.extend({
  campusId: z.uuid().optional(),
  audience: z
    .enum([
      ANNOUNCEMENT_AUDIENCE.ALL,
      ANNOUNCEMENT_AUDIENCE.STAFF,
      ANNOUNCEMENT_AUDIENCE.GUARDIANS,
      ANNOUNCEMENT_AUDIENCE.STUDENTS,
    ])
    .optional(),
  status: z
    .enum([
      STATUS.ANNOUNCEMENT.DRAFT,
      STATUS.ANNOUNCEMENT.PUBLISHED,
      STATUS.ANNOUNCEMENT.ARCHIVED,
    ])
    .optional(),
  sort: z
    .enum([
      sortableAnnouncementColumns.publishedAt,
      sortableAnnouncementColumns.status,
      sortableAnnouncementColumns.title,
      sortableAnnouncementColumns.audience,
    ])
    .optional(),
});

const baseAnnouncementSchema = z.object({
  campusId: z.uuid().optional(),
  title: z.string().trim().min(TITLE_MIN_LENGTH, "Announcement title is required"),
  summary: z.string().trim().min(1).max(240).optional(),
  body: z.string().trim().min(BODY_MIN_LENGTH, "Announcement body is required"),
  audience: z.enum([
    ANNOUNCEMENT_AUDIENCE.ALL,
    ANNOUNCEMENT_AUDIENCE.STAFF,
    ANNOUNCEMENT_AUDIENCE.GUARDIANS,
    ANNOUNCEMENT_AUDIENCE.STUDENTS,
  ]),
  publishNow: z.boolean().default(false),
});

export const createAnnouncementSchema = baseAnnouncementSchema;
export const updateAnnouncementSchema = baseAnnouncementSchema;

export const setAnnouncementStatusSchema = z.object({
  status: z.enum([
    STATUS.ANNOUNCEMENT.DRAFT,
    STATUS.ANNOUNCEMENT.ARCHIVED,
  ]),
});

export const listNotificationsQuerySchema = baseListQuerySchema.extend({
  campusId: z.uuid().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  actionRequired: z.coerce.boolean().optional(),
  channel: z
    .enum([
      NOTIFICATION_CHANNELS.SYSTEM,
      NOTIFICATION_CHANNELS.ACADEMICS,
      NOTIFICATION_CHANNELS.OPERATIONS,
      NOTIFICATION_CHANNELS.FINANCE,
      NOTIFICATION_CHANNELS.COMMUNITY,
    ])
    .optional(),
});

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.uuid()).optional(),
});

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementDto = z.infer<typeof updateAnnouncementSchema>;
export type SetAnnouncementStatusDto = z.infer<
  typeof setAnnouncementStatusSchema
>;
type ListAnnouncementsQueryInput = z.infer<typeof listAnnouncementsQuerySchema>;
export type ListAnnouncementsQueryDto = Omit<
  ListAnnouncementsQueryInput,
  "q"
> & {
  search?: string;
};
type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type ListNotificationsQueryDto = Omit<
  ListNotificationsQueryInput,
  "q"
> & {
  search?: string;
};
export type MarkNotificationsReadDto = z.infer<typeof markNotificationsReadSchema>;

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return parseListQuerySchema(schema, input);
}

export function parseCreateAnnouncement(body: unknown): CreateAnnouncementDto {
  return parseSchema(createAnnouncementSchema, body);
}

export function parseUpdateAnnouncement(body: unknown): UpdateAnnouncementDto {
  return parseSchema(updateAnnouncementSchema, body);
}

export function parseSetAnnouncementStatus(
  body: unknown,
): SetAnnouncementStatusDto {
  return parseSchema(setAnnouncementStatusSchema, body);
}

export function parseListAnnouncementsQuery(
  query: unknown,
): ListAnnouncementsQueryDto {
  const result = parseSchema(listAnnouncementsQuerySchema, query);

  return {
    audience: result.audience,
    campusId: result.campusId,
    limit: result.limit,
    order: result.order ?? SORT_ORDERS.DESC,
    page: result.page,
    search: result.q,
    sort: result.sort,
    status: result.status,
  };
}

export function parseListNotificationsQuery(
  query: unknown,
): ListNotificationsQueryDto {
  const result = parseSchema(listNotificationsQuerySchema, query);

  return {
    actionRequired: result.actionRequired,
    campusId: result.campusId,
    channel: result.channel,
    limit: result.limit,
    order: result.order ?? SORT_ORDERS.DESC,
    page: result.page,
    search: result.q,
    unreadOnly: result.unreadOnly,
  };
}

export function parseMarkNotificationsRead(
  body: unknown,
): MarkNotificationsReadDto {
  return parseSchema(markNotificationsReadSchema, body);
}

export function normalizeCommunicationValue(value: string | undefined) {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized : undefined;
}

export const supportedNotificationTypes = [
  NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
] as const;

export function ensurePublishableStatus(status: string) {
  if (status === STATUS.ANNOUNCEMENT.PUBLISHED) {
    throw new Error(ERROR_MESSAGES.COMMUNICATIONS.ANNOUNCEMENT_ALREADY_PUBLISHED);
  }
}
