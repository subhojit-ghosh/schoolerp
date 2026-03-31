import { ApiPropertyOptional } from "@nestjs/swagger";

export class CreateHomeworkBodyDto {
  classId!: string;
  sectionId!: string;
  subjectId!: string;
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentInstructions?: string | null;

  dueDate!: string;

  @ApiPropertyOptional()
  parentVisible?: boolean;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl?: string | null;
}

export class UpdateHomeworkBodyDto {
  @ApiPropertyOptional()
  classId?: string;

  @ApiPropertyOptional()
  sectionId?: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentInstructions?: string | null;

  @ApiPropertyOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  parentVisible?: boolean;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl?: string | null;
}

export class HomeworkDto {
  id!: string;
  institutionId!: string;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  subjectId!: string;
  subjectName!: string;
  createdByMemberId!: string;
  createdByName!: string;
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentInstructions!: string | null;

  dueDate!: string;
  status!: string;
  parentVisible!: boolean;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  publishedAt!: string | null;

  createdAt!: string;
  updatedAt!: string;
}

export class HomeworkListResultDto {
  rows!: HomeworkDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListHomeworkQueryParamsDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional()
  campusId?: string;

  @ApiPropertyOptional()
  classId?: string;

  @ApiPropertyOptional()
  sectionId?: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional({ enum: ["draft", "published"] })
  status?: "draft" | "published";

  @ApiPropertyOptional()
  from?: string;

  @ApiPropertyOptional()
  to?: string;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;

  @ApiPropertyOptional()
  sort?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  order?: "asc" | "desc";
}

// ── Submission DTOs ──────────────────────────────────────────────────────────

export class SubmissionEntryDto {
  studentId!: string;

  @ApiPropertyOptional({ enum: ["submitted", "not_submitted", "late"] })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  remarks?: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl?: string | null;
}

export class BulkUpsertSubmissionsBodyDto {
  submissions!: SubmissionEntryDto[];
}

export class HomeworkSubmissionDto {
  id!: string;
  homeworkId!: string;
  studentId!: string;
  studentName!: string;
  admissionNumber!: string;
  status!: string;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  submittedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  markedByMemberId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  markedByName!: string | null;

  createdAt!: string;
  updatedAt!: string;
}

export class SubmissionListResultDto {
  rows!: HomeworkSubmissionDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListSubmissionsQueryParamsDto {
  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  limit?: number;
}

// ── Analytics DTOs ───────────────────────────────────────────────────────────

export class HomeworkAnalyticsDto {
  homeworkId!: string;
  totalStudents!: number;
  submitted!: number;
  notSubmitted!: number;
  late!: number;
  submissionRate!: number;
}

export class ClassHomeworkAnalyticsDto {
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  totalHomework!: number;
  avgSubmissionRate!: number;
}
