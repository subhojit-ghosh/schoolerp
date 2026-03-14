import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class AttendanceClassSectionDto {
  classId!: string;
  sectionId!: string;
  studentCount!: number;
}

export class AttendanceClassSectionQueryParamsDto {
  campusId!: string;
}

export class AttendanceDayQueryParamsDto {
  attendanceDate!: string;
  campusId!: string;
  classId!: string;
  sectionId!: string;
}

export class AttendanceDayViewQueryParamsDto {
  attendanceDate!: string;
}

export class AttendanceDayEntryBodyDto {
  studentId!: string;

  @ApiProperty({
    enum: Object.values(ATTENDANCE_STATUSES),
  })
  status!: keyof typeof ATTENDANCE_STATUS_LABELS;
}

export class UpsertAttendanceDayBodyDto {
  attendanceDate!: string;
  campusId!: string;
  classId!: string;
  sectionId!: string;

  @ApiProperty({
    type: () => AttendanceDayEntryBodyDto,
    isArray: true,
  })
  entries!: AttendanceDayEntryBodyDto[];
}

export class AttendanceStudentEntryDto {
  studentId!: string;
  admissionNumber!: string;
  fullName!: string;

  @ApiProperty({
    enum: Object.values(ATTENDANCE_STATUSES),
    nullable: true,
  })
  status!: keyof typeof ATTENDANCE_STATUS_LABELS | null;
}

export class AttendanceDayDto {
  attendanceDate!: string;
  campusId!: string;
  campusName!: string;
  classId!: string;
  sectionId!: string;
  totalStudents!: number;

  @ApiProperty({
    type: () => AttendanceStudentEntryDto,
    isArray: true,
  })
  entries!: AttendanceStudentEntryDto[];
}

export class AttendanceSummaryCountsDto {
  present!: number;
  absent!: number;
  late!: number;
  excused!: number;
}

export class AttendanceDayViewItemDto {
  attendanceDate!: string;
  campusId!: string;
  campusName!: string;
  classId!: string;
  sectionId!: string;
  totalStudents!: number;

  @ApiProperty({
    type: () => AttendanceSummaryCountsDto,
  })
  counts!: AttendanceSummaryCountsDto;
}
