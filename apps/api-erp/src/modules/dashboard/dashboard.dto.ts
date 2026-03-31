import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NeedsAttentionItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty()
  actionUrl!: string;

  @ApiProperty()
  priority!: string;

  @ApiPropertyOptional({ nullable: true, additionalProperties: true })
  metadata?: Record<string, unknown> | null;
}

export class NeedsAttentionResultDto {
  @ApiProperty({
    type: () => NeedsAttentionItemDto,
    isArray: true,
  })
  items!: NeedsAttentionItemDto[];
}

export class TrendItemDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  current!: number;

  @ApiProperty()
  previous!: number;

  @ApiProperty()
  unit!: string;
}

export class TrendsResultDto {
  @ApiProperty({
    type: () => TrendItemDto,
    isArray: true,
  })
  trends!: TrendItemDto[];
}

export class DismissResultDto {
  @ApiProperty()
  dismissed!: boolean;
}
