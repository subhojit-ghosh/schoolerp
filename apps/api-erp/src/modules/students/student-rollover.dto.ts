import {
  STUDENT_ROLLOVER_ACTIONS,
  STUDENT_ROLLOVER_PREVIEW_STATUS,
  type PermissionSlug,
} from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class StudentRolloverSectionMappingBodyDto {
  sourceClassId!: string;
  sourceSectionId!: string;
  targetClassId!: string;
  targetSectionId!: string;
}

export class StudentRolloverBodyDto {
  sourceAcademicYearId!: string;
  targetAcademicYearId!: string;

  @ApiProperty({
    type: () => StudentRolloverSectionMappingBodyDto,
    isArray: true,
  })
  sectionMappings!: StudentRolloverSectionMappingBodyDto[];

  @ApiProperty({
    type: String,
    isArray: true,
  })
  withdrawnStudentIds!: string[];
}

export class StudentRolloverAcademicYearDto {
  id!: string;
  name!: string;
}

export class StudentRolloverPlacementDto {
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  campusId!: string;
  campusName!: string;
}

export class StudentRolloverPreviewStudentDto {
  studentId!: string;
  membershipId!: string;
  admissionNumber!: string;
  fullName!: string;

  @ApiProperty({
    enum: Object.values(STUDENT_ROLLOVER_ACTIONS),
  })
  action!: (typeof STUDENT_ROLLOVER_ACTIONS)[keyof typeof STUDENT_ROLLOVER_ACTIONS];

  @ApiProperty({
    enum: Object.values(STUDENT_ROLLOVER_PREVIEW_STATUS),
  })
  status!: (typeof STUDENT_ROLLOVER_PREVIEW_STATUS)[keyof typeof STUDENT_ROLLOVER_PREVIEW_STATUS];

  @ApiProperty({
    type: () => StudentRolloverPlacementDto,
  })
  source!: StudentRolloverPlacementDto;

  @ApiProperty({
    type: () => StudentRolloverPlacementDto,
    nullable: true,
  })
  target!: StudentRolloverPlacementDto | null;
}

export class StudentRolloverPreviewSectionDto {
  sourceClassId!: string;
  sourceClassName!: string;
  sourceSectionId!: string;
  sourceSectionName!: string;
  sourceCampusId!: string;
  sourceCampusName!: string;
  studentCount!: number;

  @ApiProperty({
    type: () => StudentRolloverPlacementDto,
    nullable: true,
  })
  mapping!: StudentRolloverPlacementDto | null;

  @ApiProperty({
    type: () => StudentRolloverPreviewStudentDto,
    isArray: true,
  })
  students!: StudentRolloverPreviewStudentDto[];
}

export class StudentRolloverSummaryDto {
  eligibleStudentCount!: number;
  mappedStudentCount!: number;
  unmappedStudentCount!: number;
  withdrawnStudentCount!: number;
  sourceSectionCount!: number;
  mappedSectionCount!: number;
}

export class StudentRolloverPreviewDto {
  @ApiProperty({
    type: () => StudentRolloverAcademicYearDto,
  })
  sourceAcademicYear!: StudentRolloverAcademicYearDto;

  @ApiProperty({
    type: () => StudentRolloverAcademicYearDto,
  })
  targetAcademicYear!: StudentRolloverAcademicYearDto;

  @ApiProperty({
    type: () => StudentRolloverSummaryDto,
  })
  summary!: StudentRolloverSummaryDto;

  @ApiProperty({
    type: () => StudentRolloverPreviewSectionDto,
    isArray: true,
  })
  sections!: StudentRolloverPreviewSectionDto[];

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  generatedAt!: string;
}

export class StudentRolloverExecuteDto extends StudentRolloverPreviewDto {
  @ApiProperty({
    type: String,
    format: "date-time",
  })
  executedAt!: string;
}
