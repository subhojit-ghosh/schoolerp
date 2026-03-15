import {
  AUTH_CONTEXT_KEYS,
  AUTH_CONTEXT_LABELS,
  type AuthContextKey,
} from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  GUARDIAN_RELATIONSHIPS,
  MEMBER_TYPES,
  STATUS,
  type CampusStatus,
  type GuardianRelationship,
  type MemberStatus,
  type MemberType,
  type OrgStatus,
} from "../../constants";

export class SignUpBodyDto {
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;
  password!: string;
  tenantSlug?: string;
}

export class SignInBodyDto {
  identifier!: string;
  password!: string;
  tenantSlug?: string;
}

export class ForgotPasswordBodyDto {
  identifier!: string;
}

export class ForgotPasswordResponseDto {
  success!: boolean;

  @ApiPropertyOptional({ nullable: true })
  resetTokenPreview?: string | null;
}

export class ResetPasswordBodyDto {
  token!: string;
  password!: string;
}

export class ResetPasswordResponseDto {
  success!: boolean;
}

export class SwitchCampusBodyDto {
  campusId!: string;
}

export class SwitchContextBodyDto {
  @ApiProperty({
    enum: Object.values(AUTH_CONTEXT_KEYS),
  })
  contextKey!: AuthContextKey;
}

export class AuthUserDto {
  id!: string;
  name!: string;
  mobile!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;
}

export class AuthOrganizationDto {
  id!: string;
  name!: string;
  shortName!: string;
  slug!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true })
  faviconUrl!: string | null;
  primaryColor!: string;
  accentColor!: string;
  sidebarColor!: string;

  @ApiProperty({
    enum: Object.values(STATUS.ORG),
  })
  status!: OrgStatus;
}

export class AuthCampusDto {
  id!: string;
  organizationId!: string;
  name!: string;
  slug!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;
  isDefault!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.CAMPUS),
  })
  status!: CampusStatus;
}

export class AuthMembershipDto {
  id!: string;
  organizationId!: string;
  organizationName!: string;
  organizationSlug!: string;

  @ApiProperty({
    enum: Object.values(MEMBER_TYPES),
  })
  memberType!: MemberType;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;

  @ApiProperty({ nullable: true })
  primaryCampusId!: string | null;
}

export class AuthAccessContextDto {
  @ApiProperty({
    enum: Object.values(AUTH_CONTEXT_KEYS),
  })
  key!: AuthContextKey;

  @ApiProperty({
    enum: Object.values(AUTH_CONTEXT_LABELS),
  })
  label!: (typeof AUTH_CONTEXT_LABELS)[AuthContextKey];

  @ApiProperty({
    type: () => String,
    isArray: true,
  })
  membershipIds!: string[];
}

export class AuthStaffRoleDto {
  id!: string;
  name!: string;
  slug!: string;
}

export class AuthLinkedStudentDto {
  studentId!: string;
  membershipId!: string;
  fullName!: string;
  admissionNumber!: string;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
    nullable: true,
  })
  relationship!: GuardianRelationship | null;
}

export class AuthContextDto {
  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  expiresAt!: string;

  @ApiProperty({
    type: () => AuthMembershipDto,
    isArray: true,
  })
  memberships!: AuthMembershipDto[];

  @ApiProperty({
    type: () => AuthOrganizationDto,
    nullable: true,
  })
  activeOrganization!: AuthOrganizationDto | null;

  @ApiProperty({
    type: () => AuthAccessContextDto,
    isArray: true,
  })
  availableContexts!: AuthAccessContextDto[];

  @ApiProperty({
    type: () => AuthAccessContextDto,
    nullable: true,
  })
  activeContext!: AuthAccessContextDto | null;

  @ApiProperty({
    type: () => AuthStaffRoleDto,
    isArray: true,
  })
  activeStaffRoles!: AuthStaffRoleDto[];

  @ApiProperty({
    type: () => AuthCampusDto,
    nullable: true,
  })
  activeCampus!: AuthCampusDto | null;

  @ApiProperty({
    type: () => AuthCampusDto,
    isArray: true,
  })
  campuses!: AuthCampusDto[];

  @ApiProperty({
    type: () => AuthLinkedStudentDto,
    isArray: true,
  })
  linkedStudents!: AuthLinkedStudentDto[];
}
