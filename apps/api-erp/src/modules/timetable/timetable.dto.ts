import { WEEKDAY_KEYS } from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TimetableScopeQueryDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sectionId!: string;
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
}

export class CopySectionTimetableBodyDto {
  @ApiProperty()
  classId!: string;

  @ApiProperty()
  sourceClassId!: string;

  @ApiProperty()
  sourceSectionId!: string;
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

export class TeacherTimetableViewDto {
  @ApiProperty()
  staffId!: string;

  @ApiProperty()
  staffName!: string;

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

  @ApiProperty({
    type: () => TimetableEntryDto,
    isArray: true,
  })
  entries!: TimetableEntryDto[];
}
