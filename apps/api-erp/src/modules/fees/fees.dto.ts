import {
  FEE_ADJUSTMENT_TYPES,
  FEE_ASSIGNMENT_STATUSES,
  FEE_PAYMENT_METHODS,
  FEE_STRUCTURE_SCOPES,
  FEE_STRUCTURE_STATUSES,
  type FeeAdjustmentType,
  type FeeAssignmentStatus,
  type FeePaymentMethod,
  type FeeStructureScope,
  type FeeStructureStatus,
} from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS } from "../../constants";
import {
  sortableFeeAssignmentColumns,
  sortableFeeStructureColumns,
} from "./fees.schemas";

export class ListFeeStructuresQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableFeeStructureColumns),
  })
  sort?: keyof typeof sortableFeeStructureColumns;

  @ApiPropertyOptional({ enum: Object.values(SORT_ORDERS) })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({ nullable: true })
  academicYearId?: string;

  @ApiPropertyOptional({
    enum: [
      FEE_STRUCTURE_STATUSES.ACTIVE,
      FEE_STRUCTURE_STATUSES.ARCHIVED,
    ],
    nullable: true,
  })
  status?: FeeStructureStatus;
}

export class ListFeeAssignmentsQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableFeeAssignmentColumns),
  })
  sort?: keyof typeof sortableFeeAssignmentColumns;

  @ApiPropertyOptional({ enum: Object.values(SORT_ORDERS) })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({ nullable: true })
  feeStructureId?: string;

  @ApiPropertyOptional({
    enum: Object.values(FEE_ASSIGNMENT_STATUSES),
    nullable: true,
  })
  status?: FeeAssignmentStatus;
}

export class ListFeeDuesQueryDto {
  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional({
    enum: Object.values(sortableFeeAssignmentColumns),
  })
  sort?: keyof typeof sortableFeeAssignmentColumns;

  @ApiPropertyOptional({ enum: Object.values(SORT_ORDERS) })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  overdue?: boolean;
}

export class CollectionSummaryQueryDto {
  @ApiPropertyOptional({ nullable: true })
  academicYearId?: string;
}

export class FeeStructureInstallmentBodyDto {
  label!: string;
  amount!: number;
  dueDate!: string;
}

export class CreateFeeStructureBodyDto {
  academicYearId!: string;
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_SCOPES),
  })
  scope!: FeeStructureScope;

  @ApiProperty({ type: FeeStructureInstallmentBodyDto, isArray: true })
  installments!: FeeStructureInstallmentBodyDto[];
}

export class UpdateFeeStructureBodyDto {
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: FeeStructureInstallmentBodyDto, isArray: true })
  installments?: FeeStructureInstallmentBodyDto[];
}

export class SetFeeStructureStatusBodyDto {
  @ApiProperty({
    enum: [
      FEE_STRUCTURE_STATUSES.ACTIVE,
      FEE_STRUCTURE_STATUSES.ARCHIVED,
    ],
  })
  status!: Exclude<FeeStructureStatus, "deleted">;
}

