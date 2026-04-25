import {
  ATTENDANCE_STATUSES,
  DISCIPLINARY_SEVERITY,
  FEE_PAYMENT_METHODS,
  GUARDIAN_RELATIONSHIPS,
  SIBLING_RELATIONSHIPS,
  TC_STATUS,
  type AttendanceStatus,
  type DisciplinarySeverity,
  type FeePaymentMethod,
  type GuardianRelationship,
  type SiblingRelationship,
  type TcStatus,
} from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS, STATUS, type MemberStatus } from "../../constants";
import { sortableStudentColumns } from "./students.schemas";

export class ListStudentsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableStudentColumns),
  })
  sort?: keyof typeof sortableStudentColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateGuardianLinkBodyDto {
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class CurrentStudentEnrollmentBodyDto {
  academicYearId!: string;
  classId!: string;
  sectionId!: string;
}

export class CreateStudentBodyDto {
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;
  classId!: string;
  sectionId!: string;

  @ApiProperty({
    type: () => CreateGuardianLinkBodyDto,
    isArray: true,
  })
  guardians!: CreateGuardianLinkBodyDto[];

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  customFieldValues?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentBodyDto,
    nullable: true,
  })
  currentEnrollment?: CurrentStudentEnrollmentBodyDto | null;

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolBoard?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolClass?: string | null;
}

export class UpdateStudentBodyDto {
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;
  classId!: string;
  sectionId!: string;

  @ApiProperty({
    type: () => CreateGuardianLinkBodyDto,
    isArray: true,
  })
  guardians!: CreateGuardianLinkBodyDto[];

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  customFieldValues?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentBodyDto,
    nullable: true,
  })
  currentEnrollment?: CurrentStudentEnrollmentBodyDto | null;

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolBoard?: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolClass?: string | null;
}

export class StudentGuardianDto {
  membershipId!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class CurrentStudentEnrollmentDto {
  academicYearId!: string;
  academicYearName!: string;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
}

export class StudentDto {
  id!: string;
  membershipId!: string;
  institutionId!: string;
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  fullName!: string;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;

  @ApiProperty({
    type: () => StudentGuardianDto,
    isArray: true,
  })
  guardians!: StudentGuardianDto[];

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentDto,
    nullable: true,
  })
  currentEnrollment!: CurrentStudentEnrollmentDto | null;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  customFieldValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  photoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolBoard!: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousSchoolClass!: string | null;
}

export class StudentOptionDto {
  id!: string;
  admissionNumber!: string;
  fullName!: string;
  campusName!: string;
}

export class ListStudentsResultDto {
  @ApiProperty({
    type: () => StudentDto,
    isArray: true,
  })
  rows!: StudentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class StudentAttendanceRecordDto {
  date!: string;

  @ApiProperty({
    enum: Object.values(ATTENDANCE_STATUSES),
  })
  status!: AttendanceStatus;
}

export class StudentAttendanceSummaryDto {
  startDate!: string;
  endDate!: string;
  totalMarkedDays!: number;
  present!: number;
  absent!: number;
  late!: number;
  excused!: number;
  attendancePercent!: number;
  absentStreak!: number;

  @ApiProperty({
    type: () => StudentAttendanceRecordDto,
    isArray: true,
  })
  recentRecords!: StudentAttendanceRecordDto[];
}

export class StudentFeeAssignmentSummaryDto {
  id!: string;
  feeStructureId!: string;
  feeStructureName!: string;

  @ApiPropertyOptional({ nullable: true })
  installmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  installmentLabel!: string | null;
  dueDate!: string;
  assignedAmountInPaise!: number;
  paidAmountInPaise!: number;
  adjustedAmountInPaise!: number;
  outstandingAmountInPaise!: number;
  status!: string;
}

export class StudentFeePaymentSummaryDto {
  id!: string;
  feeAssignmentId!: string;
  amountInPaise!: number;
  paymentDate!: string;

