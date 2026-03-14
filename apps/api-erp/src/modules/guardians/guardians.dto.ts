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

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableGuardianColumns),
  })
  sort?: keyof typeof sortableGuardianColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class UpdateGuardianBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty()
  campusId!: string;
}

export class LinkGuardianStudentBodyDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;

  @ApiProperty()
  isPrimary!: boolean;
}

export class UpdateGuardianStudentLinkBodyDto {
  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;

  @ApiProperty()
  isPrimary!: boolean;
}

export class GuardianLinkedStudentDto {
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
  })
  relationship!: GuardianRelationship;

  @ApiProperty()
  isPrimary!: boolean;
}

export class GuardianDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
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

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
