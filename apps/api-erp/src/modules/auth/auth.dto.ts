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
  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty()
  password!: string;

  @ApiPropertyOptional()
  tenantSlug?: string;
}

export class SignInBodyDto {
  @ApiProperty()
  identifier!: string;

  @ApiProperty()
  password!: string;

  @ApiPropertyOptional()
  tenantSlug?: string;
}

export class ForgotPasswordBodyDto {
  @ApiProperty()
  identifier!: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiPropertyOptional({ nullable: true })
  resetTokenPreview?: string | null;
}

export class ResetPasswordBodyDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  password!: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty()
  success!: boolean;
}

export class SwitchCampusBodyDto {
  @ApiProperty()
  campusId!: string;
}

export class SwitchContextBodyDto {
  @ApiProperty({
    enum: Object.values(AUTH_CONTEXT_KEYS),
  })
  contextKey!: AuthContextKey;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;
}

export class AuthOrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  shortName!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true })
  faviconUrl!: string | null;

  @ApiProperty()
  primaryColor!: string;

  @ApiProperty()
  accentColor!: string;

  @ApiProperty()
  sidebarColor!: string;

  @ApiProperty({
    enum: Object.values(STATUS.ORG),
  })
  status!: OrgStatus;
}

export class AuthCampusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.CAMPUS),
  })
  status!: CampusStatus;
}

export class AuthMembershipDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
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

export class AuthLinkedStudentDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  membershipId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
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
