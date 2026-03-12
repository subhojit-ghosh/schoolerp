import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  GUARDIAN_RELATIONSHIPS,
  STATUS,
  type GuardianRelationship,
  type MemberStatus,
} from "../../constants";

export class CreateGuardianLinkBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;

  @ApiProperty()
  isPrimary!: boolean;
}

export class CreateStudentBodyDto {
  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;

  @ApiProperty()
  campusId!: string;

  @ApiProperty({
    type: () => CreateGuardianLinkBodyDto,
    isArray: true,
  })
  guardians!: CreateGuardianLinkBodyDto[];
}

export class StudentGuardianDto {
  @ApiProperty()
  membershipId!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;

  @ApiProperty()
  isPrimary!: boolean;
}

export class StudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  membershipId!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
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
}
