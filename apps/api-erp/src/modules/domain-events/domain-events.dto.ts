import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DOMAIN_EVENT_STATUS, DOMAIN_EVENT_TYPES } from "@repo/contracts";
import { SORT_ORDERS } from "../../constants";
import { sortableDomainEventColumns } from "./domain-events.schemas";

export class ListDomainEventsQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableDomainEventColumns),
  })
  sort?: keyof typeof sortableDomainEventColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({
    enum: Object.values(DOMAIN_EVENT_TYPES),
  })
  eventType?: string;

  @ApiPropertyOptional({
    enum: Object.values(DOMAIN_EVENT_STATUS),
  })
  status?: string;
}

export class DomainEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty({
    enum: Object.values(DOMAIN_EVENT_TYPES),
  })
  eventType!: string;

  @ApiProperty({ additionalProperties: true })
  payload!: Record<string, unknown>;

  @ApiProperty({
    enum: Object.values(DOMAIN_EVENT_STATUS),
  })
  status!: string;

  @ApiProperty()
  attempts!: number;

  @ApiProperty()
  maxAttempts!: number;

  @ApiPropertyOptional({ nullable: true })
  lastError?: string | null;

  @ApiPropertyOptional({ nullable: true })
  processedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledFor?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListDomainEventsResultDto {
  @ApiProperty({
    type: () => DomainEventDto,
    isArray: true,
  })
  rows!: DomainEventDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}

export class RetryDomainEventResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;
}
