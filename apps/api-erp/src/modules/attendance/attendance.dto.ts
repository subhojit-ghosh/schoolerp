import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
} from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class AttendanceClassSectionDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  studentCount!: number;
}

export class AttendanceClassSectionQueryParamsDto {
  @ApiProperty()
  campusId!: string;
}

export class AttendanceDayQueryParamsDto {
  @ApiProperty()
  attendanceDate!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;
}

export class AttendanceDayViewQueryParamsDto {
  @ApiProperty()
  attendanceDate!: string;
}

export class AttendanceDayEntryBodyDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty({
    enum: Object.values(ATTENDANCE_STATUSES),
  })
  status!: keyof typeof ATTENDANCE_STATUS_LABELS;
}

export class UpsertAttendanceDayBodyDto {
  @ApiProperty()
  attendanceDate!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty({
    type: () => AttendanceDayEntryBodyDto,
    isArray: true,
  })
  entries!: AttendanceDayEntryBodyDto[];
}

export class AttendanceStudentEntryDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  admissionNumber!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({
    enum: Object.values(ATTENDANCE_STATUSES),
    nullable: true,
  })
  status!: keyof typeof ATTENDANCE_STATUS_LABELS | null;
}

export class AttendanceDayDto {
  @ApiProperty()
  attendanceDate!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  totalStudents!: number;

  @ApiProperty({
    type: () => AttendanceStudentEntryDto,
    isArray: true,
  })
  entries!: AttendanceStudentEntryDto[];
}

export class AttendanceSummaryCountsDto {
  @ApiProperty()
  present!: number;

  @ApiProperty()
  absent!: number;

  @ApiProperty()
  late!: number;

  @ApiProperty()
  excused!: number;
}

export class AttendanceDayViewItemDto {
  @ApiProperty()
  attendanceDate!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  totalStudents!: number;

  @ApiProperty({
    type: () => AttendanceSummaryCountsDto,
  })
  counts!: AttendanceSummaryCountsDto;
}
