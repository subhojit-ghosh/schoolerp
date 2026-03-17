import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS } from "../../constants";
import {
  ANNOUNCEMENT_AUDIENCE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  STATUS,
} from "../../constants/status";
import { sortableAnnouncementColumns } from "./communications.schemas";

export class ListAnnouncementsQueryDto {
  @ApiPropertyOptional({ nullable: true })
  campusId?: string;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableAnnouncementColumns),
  })
  sort?: keyof typeof sortableAnnouncementColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({
    enum: Object.values(ANNOUNCEMENT_AUDIENCE),
  })
  audience?: (typeof ANNOUNCEMENT_AUDIENCE)[keyof typeof ANNOUNCEMENT_AUDIENCE];

  @ApiPropertyOptional({
    enum: [
      STATUS.ANNOUNCEMENT.DRAFT,
      STATUS.ANNOUNCEMENT.PUBLISHED,
      STATUS.ANNOUNCEMENT.ARCHIVED,
    ],
  })
  status?: "draft" | "published" | "archived";
}

export class CreateAnnouncementBodyDto {
  @ApiPropertyOptional({ nullable: true })
  campusId?: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  summary?: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({
    enum: Object.values(ANNOUNCEMENT_AUDIENCE),
  })
  audience!: "all" | "staff" | "guardians" | "students";

  @ApiPropertyOptional({ default: false })
  publishNow?: boolean;
}

export class UpdateAnnouncementBodyDto extends CreateAnnouncementBodyDto {}

export class SetAnnouncementStatusBodyDto {
  @ApiProperty({
    enum: [STATUS.ANNOUNCEMENT.DRAFT, STATUS.ANNOUNCEMENT.ARCHIVED],
  })
  status!: "draft" | "archived";
}

export class AnnouncementDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName?: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  summary?: string | null;

  @ApiProperty()
  body!: string;

  @ApiProperty({
    enum: Object.values(ANNOUNCEMENT_AUDIENCE),
  })
  audience!: "all" | "staff" | "guardians" | "students";

  @ApiProperty({
    enum: Object.values(STATUS.ANNOUNCEMENT),
  })
  status!: "draft" | "published" | "archived" | "deleted";

  @ApiPropertyOptional({ nullable: true })
  publishedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  createdByUserId!: string;
}

export class ListAnnouncementsResultDto {
  @ApiProperty({
    type: () => AnnouncementDto,
    isArray: true,
  })
  rows!: AnnouncementDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ nullable: true })
  campusId?: string;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional()
  actionRequired?: boolean;

  @ApiPropertyOptional({
    enum: Object.values(NOTIFICATION_CHANNELS),
  })
  channel?: (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
}

export class MarkNotificationsReadBodyDto {
  @ApiPropertyOptional({ type: [String] })
  notificationIds?: string[];
}

export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  announcementId?: string | null;

  @ApiProperty({
    enum: Object.values(NOTIFICATION_TYPES),
  })
  type!: "announcement_published";

  @ApiProperty({
    enum: Object.values(NOTIFICATION_CHANNELS),
  })
  channel!: "system" | "academics" | "operations" | "finance" | "community";

  @ApiProperty({
    enum: Object.values(NOTIFICATION_TONES),
  })
  tone!: "critical" | "info" | "positive" | "warning";

  @ApiProperty({
    enum: Object.values(ANNOUNCEMENT_AUDIENCE),
  })
  audience!: "all" | "staff" | "guardians" | "students";

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  senderLabel!: string;

  @ApiPropertyOptional({ nullable: true })
  actionLabel?: string | null;

  @ApiPropertyOptional({ nullable: true })
  actionHref?: string | null;

  @ApiProperty()
  actionRequired!: boolean;

  @ApiProperty()
  unread!: boolean;

  @ApiProperty()
  createdAt!: string;
}

export class ListNotificationsResultDto {
  @ApiProperty({
    type: () => NotificationDto,
    isArray: true,
  })
  rows!: NotificationDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;

  @ApiProperty()
  unreadCount!: number;

  @ApiProperty()
  actionRequiredCount!: number;
}
