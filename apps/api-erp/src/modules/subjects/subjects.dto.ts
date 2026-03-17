import { SORT_ORDERS } from "../../constants";
import { sortableSubjectColumns } from "./subjects.schemas";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListSubjectsQueryDto {
  @ApiPropertyOptional({ nullable: true })
  campusId?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableSubjectColumns),
  })
  sort?: keyof typeof sortableSubjectColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateSubjectBodyDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  code?: string;
}

export class UpdateSubjectBodyDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  code?: string;
}

export class SetSubjectStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class SubjectDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  code?: string | null;

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  @ApiProperty()
  createdAt!: string;
}

export class ListSubjectsResultDto {
  @ApiProperty({
    type: () => SubjectDto,
    isArray: true,
  })
  rows!: SubjectDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
