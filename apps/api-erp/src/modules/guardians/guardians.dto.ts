import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  GUARDIAN_RELATIONSHIPS,
  SORT_ORDERS,
  STATUS,
  type GuardianRelationship,
  type MemberStatus,
} from "../../constants";
import { sortableGuardianColumns } from "./guardians.schemas";

export class ListGuardiansQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableGuardianColumns),
  })
  sort?: keyof typeof sortableGuardianColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({ nullable: true })
  campusId?: string;
}

export class UpdateGuardianBodyDto {
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;
  campusId!: string;
}

export class LinkGuardianStudentBodyDto {
  studentId!: string;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class UpdateGuardianStudentLinkBodyDto {
  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class GuardianLinkedStudentDto {
  studentId!: string;
  membershipId!: string;
  fullName!: string;
  admissionNumber!: string;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class GuardianDto {
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;
  institutionId!: string;
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    enum: Object.values(STATUS.MEMBER),
  })
  status!: MemberStatus;

  @ApiProperty({
    type: () => GuardianLinkedStudentDto,
    isArray: true,
  })
  linkedStudents!: GuardianLinkedStudentDto[];
}

export class ListGuardiansResultDto {
  @ApiProperty({
    type: () => GuardianDto,
    isArray: true,
  })
  rows!: GuardianDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}
