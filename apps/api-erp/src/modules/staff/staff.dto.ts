import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
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
  campusId!: string;

  @ApiPropertyOptional({ nullable: true })
  roleId?: string | null;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;
}

export class UpdateStaffBodyDto extends CreateStaffBodyDto {}

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
