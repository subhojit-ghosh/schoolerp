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
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class CurrentStudentEnrollmentBodyDto {
  academicYearId!: string;
  classId!: string;
  sectionId!: string;
}

export class CreateStudentBodyDto {
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;
  classId!: string;
  sectionId!: string;
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
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName?: string | null;
  classId!: string;
  sectionId!: string;
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
  membershipId!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;
  name!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({
    enum: Object.values(GUARDIAN_RELATIONSHIPS),
  })
  relationship!: GuardianRelationship;
  isPrimary!: boolean;
}

export class CurrentStudentEnrollmentDto {
  academicYearId!: string;
  academicYearName!: string;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
}

export class StudentDto {
  id!: string;
  membershipId!: string;
  institutionId!: string;
  admissionNumber!: string;
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  fullName!: string;
  campusId!: string;
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
  id!: string;
  admissionNumber!: string;
  fullName!: string;
  campusName!: string;
}

export class ListStudentsResultDto {
  @ApiProperty({
    type: () => StudentDto,
    isArray: true,
  })
  rows!: StudentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}
