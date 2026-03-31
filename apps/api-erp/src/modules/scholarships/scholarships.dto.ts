import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  SCHOLARSHIP_TYPES,
  SCHOLARSHIP_STATUS,
  SCHOLARSHIP_APPLICATION_STATUS,
  DBT_STATUS,
  type ScholarshipType,
  type ScholarshipStatus,
  type ScholarshipApplicationStatus,
  type DbtStatus,
} from "@repo/contracts";

// ── Scholarships ────────────────────────────────────────────────────────────

export class CreateScholarshipBodyDto {
  name!: string;
  description?: string;

  @ApiProperty({ enum: Object.values(SCHOLARSHIP_TYPES) })
  scholarshipType!: ScholarshipType;

  amountInPaise?: number;
  percentageDiscount?: number;
  eligibilityCriteria?: string;
  maxRecipients?: number;
  academicYearId?: string;
  renewalRequired?: boolean;
  renewalPeriodMonths?: number;
}

export class UpdateScholarshipBodyDto {
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ enum: Object.values(SCHOLARSHIP_TYPES) })
  scholarshipType?: ScholarshipType;

  @ApiPropertyOptional({ nullable: true })
  amountInPaise?: number | null;

  @ApiPropertyOptional({ nullable: true })
  percentageDiscount?: number | null;

  @ApiPropertyOptional({ nullable: true })
  eligibilityCriteria?: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxRecipients?: number | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearId?: string | null;

  renewalRequired?: boolean;

  @ApiPropertyOptional({ nullable: true })
  renewalPeriodMonths?: number | null;
}

export class UpdateScholarshipStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class ListScholarshipsQueryParamsDto {
  q?: string;

  @ApiPropertyOptional({ enum: Object.values(SCHOLARSHIP_TYPES) })
  scholarshipType?: ScholarshipType;

  @ApiPropertyOptional({ enum: ["active", "inactive"] })
  status?: "active" | "inactive";

  academicYearId?: string;
  page?: number;
  limit?: number;

  @ApiPropertyOptional({ enum: ["name", "createdAt"] })
  sort?: "name" | "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  order?: "asc" | "desc";
}

export class ScholarshipDto {
  id!: string;
  institutionId!: string;
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: Object.values(SCHOLARSHIP_TYPES) })
  scholarshipType!: ScholarshipType;

  @ApiPropertyOptional({ nullable: true })
  amountInPaise!: number | null;

  @ApiPropertyOptional({ nullable: true })
  percentageDiscount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  eligibilityCriteria!: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxRecipients!: number | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearName!: string | null;

  renewalRequired!: boolean;

  @ApiPropertyOptional({ nullable: true })
  renewalPeriodMonths!: number | null;

  @ApiProperty({ enum: Object.values(SCHOLARSHIP_STATUS) })
  status!: ScholarshipStatus;

  activeApplicationCount!: number;
  createdAt!: string;
}

export class ScholarshipListResultDto {
  @ApiProperty({ type: ScholarshipDto, isArray: true })
  rows!: ScholarshipDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

// ── Applications ────────────────────────────────────────────────────────────

export class CreateApplicationBodyDto {
  scholarshipId!: string;
  studentId!: string;
}

export class ListApplicationsQueryParamsDto {
  q?: string;
  scholarshipId?: string;

  @ApiPropertyOptional({
    enum: Object.values(SCHOLARSHIP_APPLICATION_STATUS),
  })
  status?: ScholarshipApplicationStatus;

  @ApiPropertyOptional({ enum: Object.values(DBT_STATUS) })
  dbtStatus?: DbtStatus;

  page?: number;
  limit?: number;

  @ApiPropertyOptional({ enum: ["createdAt"] })
  sort?: "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  order?: "asc" | "desc";
}

export class ReviewApplicationBodyDto {
  reviewNotes?: string;
}

export class UpdateDbtStatusBodyDto {
  @ApiProperty({ enum: Object.values(DBT_STATUS) })
  dbtStatus!: DbtStatus;

  dbtTransactionId?: string;
}

export class RenewApplicationBodyDto {
  applicationId!: string;
}

export class ListExpiringApplicationsQueryParamsDto {
  daysUntilExpiry?: number;
  page?: number;
  limit?: number;
}

export class ScholarshipApplicationDto {
  id!: string;
  institutionId!: string;
  scholarshipId!: string;
  scholarshipName!: string;
  studentId!: string;
  studentName!: string;
  studentAdmissionNumber!: string;
  appliedByMemberName!: string;

  @ApiProperty({
    enum: Object.values(SCHOLARSHIP_APPLICATION_STATUS),
  })
  status!: ScholarshipApplicationStatus;

  @ApiPropertyOptional({ nullable: true })
  reviewedByMemberName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewNotes!: string | null;

  @ApiProperty({ enum: Object.values(DBT_STATUS) })
  dbtStatus!: DbtStatus;

  @ApiPropertyOptional({ nullable: true })
  dbtTransactionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dbtDisbursedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  feeAdjustmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  concessionAmountInPaise!: number | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  renewedFromApplicationId!: string | null;

  createdAt!: string;
}

export class ScholarshipApplicationListResultDto {
  @ApiProperty({ type: ScholarshipApplicationDto, isArray: true })
  rows!: ScholarshipApplicationDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}
