import { TIMETABLE_VERSION_STATUS, WEEKDAY_KEYS } from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TimetableScopeQueryDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiPropertyOptional()
  versionId?: string;

  @ApiPropertyOptional()
  date?: string;
}

export class ReplaceTimetableEntryBodyDto {
  @ApiProperty({ enum: Object.values(WEEKDAY_KEYS) })
  dayOfWeek!:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

  @ApiProperty({ minimum: 1 })
  periodIndex!: number;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty()
  subjectId!: string;

  @ApiPropertyOptional({ nullable: true })
  bellSchedulePeriodId?: string;

  @ApiPropertyOptional({ nullable: true })
  staffId?: string;

  @ApiPropertyOptional({ nullable: true })
  room?: string;
}

export class ReplaceSectionTimetableBodyDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  versionId!: string;

  @ApiProperty({
    type: () => ReplaceTimetableEntryBodyDto,
    isArray: true,
  })
  entries!: ReplaceTimetableEntryBodyDto[];
}

export class TimetableStaffOptionsQueryDto {
  @ApiPropertyOptional()
  classId?: string;

  @ApiProperty()
  subjectId!: string;
}

export class TeacherTimetableQueryDto {
  @ApiProperty()
  staffId!: string;

  @ApiPropertyOptional()
  date?: string;
}

export class CopySectionTimetableBodyDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  versionId!: string;

  @ApiProperty()
  sourceClassId!: string;

  @ApiProperty()
  sourceSectionId!: string;

  @ApiPropertyOptional()
  sourceVersionId?: string;
}

export class ListTimetableVersionsQueryDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;
}

export class CreateTimetableVersionBodyDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  bellScheduleId?: string;

  @ApiPropertyOptional({ nullable: true })
  duplicateFromVersionId?: string;
}

export class UpdateTimetableVersionBodyDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  bellScheduleId?: string;

  @ApiPropertyOptional({ nullable: true })
  notes?: string;
}

export class PublishTimetableVersionBodyDto {
  @ApiProperty()
  effectiveFrom!: string;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo?: string;
}

export class SetTimetableVersionStatusBodyDto {
  @ApiProperty({ enum: Object.values(TIMETABLE_VERSION_STATUS) })
  status!: "draft" | "published" | "archived";
}

export class StaffOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class TimetableStaffOptionsDto {
  @ApiProperty({ type: () => StaffOptionDto, isArray: true })
  preferred!: StaffOptionDto[];

  @ApiProperty({ type: () => StaffOptionDto, isArray: true })
  others!: StaffOptionDto[];
}

export class TimetableEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: Object.values(WEEKDAY_KEYS) })
  dayOfWeek!:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

  @ApiProperty()
  periodIndex!: number;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty()
  subjectId!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiPropertyOptional({ nullable: true })
  bellSchedulePeriodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  staffId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  staffName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  room?: string | null;
}

export class TeacherTimetableEntryDto extends TimetableEntryDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  sectionName!: string;
}

export class TimetableVersionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  bellScheduleId!: string;

  @ApiProperty()
  bellScheduleName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Object.values(TIMETABLE_VERSION_STATUS) })
  status!: "draft" | "published" | "archived";

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicYearId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt?: string | null;

  @ApiProperty()
  entryCount!: number;

  @ApiProperty()
  isLive!: boolean;
}

export class TeacherTimetableViewDto {
  @ApiProperty()
  staffId!: string;

  @ApiProperty()
  staffName!: string;

  @ApiProperty()
  resolutionDate!: string;

  @ApiProperty({ type: () => TeacherTimetableEntryDto, isArray: true })
  entries!: TeacherTimetableEntryDto[];
}

export class TimetableViewDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  sectionId!: string;

  @ApiProperty()
  sectionName!: string;

  @ApiPropertyOptional({ nullable: true })
  versionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  versionName?: string | null;

  @ApiPropertyOptional({
    enum: Object.values(TIMETABLE_VERSION_STATUS),
    nullable: true,
  })
  versionStatus?: "draft" | "published" | "archived" | null;

  @ApiPropertyOptional({ nullable: true })
  bellScheduleId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  bellScheduleName?: string | null;

  @ApiProperty()
  resolutionDate!: string;

  @ApiProperty({
    type: () => TimetableEntryDto,
    isArray: true,
  })
  entries!: TimetableEntryDto[];
}
