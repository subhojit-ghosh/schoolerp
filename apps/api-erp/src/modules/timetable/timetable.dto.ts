import { WEEKDAY_KEYS } from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TimetableScopeQueryDto {
  @ApiProperty()
  campusId!: string;

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
  room?: string;
}

export class ReplaceSectionTimetableBodyDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty({
    type: () => ReplaceTimetableEntryBodyDto,
    isArray: true,
  })
  entries!: ReplaceTimetableEntryBodyDto[];
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
  room?: string | null;
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