export class CreateFeeAssignmentBodyDto {
  feeStructureId!: string;
  studentId!: string;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class UpdateFeeAssignmentBodyDto {
  amount?: number;
  dueDate?: string;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class CreateFeePaymentBodyDto {
  feeAssignmentId!: string;
  amount!: number;
  paymentDate!: string;

  @ApiProperty({
    enum: Object.values(FEE_PAYMENT_METHODS),
  })
  paymentMethod!: FeePaymentMethod;

  @ApiPropertyOptional({ nullable: true })
  referenceNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class CreateFeeAdjustmentBodyDto {
  feeAssignmentId!: string;

  @ApiProperty({
    enum: Object.values(FEE_ADJUSTMENT_TYPES),
  })
  adjustmentType!: FeeAdjustmentType;

  amount!: number;

  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;
}

export class ReverseFeePaymentBodyDto {
  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;
}

export class BulkFeeAssignmentBodyDto {
  feeStructureId!: string;
  classId!: string;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class FeeStructureInstallmentDto {
  id!: string;
  sortOrder!: number;
  label!: string;
  amountInPaise!: number;
  dueDate!: string;
}

export class FeeStructureDto {
  id!: string;
  institutionId!: string;
  academicYearId!: string;
  academicYearName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_SCOPES),
  })
  scope!: FeeStructureScope;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_STATUSES),
  })
  status!: FeeStructureStatus;
  amountInPaise!: number;
  dueDate!: string;
  installmentCount!: number;

  @ApiProperty({ type: FeeStructureInstallmentDto, isArray: true })
  installments!: FeeStructureInstallmentDto[];

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeeStructureDetailDto extends FeeStructureDto {
  assignmentCount!: number;
  totalAssignedInPaise!: number;
  totalPaidInPaise!: number;
  totalOutstandingInPaise!: number;
  isInstallmentLocked!: boolean;

  @ApiPropertyOptional({ nullable: true })
  lockReason!: string | null;
}

export class FeeAssignmentDto {
  id!: string;
  institutionId!: string;
  feeStructureId!: string;
  feeStructureName!: string;

  @ApiPropertyOptional({ nullable: true })
  installmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  installmentLabel!: string | null;
  installmentSortOrder!: number;
  studentId!: string;
  studentAdmissionNumber!: string;
  studentFullName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;
  assignedAmountInPaise!: number;
  adjustedAmountInPaise!: number;
  paidAmountInPaise!: number;
  outstandingAmountInPaise!: number;
  paymentCount!: number;
  dueDate!: string;

  @ApiProperty({
    enum: Object.values(FEE_ASSIGNMENT_STATUSES),
  })
  status!: FeeAssignmentStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeePaymentDto {
  id!: string;
  institutionId!: string;
  feeAssignmentId!: string;
  amountInPaise!: number;
  paymentDate!: string;

  @ApiProperty({
    enum: Object.values(FEE_PAYMENT_METHODS),
  })
  paymentMethod!: FeePaymentMethod;

  @ApiPropertyOptional({ nullable: true })
  referenceNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  reversedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reversalReason!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeeAdjustmentDto {
  id!: string;
  feeAssignmentId!: string;

  @ApiProperty({
    enum: Object.values(FEE_ADJUSTMENT_TYPES),
  })
  adjustmentType!: FeeAdjustmentType;

  amountInPaise!: number;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeeAssignmentDetailDto extends FeeAssignmentDto {
  @ApiProperty({ type: FeePaymentDto, isArray: true })
  payments!: FeePaymentDto[];

  @ApiProperty({ type: FeeAdjustmentDto, isArray: true })
  adjustments!: FeeAdjustmentDto[];
}

export class PaginatedFeeStructureDto {
  @ApiProperty({ type: FeeStructureDto, isArray: true })
  rows!: FeeStructureDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class PaginatedFeeAssignmentDto {
  @ApiProperty({ type: FeeAssignmentDto, isArray: true })
  rows!: FeeAssignmentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class CollectionSummaryItemDto {
  feeStructureId!: string;
  feeStructureName!: string;
  academicYearName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;
  assignmentCount!: number;
  totalAssignedInPaise!: number;
  totalPaidInPaise!: number;
  totalOutstandingInPaise!: number;
}

export class CollectionSummaryDto {
  totalAssignedInPaise!: number;
  totalPaidInPaise!: number;
  totalOutstandingInPaise!: number;
  overdueCount!: number;

  @ApiProperty({ type: CollectionSummaryItemDto, isArray: true })
  byStructure!: CollectionSummaryItemDto[];
}

export class BulkFeeAssignmentResultDto {
  created!: number;
  skipped!: number;
}

export class CreateFeeAssignmentResultDto {
  @ApiProperty({ type: FeeAssignmentDto, isArray: true })
  assignments!: FeeAssignmentDto[];
}
