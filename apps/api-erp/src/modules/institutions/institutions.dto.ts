import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS, STATUS } from "../../constants";
import { sortableInstitutionColumns } from "./institutions.schemas";

export class ListInstitutionsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableInstitutionColumns),
  })
  sort?: keyof typeof sortableInstitutionColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class InstitutionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty({
    enum: Object.values(STATUS.ORG),
    nullable: true,
  })
  status!: (typeof STATUS.ORG)[keyof typeof STATUS.ORG] | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class InstitutionCountsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  suspended!: number;
}

export class ListInstitutionsResultDto {
  @ApiProperty({
    type: () => InstitutionDto,
    isArray: true,
  })
  rows!: InstitutionDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
