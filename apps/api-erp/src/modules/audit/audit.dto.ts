import { SORT_ORDERS } from "../../constants";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { sortableAuditLogColumns } from "./audit.schemas";

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableAuditLogColumns),
  })
  sort?: keyof typeof sortableAuditLogColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({
    enum: Object.values(AUDIT_ACTIONS),
  })
  action?: (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

  @ApiPropertyOptional({
    enum: Object.values(AUDIT_ENTITY_TYPES),
  })
  entityType?: (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

  @ApiPropertyOptional()
  actorUserId?: string;
}

export class AuditActorDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contextKey?: string | null;
}

export class AuditLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty({
    enum: Object.values(AUDIT_ACTIONS),
  })
  action!:
    | "create"
    | "update"
    | "delete"
    | "mark"
    | "replace"
    | "reverse"
    | "execute";

  @ApiProperty({
    enum: Object.values(AUDIT_ENTITY_TYPES),
  })
  entityType!:
    | "role"
    | "attendance_day"
    | "exam_marks"
    | "fee_payment"
    | "student_rollover";

  @ApiPropertyOptional({ nullable: true })
  entityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityLabel?: string | null;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ type: () => AuditActorDto })
  actor!: AuditActorDto;

  @ApiPropertyOptional({
    nullable: true,
    additionalProperties: true,
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;
}

export class ListAuditLogsResultDto {
  @ApiProperty({
    type: () => AuditLogDto,
    isArray: true,
  })
  rows!: AuditLogDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
