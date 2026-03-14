import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  GUARDIAN_RELATIONSHIPS,
  SORT_ORDERS,
  STATUS,
  type GuardianRelationship,
  type MemberStatus,
} from "../../constants";
import { sortableStudentColumns } from "./students.schemas";

export class ListStudentsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableStudentColumns),
  })
  sort?: keyof typeof sortableStudentColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

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

export class CurrentStudentEnrollmentBodyDto {
  @ApiProperty()
  academicYearId!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;
}

export class CreateStudentBodyDto {
  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty({
    type: () => CreateGuardianLinkBodyDto,
    isArray: true,
  })
  guardians!: CreateGuardianLinkBodyDto[];

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentBodyDto,
    nullable: true,
  })
  currentEnrollment?: CurrentStudentEnrollmentBodyDto | null;
}

export class UpdateStudentBodyDto {
  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty({
    type: () => CreateGuardianLinkBodyDto,
    isArray: true,
  })
  guardians!: CreateGuardianLinkBodyDto[];

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentBodyDto,
    nullable: true,
  })
  currentEnrollment?: CurrentStudentEnrollmentBodyDto | null;
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

export class CurrentStudentEnrollmentDto {
  @ApiProperty()
  academicYearId!: string;

  @ApiProperty()
  academicYearName!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  sectionName!: string;
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
  classId!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  sectionName!: string;

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

  @ApiPropertyOptional({
    type: () => CurrentStudentEnrollmentDto,
    nullable: true,
  })
  currentEnrollment!: CurrentStudentEnrollmentDto | null;
}

export class StudentOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  campusName!: string;
}

export class ListStudentsResultDto {
  @ApiProperty({
    type: () => StudentDto,
    isArray: true,
  })
  rows!: StudentDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
