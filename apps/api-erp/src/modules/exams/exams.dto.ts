import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateExamTermBodyDto {
  academicYearId!: string;
  name!: string;
  startDate!: string;
  endDate!: string;
}

export class ExamTermDto {
  id!: string;
  institutionId!: string;
  academicYearId!: string;
  academicYearName!: string;
  name!: string;
  startDate!: string;
  endDate!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class UpsertExamMarkEntryBodyDto {
  studentId!: string;
  subjectName!: string;
  maxMarks!: number;
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
  id!: string;
  examTermId!: string;
  studentId!: string;
  studentFullName!: string;
  admissionNumber!: string;
  subjectName!: string;
  maxMarks!: number;
  obtainedMarks!: number;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
