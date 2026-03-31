import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS } from "../../constants";
import { sortableSensitiveAccessColumns } from "./dpdpa.schemas";

// ── Consent DTOs ────────────────────────────────────────────────────────

export class GrantConsentBodyDto {
  purpose!: string;
}

export class ConsentDto {
  id!: string;
  institutionId!: string;
  userId!: string;
  purpose!: string;
  status!: string;
  consentedAt!: string;
  withdrawnAt!: string | null;
  ipAddress!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

// ── Sensitive access log DTOs ───────────────────────────────────────────

export class ListSensitiveAccessQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableSensitiveAccessColumns),
  })
  sort?: keyof typeof sortableSensitiveAccessColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional()
  dataType?: string;

  @ApiPropertyOptional()
  entityType?: string;

  @ApiPropertyOptional()
  accessedByUserId?: string;
}

export class SensitiveAccessLogDto {
  id!: string;
  institutionId!: string;
  accessedByUserId!: string;
  accessedByName!: string;
  dataType!: string;
  entityType!: string;
  entityId!: string;
  action!: string;
  ipAddress!: string | null;
  createdAt!: string;
}

export class ListSensitiveAccessResultDto {
  @ApiProperty({ type: () => SensitiveAccessLogDto, isArray: true })
  rows!: SensitiveAccessLogDto[];

  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

// ── Session config DTOs ─────────────────────────────────────────────────

export class UpdateSessionConfigBodyDto {
  maxConcurrentSessions?: number;
  sessionTimeoutMinutes?: number;
  requireReauthForSensitiveOps?: boolean;
}

export class SessionConfigDto {
  id!: string;
  institutionId!: string;
  maxConcurrentSessions!: number;
  sessionTimeoutMinutes!: number;
  requireReauthForSensitiveOps!: boolean;
  createdAt!: string;
  updatedAt!: string;
}
