import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class AttendanceClassSectionDto {
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  studentCount!: number;
}

export class AttendanceClassSectionQueryParamsDto {}

export class AttendanceDayQueryParamsDto {
  attendanceDate!: string;
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
  className!: string;
  sectionId!: string;
  sectionName!: string;
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
  className!: string;
  sectionId!: string;
  sectionName!: string;
  totalStudents!: number;

  @ApiProperty({
    type: () => AttendanceSummaryCountsDto,
  })
  counts!: AttendanceSummaryCountsDto;
}

export class AttendanceOverviewQueryParamsDto {
  date!: string;
}

export class AttendanceOverviewItemDto {
  campusId!: string;
  campusName!: string;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  studentCount!: number;
  marked!: boolean;

  @ApiProperty({
    type: () => AttendanceSummaryCountsDto,
    nullable: true,
  })
  counts!: AttendanceSummaryCountsDto | null;
}

export class AttendanceClassReportQueryParamsDto {
  classId!: string;
  sectionId!: string;
  startDate!: string;
  endDate!: string;
}

export class AttendanceClassReportStudentDto {
  studentId!: string;
  admissionNumber!: string;
  fullName!: string;
  present!: number;
  absent!: number;
  late!: number;
  excused!: number;
  attendancePercent!: number;

  @ApiProperty({ type: "object", additionalProperties: { type: "string" } })
  records!: Record<string, string>;
}

export class AttendanceClassReportDto {
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  campusId!: string;
  campusName!: string;
  startDate!: string;
  endDate!: string;

  @ApiProperty({ type: String, isArray: true })
  dates!: string[];

  @ApiProperty({ type: () => AttendanceClassReportStudentDto, isArray: true })
  students!: AttendanceClassReportStudentDto[];
}

export class AttendanceStudentReportQueryParamsDto {
  studentId!: string;
  startDate!: string;
  endDate!: string;
}

export class AttendanceStudentRecordDto {
  date!: string;
  status!: string;
}

export class AttendanceStudentReportDto {
  studentId!: string;
  admissionNumber!: string;
  fullName!: string;
  classId!: string;
  className!: string;
  sectionId!: string;
  sectionName!: string;
  campusId!: string;
  campusName!: string;
  startDate!: string;
  endDate!: string;
  totalMarkedDays!: number;
  present!: number;
  absent!: number;
  late!: number;
  excused!: number;
  attendancePercent!: number;

  @ApiProperty({ type: () => AttendanceStudentRecordDto, isArray: true })
  records!: AttendanceStudentRecordDto[];
}
