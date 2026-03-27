import { ApiProperty } from "@nestjs/swagger";

export class CreateLeaveTypeBodyDto {
  name!: string;
  maxDaysPerYear?: number | null;
  isPaid?: boolean;
}

export class UpdateLeaveTypeBodyDto {
  name?: string;
  maxDaysPerYear?: number | null;
  isPaid?: boolean;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class LeaveTypeDto {
  id!: string;
  name!: string;

  @ApiProperty({ nullable: true })
  maxDaysPerYear!: number | null;

  isPaid!: boolean;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class CreateLeaveApplicationBodyDto {
  leaveTypeId!: string;
  fromDate!: string;
  toDate!: string;
  reason?: string;
}

export class ReviewLeaveApplicationBodyDto {
  @ApiProperty({ enum: ["approved", "rejected"] })
  status!: "approved" | "rejected";

  reviewNote?: string;
}

export class LeaveApplicationDto {
  id!: string;
  leaveTypeId!: string;
  leaveTypeName!: string;
  staffMemberId!: string;
  staffName!: string;

  @ApiProperty({ nullable: true })
  staffEmployeeId!: string | null;

  fromDate!: string;
  toDate!: string;
  daysCount!: number;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  @ApiProperty({ enum: ["pending", "approved", "rejected", "cancelled"] })
  status!: "pending" | "approved" | "rejected" | "cancelled";

  @ApiProperty({ nullable: true })
  reviewedByName!: string | null;

  @ApiProperty({ nullable: true })
  reviewedAt!: string | null;

  @ApiProperty({ nullable: true })
  reviewNote!: string | null;

  createdAt!: string;
}

export class LeaveApplicationListResultDto {
  rows!: LeaveApplicationDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListLeaveApplicationsQueryParamsDto {
  q?: string;
  staffMemberId?: string;
  leaveTypeId?: string;

  @ApiProperty({
    enum: ["pending", "approved", "rejected", "cancelled"],
    required: false,
  })
  status?: "pending" | "approved" | "rejected" | "cancelled";

  from?: string;
  to?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["fromDate", "createdAt", "status"], required: false })
  sort?: "fromDate" | "createdAt" | "status";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}
