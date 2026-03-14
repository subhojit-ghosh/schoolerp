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

export class SetClassStatusBodyDto {
  @ApiProperty()
  isActive!: boolean;
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

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({
    type: () => ClassSectionDto,
    isArray: true,
  })
  sections!: ClassSectionDto[];
}
