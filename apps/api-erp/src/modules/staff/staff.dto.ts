import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AUTH_RECOVERY_CHANNELS,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
  type AuthRecoveryChannel,
  type MemberStatus,
  type MemberType,
} from "../../constants";
import { sortableStaffColumns } from "./staff.schemas";

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
}

export class StaffRoleDto {
  id!: string;
  name!: string;
  slug!: string;
}

export class CreateStaffBodyDto {
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;
}

export class UpdateStaffBodyDto extends CreateStaffBodyDto {}

export class SetStaffStatusBodyDto {
  @ApiProperty({
    enum: [STATUS.MEMBER.ACTIVE, STATUS.MEMBER.INACTIVE],
  })
  status!: "active" | "inactive";
}

export class StaffDto {
  id!: string;
  userId!: string;
  institutionId!: string;
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