  @ApiProperty({
    enum: Object.values(FEE_PAYMENT_METHODS),
  })
  paymentMethod!: FeePaymentMethod;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class StudentFeesSummaryDto {
  assignmentCount!: number;
  paymentCount!: number;
  overdueCount!: number;
  totalAssignedInPaise!: number;
  totalPaidInPaise!: number;
  totalAdjustedInPaise!: number;
  totalOutstandingInPaise!: number;

  @ApiPropertyOptional({ nullable: true })
  nextDueDate!: string | null;

  @ApiProperty({
    type: () => StudentFeeAssignmentSummaryDto,
    isArray: true,
  })
  recentAssignments!: StudentFeeAssignmentSummaryDto[];

  @ApiProperty({
    type: () => StudentFeePaymentSummaryDto,
    isArray: true,
  })
  recentPayments!: StudentFeePaymentSummaryDto[];
}

export class StudentExamTermSummaryDto {
  examTermId!: string;
  examTermName!: string;
  academicYearId!: string;
  academicYearName!: string;
  subjectCount!: number;
  totalMaxMarks!: number;
  totalObtainedMarks!: number;
  overallPercent!: number;
  overallGrade!: string;
  endDate!: string;
}

export class StudentExamsSummaryDto {
  @ApiPropertyOptional({
    type: () => StudentExamTermSummaryDto,
    nullable: true,
  })
  latestTerm!: StudentExamTermSummaryDto | null;

  @ApiProperty({
    type: () => StudentExamTermSummaryDto,
    isArray: true,
  })
  recentTerms!: StudentExamTermSummaryDto[];
}

export class StudentTimelineEventDto {
  type!: string;
  title!: string;
  description!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  occurredAt!: string;
}

export class StudentSummaryDto {
  @ApiProperty({
    type: () => StudentDto,
  })
  student!: StudentDto;

  @ApiProperty({
    type: () => StudentAttendanceSummaryDto,
  })
  attendance!: StudentAttendanceSummaryDto;

  @ApiProperty({
    type: () => StudentFeesSummaryDto,
  })
  fees!: StudentFeesSummaryDto;

  @ApiProperty({
    type: () => StudentExamsSummaryDto,
  })
  exams!: StudentExamsSummaryDto;

  @ApiProperty({
    type: () => StudentTimelineEventDto,
    isArray: true,
  })
  timeline!: StudentTimelineEventDto[];
}

// ── Sibling links ────────────────────────────────────────────────────────

export class CreateSiblingLinkBodyDto {
  siblingStudentId!: string;

  @ApiProperty({
    enum: Object.values(SIBLING_RELATIONSHIPS),
  })
  relationship!: SiblingRelationship;
}

export class SiblingLinkDto {
  id!: string;
  studentId!: string;
  siblingStudentId!: string;
  siblingFullName!: string;
  siblingAdmissionNumber!: string;
  siblingClassName!: string;
  siblingSectionName!: string;

  @ApiProperty({
    enum: Object.values(SIBLING_RELATIONSHIPS),
  })
  relationship!: SiblingRelationship;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

// ── Medical records ──────────────────────────────────────────────────────

export class UpsertMedicalRecordBodyDto {
  @ApiPropertyOptional({ nullable: true })
  allergies?: string | null;

  @ApiPropertyOptional({ nullable: true })
  conditions?: string | null;

  @ApiPropertyOptional({ nullable: true })
  medications?: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyMedicalInfo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  doctorName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  doctorPhone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  insuranceInfo?: string | null;
}

export class StudentMedicalRecordDto {
  id!: string;
  studentId!: string;

  @ApiPropertyOptional({ nullable: true })
  allergies!: string | null;

  @ApiPropertyOptional({ nullable: true })
  conditions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  medications!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyMedicalInfo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  doctorName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  doctorPhone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  insuranceInfo!: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  updatedAt!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

// ── Disciplinary records ─────────────────────────────────────────────────

export class CreateDisciplinaryRecordBodyDto {
  incidentDate!: string;

  @ApiProperty({
    enum: Object.values(DISCIPLINARY_SEVERITY),
  })
  severity!: DisciplinarySeverity;
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  actionTaken?: string | null;
  parentNotified!: boolean;
}

export class DisciplinaryRecordDto {
  id!: string;
  studentId!: string;
  incidentDate!: string;

  @ApiProperty({
    enum: Object.values(DISCIPLINARY_SEVERITY),
  })
  severity!: DisciplinarySeverity;
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  actionTaken!: string | null;
  reportedByMemberId!: string;
  reportedByName!: string;
  parentNotified!: boolean;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

// ── Transfer certificates ────────────────────────────────────────────────

export class IssueTransferCertificateBodyDto {
  tcNumber!: string;
  issueDate!: string;

  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  conductRemarks?: string | null;
}

export class TransferCertificateDto {
  id!: string;
  studentId!: string;
  tcNumber!: string;
  issueDate!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  conductRemarks!: string | null;

  @ApiProperty({
    enum: Object.values(TC_STATUS),
  })
  status!: TcStatus;
  issuedByMemberId!: string;
  issuedByName!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
