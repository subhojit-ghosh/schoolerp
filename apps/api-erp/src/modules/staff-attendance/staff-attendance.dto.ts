import {
  STAFF_ATTENDANCE_STATUSES,
  STAFF_ATTENDANCE_STATUS_LABELS,
} from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

// ── Query DTOs ──────────────────────────────────────────────────────────────

export class StaffAttendanceRosterQueryParamsDto {
  campusId!: string;
  attendanceDate!: string;
}

export class StaffAttendanceDayViewQueryParamsDto {
  attendanceDate!: string;
}

export class StaffAttendanceReportQueryParamsDto {
  campusId!: string;
  fromDate!: string;
  toDate!: string;
}

// ── Body DTOs ───────────────────────────────────────────────────────────────

export class StaffAttendanceEntryBodyDto {
  staffMembershipId!: string;

  @ApiProperty({
    enum: Object.values(STAFF_ATTENDANCE_STATUSES),
  })
  status!: keyof typeof STAFF_ATTENDANCE_STATUS_LABELS;

  notes?: string;
}

export class UpsertStaffAttendanceDayBodyDto {
  campusId!: string;
  attendanceDate!: string;

  @ApiProperty({
    type: () => StaffAttendanceEntryBodyDto,
    isArray: true,
  })
  entries!: StaffAttendanceEntryBodyDto[];
}

// ── Response DTOs ───────────────────────────────────────────────────────────

export class StaffRosterItemDto {
  membershipId!: string;
  staffName!: string;

  @ApiProperty({ nullable: true })
  designation!: string | null;

  @ApiProperty({
    enum: Object.values(STAFF_ATTENDANCE_STATUSES),
    nullable: true,
  })
  status!: keyof typeof STAFF_ATTENDANCE_STATUS_LABELS | null;

  notes?: string | null;
}

export class StaffAttendanceSummaryDto {
  present!: number;
  absent!: number;
  halfDay!: number;
  onLeave!: number;
  total!: number;
}

export class StaffAttendanceDayDto {
  attendanceDate!: string;
  campusId!: string;
  campusName!: string;

  @ApiProperty({
    type: () => StaffRosterItemDto,
    isArray: true,
  })
  roster!: StaffRosterItemDto[];

  @ApiProperty({
    type: () => StaffAttendanceSummaryDto,
  })
  summary!: StaffAttendanceSummaryDto;
}

export class StaffAttendanceCampusSummaryDto {
  campusId!: string;
  campusName!: string;
  present!: number;
  absent!: number;
  halfDay!: number;
  onLeave!: number;
  total!: number;
  marked!: boolean;
}

export class StaffAttendanceDayViewDto {
  attendanceDate!: string;

  @ApiProperty({
    type: () => StaffAttendanceCampusSummaryDto,
    isArray: true,
  })
  campuses!: StaffAttendanceCampusSummaryDto[];
}

export class StaffAttendanceReportRowDto {
  membershipId!: string;
  staffName!: string;

  @ApiProperty({ nullable: true })
  designation!: string | null;

  present!: number;
  absent!: number;
  halfDay!: number;
  onLeave!: number;
  totalMarkedDays!: number;
  attendancePercent!: number;
}

export class StaffAttendanceReportDto {
  campusId!: string;
  campusName!: string;
  fromDate!: string;
  toDate!: string;

  @ApiProperty({
    type: () => StaffAttendanceReportRowDto,
    isArray: true,
  })
  staff!: StaffAttendanceReportRowDto[];
}
