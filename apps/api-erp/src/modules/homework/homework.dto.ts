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
