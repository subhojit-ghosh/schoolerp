import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS, STATUS, type CampusStatus } from "../../constants";
import { sortableCampusColumns } from "./campuses.schemas";

export class ListCampusesQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableCampusColumns),
  })
  sort?: keyof typeof sortableCampusColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateCampusBodyDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional({ nullable: true })
  code?: string | null;

  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class CampusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.CAMPUS),
  })
  status!: CampusStatus;
}

export class ListCampusesResultDto {
  @ApiProperty({
    type: () => CampusDto,
    isArray: true,
  })
  rows!: CampusDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
