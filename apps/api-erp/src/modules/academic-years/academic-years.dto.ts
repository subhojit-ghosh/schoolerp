import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS, STATUS } from "../../constants";
import { sortableAcademicYearColumns } from "./academic-years.schemas";

export class ListAcademicYearsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableAcademicYearColumns),
  })
  sort?: keyof typeof sortableAcademicYearColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class AcademicYearWriteBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  isCurrent!: boolean;
}

export class CreateAcademicYearBodyDto extends AcademicYearWriteBodyDto {}

export class UpdateAcademicYearBodyDto extends AcademicYearWriteBodyDto {}

export class AcademicYearDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  isCurrent!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.ACADEMIC_YEAR),
  })
  status!: (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class ListAcademicYearsResultDto {
  @ApiProperty({
    type: () => AcademicYearDto,
    isArray: true,
  })
  rows!: AcademicYearDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
