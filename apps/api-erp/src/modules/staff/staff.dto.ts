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
