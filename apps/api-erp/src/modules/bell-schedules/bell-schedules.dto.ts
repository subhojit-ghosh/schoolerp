import { BELL_SCHEDULE_STATUS } from "@repo/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS } from "../../constants";
import { sortableBellScheduleColumns } from "./bell-schedules.schemas";

export class ListBellSchedulesQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({ enum: Object.values(sortableBellScheduleColumns) })
  sort?: keyof typeof sortableBellScheduleColumns;

  @ApiPropertyOptional({ enum: Object.values(SORT_ORDERS) })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

  @ApiPropertyOptional({ enum: ["draft", "active", "archived"] })
  status?: "draft" | "active" | "archived";
}

export class BellSchedulePeriodBodyDto {
  @ApiProperty({ minimum: 1 })
  periodIndex!: number;

  @ApiPropertyOptional({ nullable: true })
  label?: string;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiPropertyOptional()
  isBreak?: boolean;
}

export class CreateBellScheduleBodyDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class UpdateBellScheduleBodyDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class SetBellScheduleStatusBodyDto {
  @ApiProperty({ enum: Object.values(BELL_SCHEDULE_STATUS) })
  status!: "draft" | "active" | "archived" | "deleted";
}

export class ReplaceBellSchedulePeriodsBodyDto {
  @ApiProperty({ type: () => BellSchedulePeriodBodyDto, isArray: true })
  periods!: BellSchedulePeriodBodyDto[];
}

export class BellSchedulePeriodDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  periodIndex!: number;

  @ApiPropertyOptional({ nullable: true })
  label?: string | null;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty()
  isBreak!: boolean;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class BellScheduleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({ enum: Object.values(BELL_SCHEDULE_STATUS) })
  status!: "draft" | "active" | "archived" | "deleted";

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  periodCount!: number;

  @ApiProperty({ type: () => BellSchedulePeriodDto, isArray: true })
  periods!: BellSchedulePeriodDto[];
}

export class BellScheduleListRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  campusName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({ enum: Object.values(BELL_SCHEDULE_STATUS) })
  status!: "draft" | "active" | "archived" | "deleted";

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  periodCount!: number;
}

export class ListBellSchedulesResultDto {
  @ApiProperty({ type: () => BellScheduleListRowDto, isArray: true })
  rows!: BellScheduleListRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
