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
  @ApiProperty()
  academicYearId!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_SCOPES),
  })
  scope!: FeeStructureScope;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  dueDate!: string;
}

export class CreateFeeAssignmentBodyDto {
  @ApiProperty()
  feeStructureId!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  dueDate!: string;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class CreateFeePaymentBodyDto {
  @ApiProperty()
  feeAssignmentId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  academicYearId!: string;

  @ApiProperty()
  academicYearName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({
    enum: Object.values(FEE_STRUCTURE_SCOPES),
  })
  scope!: FeeStructureScope;

  @ApiProperty()
  amountInPaise!: number;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class FeeAssignmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  feeStructureId!: string;

  @ApiProperty()
  feeStructureName!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  studentAdmissionNumber!: string;

  @ApiProperty()
  studentFullName!: string;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;

  @ApiProperty()
  assignedAmountInPaise!: number;

  @ApiProperty()
  paidAmountInPaise!: number;

  @ApiProperty()
  outstandingAmountInPaise!: number;

  @ApiProperty()
  paymentCount!: number;

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  feeAssignmentId!: string;

  @ApiProperty()
  amountInPaise!: number;

  @ApiProperty()
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
