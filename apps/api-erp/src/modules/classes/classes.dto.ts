import { SORT_ORDERS } from "../../constants";
import { sortableClassColumns } from "./classes.schemas";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ClassSectionBodyDto {
  @ApiPropertyOptional({ nullable: true })
  id?: string;

  @ApiProperty()
  name!: string;
}

export class ListClassesQueryDto {
  @ApiPropertyOptional({ nullable: true })
  campusId?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableClassColumns),
  })
  sort?: keyof typeof sortableClassColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateClassBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty({
    type: () => ClassSectionBodyDto,
    isArray: true,
  })
  sections!: ClassSectionBodyDto[];
}

export class UpdateClassBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty({
    type: () => ClassSectionBodyDto,
    isArray: true,
  })
  sections!: ClassSectionBodyDto[];
}

export class ClassSectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  displayOrder!: number;
}

export class ArchivedClassSectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class SetClassStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class ClassDto {
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

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({
    type: () => ClassSectionDto,
    isArray: true,
  })
  sections!: ClassSectionDto[];

  @ApiProperty({
    type: () => ArchivedClassSectionDto,
    isArray: true,
  })
  archivedSections!: ArchivedClassSectionDto[];
}

export class ListClassesResultDto {
  @ApiProperty({
    type: () => ClassDto,
    isArray: true,
  })
  rows!: ClassDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
