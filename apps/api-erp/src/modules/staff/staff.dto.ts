import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AUTH_RECOVERY_CHANNELS,
  HONORIFICS,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
  type AuthRecoveryChannel,
  type MemberStatus,
  type MemberType,
} from "../../constants";
import {
  BLOOD_GROUPS,
  EMPLOYMENT_TYPES,
  STAFF_DOCUMENT_TYPES,
  STAFF_GENDER,
  sortableStaffColumns,
} from "./staff.schemas";

export class ListStaffQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableStaffColumns),
  })
  sort?: keyof typeof sortableStaffColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({
    enum: [
      STATUS.MEMBER.ACTIVE,
      STATUS.MEMBER.INACTIVE,
      STATUS.MEMBER.SUSPENDED,
    ],
    isArray: true,
  })
  status?: string[];
}

export class StaffRoleDto {
  id!: string;
  name!: string;
  slug!: string;
}

export class StaffProfileDto {
  @ApiPropertyOptional({ nullable: true })
  employeeId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  designation!: string | null;

  @ApiPropertyOptional({ nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateOfJoining!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth!: string | null;

  @ApiPropertyOptional({ nullable: true, enum: [...STAFF_GENDER] })
  gender!: string | null;

  @ApiPropertyOptional({ nullable: true, enum: [...BLOOD_GROUPS] })
  bloodGroup!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyContactName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyContactMobile!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyContactRelation!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reportingToMemberId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reportingToMemberName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qualification!: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  experienceYears!: number | null;

  @ApiPropertyOptional({ nullable: true, enum: [...EMPLOYMENT_TYPES] })
  employmentType!: string | null;
}

export class CreateStaffProfileBodyDto {
  @ApiPropertyOptional() employeeId?: string;
  @ApiPropertyOptional() designation?: string;
  @ApiPropertyOptional() department?: string;
  @ApiPropertyOptional() dateOfJoining?: string;
  @ApiPropertyOptional() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: [...STAFF_GENDER] }) gender?: string;
  @ApiPropertyOptional({ enum: [...BLOOD_GROUPS] }) bloodGroup?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() emergencyContactName?: string;
  @ApiPropertyOptional() emergencyContactMobile?: string;
  @ApiPropertyOptional() emergencyContactRelation?: string;
  @ApiPropertyOptional() reportingToMemberId?: string;
  @ApiPropertyOptional() qualification?: string;
  @ApiPropertyOptional({ type: Number }) experienceYears?: number;
  @ApiPropertyOptional({ enum: [...EMPLOYMENT_TYPES] }) employmentType?: string;
}

export class CreateStaffBodyDto {
  @ApiPropertyOptional({ enum: [...HONORIFICS] })
  honorific?: string;

  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;

  @ApiPropertyOptional({ type: () => CreateStaffProfileBodyDto })
  profile?: CreateStaffProfileBodyDto;
}

export class UpdateStaffBodyDto extends CreateStaffBodyDto {}

export class SetStaffStatusBodyDto {
  @ApiProperty({
    enum: [
      STATUS.MEMBER.ACTIVE,
      STATUS.MEMBER.INACTIVE,
      STATUS.MEMBER.SUSPENDED,
    ],
  })
  status!: "active" | "inactive" | "suspended";
}

export class StaffDto {
  id!: string;
  userId!: string;
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true, enum: [...HONORIFICS] })
  honorific!: string | null;

  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({
    enum: Object.values(MEMBER_TYPES),
  })
  memberType!: MemberType;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;

  @ApiPropertyOptional({ type: () => StaffRoleDto, nullable: true })
  role!: StaffRoleDto | null;

  @ApiPropertyOptional({ type: () => StaffProfileDto, nullable: true })
  profile!: StaffProfileDto | null;
}

export class SubjectTeacherAssignmentDto {
  id!: string;
  subjectId!: string;
  subjectName!: string;

  @ApiPropertyOptional({ nullable: true })
  classId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  className!: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearName!: string | null;

  createdAt!: string;
}

export class CreateSubjectTeacherAssignmentBodyDto {
  subjectId!: string;

  @ApiPropertyOptional({ nullable: true })
  classId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearId?: string | null;
}

export class StaffPasswordSetupDto {
  success!: boolean;

  @ApiProperty({
    enum: Object.values(AUTH_RECOVERY_CHANNELS),
  })
  channel!: AuthRecoveryChannel;
  recipient!: string;

  @ApiPropertyOptional({ nullable: true })
  resetTokenPreview!: string | null;
}

export class CreateStaffResultDto {
  @ApiProperty({ type: () => StaffDto })
  staff!: StaffDto;

  @ApiPropertyOptional({ type: () => StaffPasswordSetupDto, nullable: true })
  passwordSetup!: StaffPasswordSetupDto | null;
}

export class StaffRoleAssignmentScopeDto {
  @ApiPropertyOptional({ nullable: true })
  campusId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  classId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  className!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sectionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sectionName!: string | null;
}

export class StaffRoleAssignmentDto {
  id!: string;

  @ApiProperty({ type: () => StaffRoleDto })
  role!: StaffRoleDto;

  @ApiProperty({ type: () => StaffRoleAssignmentScopeDto })
  scope!: StaffRoleAssignmentScopeDto;

  validFrom!: string;

  @ApiPropertyOptional({ nullable: true })
  validTo!: string | null;
}

export class CreateStaffRoleAssignmentBodyDto {
  roleId!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  classId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  sectionId?: string | null;
}

export class ListStaffResultDto {
  @ApiProperty({
    type: () => StaffDto,
    isArray: true,
  })
  rows!: StaffDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

// ── Staff document DTOs ──────────────────────────────────────────────────────

export class StaffDocumentDto {
  id!: string;
  staffMemberId!: string;

  @ApiProperty({ enum: [...STAFF_DOCUMENT_TYPES] })
  documentType!: string;

  documentName!: string;

  @ApiPropertyOptional({ nullable: true })
  uploadUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  createdAt!: string;
  updatedAt!: string;
}

export class CreateStaffDocumentBodyDto {
  @ApiProperty({ enum: [...STAFF_DOCUMENT_TYPES] })
  documentType!: string;

  documentName!: string;

  @ApiPropertyOptional() uploadUrl?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateStaffDocumentBodyDto extends CreateStaffDocumentBodyDto {}

// ── Teaching load DTOs ───────────────────────────────────────────────────────

export class TeachingLoadEntryDto {
  dayOfWeek!: string;
  periodIndex!: number;
  startTime!: string;
  endTime!: string;
  subjectName!: string;
  className!: string;
  sectionName!: string;

  @ApiPropertyOptional({ nullable: true })
  room!: string | null;
}

export class TeachingLoadResultDto {
  staffMemberId!: string;
  totalPeriodsPerWeek!: number;

  @ApiProperty({ type: () => TeachingLoadEntryDto, isArray: true })
  entries!: TeachingLoadEntryDto[];
}

// ── Campus transfer DTOs ─────────────────────────────────────────────────────

export class StaffCampusTransferDto {
  id!: string;
  staffMemberId!: string;
  fromCampusId!: string;
  fromCampusName!: string;
  toCampusId!: string;
  toCampusName!: string;
  transferDate!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  transferredByMemberId!: string;
  transferredByName!: string;
  createdAt!: string;
}

export class CreateCampusTransferBodyDto {
  toCampusId!: string;
  transferDate!: string;

  @ApiPropertyOptional() reason?: string;
}
