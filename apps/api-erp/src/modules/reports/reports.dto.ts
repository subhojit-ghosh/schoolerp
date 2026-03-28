import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StudentStrengthQueryDto {
  @ApiPropertyOptional()
  academicYearId?: string;

  @ApiPropertyOptional()
  campusId?: string;
}

export class StudentStrengthRowDto {
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;
  totalCount!: number;
}

export class StudentStrengthResultDto {
  @ApiProperty({ type: StudentStrengthRowDto, isArray: true })
  rows!: StudentStrengthRowDto[];
  grandTotal!: number;
}
