import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ── Grading scale DTOs ──────────────────────────────────────────────────────

export class GradingScaleBandInputDto {
  grade!: string;
  label!: string;
  minPercent!: number;
  sortOrder!: number;
}

export class CreateGradingScaleBodyDto {
  name!: string;

  @ApiProperty({ type: () => GradingScaleBandInputDto, isArray: true })
  bands!: GradingScaleBandInputDto[];
}

export class UpdateGradingScaleBodyDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: () => GradingScaleBandInputDto, isArray: true })
  bands?: GradingScaleBandInputDto[];
}

export class GradingScaleBandDto {
  id!: string;
  grade!: string;
  label!: string;
  minPercent!: number;
  sortOrder!: number;
}

export class GradingScaleDto {
  id!: string;
  institutionId!: string;
  name!: string;
  isDefault!: boolean;
  status!: string;

  @ApiProperty({ type: () => GradingScaleBandDto, isArray: true })
  bands!: GradingScaleBandDto[];

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

// ── Exam term DTOs ──────────────────────────────────────────────────────────

export class CreateExamTermBodyDto {
  academicYearId!: string;
  name!: string;

  @ApiPropertyOptional()
  examType?: string;

  @ApiPropertyOptional()
  weightageInBp?: number;

  @ApiPropertyOptional({ nullable: true })
  gradingScaleId?: string | null;

  @ApiPropertyOptional()
  defaultPassingPercent?: number;

  startDate!: string;
  endDate!: string;
}

export class ExamTermDto {
  id!: string;
  institutionId!: string;
  academicYearId!: string;
  academicYearName!: string;
  name!: string;
  examType!: string;
  weightageInBp!: number;

  @ApiPropertyOptional({ nullable: true })
  gradingScaleId!: string | null;

  defaultPassingPercent!: number;
  startDate!: string;
  endDate!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

// ── Marks DTOs ──────────────────────────────────────────────────────────────

export class UpsertExamMarkEntryBodyDto {
  studentId!: string;
  subjectName!: string;
  maxMarks!: number;
  obtainedMarks!: number;

  @ApiPropertyOptional()
  graceMarks?: number;

  @ApiPropertyOptional({ nullable: true })
  remarks?: string | null;
}

export class UpsertExamMarksBodyDto {
  @ApiProperty({ type: () => UpsertExamMarkEntryBodyDto, isArray: true })
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
  graceMarks!: number;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: string;
}

// ── Report card DTOs ────────────────────────────────────────────────────────

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
  graceMarks!: number;
  effectiveMarks!: number;
  percent!: number;
  grade!: string;
  result!: string;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;
}

export class ExamReportCardSummaryDto {
  totalMaxMarks!: number;
  totalObtainedMarks!: number;
  totalEffectiveMarks!: number;
  overallPercent!: number;
  overallGrade!: string;
  result!: string;
}

export class ExamReportCardDto {
  examTermId!: string;
  examTermName!: string;
  examType!: string;
  academicYearId!: string;
  academicYearName!: string;
  studentId!: string;
  studentFullName!: string;
  admissionNumber!: string;
  defaultPassingPercent!: number;

  @ApiPropertyOptional({ nullable: true })
  classRank!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sectionRank!: number | null;

  @ApiProperty({ type: () => ExamReportCardSummaryDto })
  summary!: ExamReportCardSummaryDto;

  @ApiProperty({ type: () => ExamReportCardSubjectDto, isArray: true })
  subjects!: ExamReportCardSubjectDto[];

  @ApiProperty({ type: () => ExamGradeBandDto, isArray: true })
  gradingScheme!: ExamGradeBandDto[];
}

// ── Class analysis DTOs ─────────────────────────────────────────────────────

export class ClassAnalysisQueryParamsDto {
  classId!: string;

  @ApiPropertyOptional()
  sectionId?: string;
}

export class ClassAnalysisSubjectDto {
  subjectName!: string;
  average!: number;
  highest!: number;
  lowest!: number;
  passCount!: number;
  failCount!: number;
  topperName!: string;
}

export class ClassAnalysisDto {
  examTermId!: string;
  examTermName!: string;
  classAverage!: number;
  classTopperName!: string;
  classTopperPercent!: number;
  studentCount!: number;
  passCount!: number;
  failCount!: number;

  @ApiProperty({ type: () => ClassAnalysisSubjectDto, isArray: true })
  subjects!: ClassAnalysisSubjectDto[];
}

// ── Rank DTOs ───────────────────────────────────────────────────────────────

export class RanksQueryParamsDto {
  classId!: string;

  @ApiPropertyOptional()
  sectionId?: string;
}

export class RankedStudentDto {
  studentId!: string;
  studentFullName!: string;
  admissionNumber!: string;
  totalEffectiveMarks!: number;
  totalMaxMarks!: number;
  percentage!: number;
  grade!: string;
  rank!: number;
}

export class RanksDto {
  examTermId!: string;
  examTermName!: string;

  @ApiProperty({ type: () => RankedStudentDto, isArray: true })
  students!: RankedStudentDto[];
}

// ── Batch report cards ──────────────────────────────────────────────────────

export class BatchReportCardsQueryParamsDto {
  classId!: string;

  @ApiPropertyOptional()
  sectionId?: string;
}
