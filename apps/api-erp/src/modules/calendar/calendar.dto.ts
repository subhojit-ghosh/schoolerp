import { CALENDAR_EVENT_TYPES } from "@repo/contracts";
import { SORT_ORDERS } from "../../constants";
import { sortableCalendarColumns } from "./calendar.schemas";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListCalendarEventsQueryDto {
  @ApiPropertyOptional({ nullable: true })
  fromDate?: string;

  @ApiPropertyOptional({ nullable: true })
  toDate?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableCalendarColumns),
  })
  sort?: keyof typeof sortableCalendarColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateCalendarEventBodyDto {
  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string;

  @ApiProperty()
  eventDate!: string;

  @ApiPropertyOptional({ nullable: true })
  startTime?: string;

  @ApiPropertyOptional({ nullable: true })
  endTime?: string;

  @ApiProperty()
  isAllDay!: boolean;

  @ApiProperty({ enum: Object.values(CALENDAR_EVENT_TYPES) })
  eventType!: "holiday" | "exam" | "event" | "deadline";
}

export class UpdateCalendarEventBodyDto {
  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string;

  @ApiProperty()
  eventDate!: string;

  @ApiPropertyOptional({ nullable: true })
  startTime?: string;

  @ApiPropertyOptional({ nullable: true })
  endTime?: string;

  @ApiProperty()
  isAllDay!: boolean;

  @ApiProperty({ enum: Object.values(CALENDAR_EVENT_TYPES) })
  eventType!: "holiday" | "exam" | "event" | "deadline";
}

export class SetCalendarEventStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class CalendarEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  campusId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  campusName?: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  eventDate!: string;

  @ApiPropertyOptional({ nullable: true })
  startTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime?: string | null;

  @ApiProperty()
  isAllDay!: boolean;

  @ApiProperty({ enum: Object.values(CALENDAR_EVENT_TYPES) })
  eventType!: "holiday" | "exam" | "event" | "deadline";

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  @ApiProperty()
  createdAt!: string;
}

export class ListCalendarEventsResultDto {
  @ApiProperty({
    type: () => CalendarEventDto,
    isArray: true,
  })
  rows!: CalendarEventDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
