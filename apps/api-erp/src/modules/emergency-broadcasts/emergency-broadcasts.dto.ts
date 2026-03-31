import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  BROADCAST_STATUS,
  BROADCAST_TARGET_TYPES,
  BROADCAST_PRIORITY,
  type BroadcastStatus,
  type BroadcastTargetType,
  type BroadcastPriority,
} from "@repo/contracts";

// ── Broadcasts ──────────────────────────────────────────────────────────────

export class CreateBroadcastBodyDto {
  title!: string;
  message!: string;
  templateKey?: string;

  @ApiProperty({ enum: Object.values(BROADCAST_TARGET_TYPES) })
  targetType!: BroadcastTargetType;

  targetId?: string;

  @ApiPropertyOptional({ enum: Object.values(BROADCAST_PRIORITY) })
  priority?: BroadcastPriority;

  @ApiProperty({ type: [String] })
  channels!: string[];
}

export class UpdateBroadcastBodyDto {
  title?: string;
  message?: string;

  @ApiPropertyOptional({ nullable: true })
  templateKey?: string | null;

  @ApiPropertyOptional({ enum: Object.values(BROADCAST_TARGET_TYPES) })
  targetType?: BroadcastTargetType;

  @ApiPropertyOptional({ nullable: true })
  targetId?: string | null;

  @ApiPropertyOptional({ enum: Object.values(BROADCAST_PRIORITY) })
  priority?: BroadcastPriority;

  @ApiPropertyOptional({ type: [String] })
  channels?: string[];
}

export class ListBroadcastsQueryParamsDto {
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(BROADCAST_STATUS),
  })
  status?: BroadcastStatus;

  @ApiPropertyOptional({ enum: Object.values(BROADCAST_PRIORITY) })
  priority?: BroadcastPriority;

  page?: number;
  limit?: number;

  @ApiPropertyOptional({ enum: ["createdAt", "sentAt"] })
  sort?: "createdAt" | "sentAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  order?: "asc" | "desc";
}

export class BroadcastDto {
  id!: string;
  institutionId!: string;
  title!: string;
  message!: string;

  @ApiPropertyOptional({ nullable: true })
  templateKey!: string | null;

  @ApiProperty({ enum: Object.values(BROADCAST_TARGET_TYPES) })
  targetType!: BroadcastTargetType;

  @ApiPropertyOptional({ nullable: true })
  targetId!: string | null;

  @ApiProperty({ enum: Object.values(BROADCAST_PRIORITY) })
  priority!: BroadcastPriority;

  @ApiProperty({ type: [String] })
  channels!: string[];

  @ApiProperty({ enum: Object.values(BROADCAST_STATUS) })
  status!: BroadcastStatus;

  @ApiPropertyOptional({ nullable: true })
  sentAt!: string | null;

  sentByMemberName!: string;
  totalRecipients!: number;
  deliveredCount!: number;
  failedCount!: number;
  createdAt!: string;
}

export class BroadcastListResultDto {
  @ApiProperty({ type: BroadcastDto, isArray: true })
  rows!: BroadcastDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class DeliveryStatsChannelDto {
  channel!: string;
  pending!: number;
  delivered!: number;
  failed!: number;
}

export class DeliveryStatsDto {
  totalRecipients!: number;
  deliveredCount!: number;
  failedCount!: number;
  pendingCount!: number;

  @ApiProperty({ type: DeliveryStatsChannelDto, isArray: true })
  byChannel!: DeliveryStatsChannelDto[];
}

export class BroadcastTemplateDto {
  key!: string;
  label!: string;
  defaultTitle!: string;
  defaultMessage!: string;
}

export class BroadcastTemplateListDto {
  @ApiProperty({ type: BroadcastTemplateDto, isArray: true })
  templates!: BroadcastTemplateDto[];
}
