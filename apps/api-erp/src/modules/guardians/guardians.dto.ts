import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  GUARDIAN_RELATIONSHIPS,
  STATUS,
  type GuardianRelationship,
  type MemberStatus,
} from "../../constants";

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
