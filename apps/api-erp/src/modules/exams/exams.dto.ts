import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateExamTermBodyDto {
  @ApiProperty()
  academicYearId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

export class ExamTermDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  academicYearId!: string;

  @ApiProperty()
  academicYearName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class UpsertExamMarkEntryBodyDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiProperty()
  maxMarks!: number;

  @ApiProperty()
  obtainedMarks!: number;

  @ApiPropertyOptional({ nullable: true })
  remarks?: string | null;
}

export class UpsertExamMarksBodyDto {
  @ApiProperty({
    type: () => UpsertExamMarkEntryBodyDto,
    isArray: true,
  })
  entries!: UpsertExamMarkEntryBodyDto[];
}

export class ExamMarkDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  examTermId!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  studentFullName!: string;

  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiProperty()
  maxMarks!: number;

  @ApiProperty()
  obtainedMarks!: number;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
