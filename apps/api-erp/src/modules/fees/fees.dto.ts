import {
  FEE_ASSIGNMENT_STATUSES,
  FEE_PAYMENT_METHODS,
  FEE_STRUCTURE_SCOPES,
  type FeeAssignmentStatus,
  type FeePaymentMethod,
  type FeeStructureScope,
} from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFeeStructureBodyDto {
  academicYearId!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_SCOPES),
  })
  scope!: FeeStructureScope;
  amount!: number;
  dueDate!: string;
}

export class CreateFeeAssignmentBodyDto {
  feeStructureId!: string;
  studentId!: string;
  amount!: number;
  dueDate!: string;

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
  amountInPaise!: number;
  dueDate!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeeAssignmentDto {
  id!: string;
  institutionId!: string;
  feeStructureId!: string;
  feeStructureName!: string;
  studentId!: string;
  studentAdmissionNumber!: string;
  studentFullName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;
  assignedAmountInPaise!: number;
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

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
