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

export class ExamReportCardQueryParamsDto {
  studentId!: string;
}

export class ExamGradeBandDto {
  grade!: string;
  minPercent!: number;
  label!: string;
}

export class ExamReportCardSubjectDto {
  subjectName!: string;
  maxMarks!: number;
  obtainedMarks!: number;
  percent!: number;
  grade!: string;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;
}

export class ExamReportCardSummaryDto {
  totalMaxMarks!: number;
  totalObtainedMarks!: number;
  overallPercent!: number;
  overallGrade!: string;
}

export class ExamReportCardDto {
  examTermId!: string;
  examTermName!: string;
  academicYearId!: string;
  academicYearName!: string;
  studentId!: string;
  studentFullName!: string;
  admissionNumber!: string;

  @ApiProperty({ type: () => ExamReportCardSummaryDto })
  summary!: ExamReportCardSummaryDto;

  @ApiProperty({
    type: () => ExamReportCardSubjectDto,
    isArray: true,
  })
  subjects!: ExamReportCardSubjectDto[];

  @ApiProperty({
    type: () => ExamGradeBandDto,
    isArray: true,
  })
  gradingScheme!: ExamGradeBandDto[];
}
