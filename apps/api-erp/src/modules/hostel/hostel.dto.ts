import { ApiProperty } from "@nestjs/swagger";

// ── Buildings ────────────────────────────────────────────────────────────────

export class CreateBuildingBodyDto {
  name!: string;

  @ApiProperty({ enum: ["boys", "girls", "co_ed"] })
  buildingType!: "boys" | "girls" | "co_ed";

  @ApiProperty({ nullable: true })
  campusId?: string | null;

  @ApiProperty({ nullable: true })
  wardenMembershipId?: string | null;

  capacity?: number;
  description?: string;
}

export class UpdateBuildingBodyDto {
  name?: string;

  @ApiProperty({ enum: ["boys", "girls", "co_ed"], required: false })
  buildingType?: "boys" | "girls" | "co_ed";

  @ApiProperty({ nullable: true })
  campusId?: string | null;

  @ApiProperty({ nullable: true })
  wardenMembershipId?: string | null;

  capacity?: number;

  @ApiProperty({ nullable: true })
  description?: string | null;
}

export class UpdateBuildingStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class BuildingDto {
  id!: string;
  name!: string;

  @ApiProperty({ enum: ["boys", "girls", "co_ed"] })
  buildingType!: string;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  @ApiProperty({ nullable: true })
  wardenMembershipId!: string | null;

  capacity!: number;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  createdAt!: string;
}

export class BuildingListResultDto {
  rows!: BuildingDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListBuildingsQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive", "deleted"], required: false })
  status?: "active" | "inactive" | "deleted";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export class CreateRoomBodyDto {
  buildingId!: string;
  roomNumber!: string;
  floor?: number;

  @ApiProperty({ enum: ["single", "double", "dormitory"] })
  roomType!: "single" | "double" | "dormitory";

  capacity?: number;
}

export class UpdateRoomBodyDto {
  roomNumber?: string;
  floor?: number;

  @ApiProperty({ enum: ["single", "double", "dormitory"], required: false })
  roomType?: "single" | "double" | "dormitory";

  capacity?: number;
}

export class UpdateRoomStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class RoomDto {
  id!: string;
  buildingId!: string;
  buildingName!: string;
  roomNumber!: string;
  floor!: number;

  @ApiProperty({ enum: ["single", "double", "dormitory"] })
  roomType!: string;

  capacity!: number;
  occupancy!: number;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class RoomListResultDto {
  rows!: RoomDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListRoomsQueryParamsDto {
  q?: string;
  buildingId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["roomNumber", "floor", "createdAt"], required: false })
  sort?: "roomNumber" | "floor" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Allocations ──────────────────────────────────────────────────────────────

export class CreateAllocationBodyDto {
  roomId!: string;
  studentId!: string;
  bedNumber!: string;
  startDate!: string;
}

export class AllocationDto {
  id!: string;
  roomId!: string;
  roomNumber!: string;
  buildingName!: string;
  studentId!: string;
  studentName!: string;
  bedNumber!: string;
  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;

  @ApiProperty({ enum: ["active", "vacated"] })
  status!: "active" | "vacated";

  createdAt!: string;
}

export class AllocationListResultDto {
  rows!: AllocationDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListAllocationsQueryParamsDto {
  q?: string;
  roomId?: string;
  buildingId?: string;

  @ApiProperty({ enum: ["active", "vacated"], required: false })
  status?: "active" | "vacated";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["bedNumber", "startDate", "createdAt"],
    required: false,
  })
  sort?: "bedNumber" | "startDate" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Mess Plans ───────────────────────────────────────────────────────────────

export class CreateMessPlanBodyDto {
  name!: string;
  monthlyFeeInPaise!: number;
  description?: string;
}

export class UpdateMessPlanBodyDto {
  name?: string;
  monthlyFeeInPaise?: number;

  @ApiProperty({ nullable: true })
  description?: string | null;
}

export class UpdateMessPlanStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class MessPlanDto {
  id!: string;
  name!: string;
  monthlyFeeInPaise!: number;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class MessPlanListResultDto {
  rows!: MessPlanDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListMessPlansQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Mess Plan Assignments ───────────────────────────────────────────────────

export class CreateMessAssignmentBodyDto {
  studentId!: string;
  messPlanId!: string;

  @ApiProperty({ nullable: true })
  bedAllocationId?: string | null;

  startDate!: string;
}

export class MessAssignmentDto {
  id!: string;
  studentId!: string;
  studentName!: string;
  messPlanId!: string;
  messPlanName!: string;

  @ApiProperty({ nullable: true })
  bedAllocationId!: string | null;

  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class MessAssignmentListResultDto {
  rows!: MessAssignmentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListMessAssignmentsQueryParamsDto {
  q?: string;
  messPlanId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["startDate", "createdAt"], required: false })
  sort?: "startDate" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Room Transfers ──────────────────────────────────────────────────────────

export class CreateRoomTransferBodyDto {
  studentId!: string;
  toRoomId!: string;
  toBedNumber!: string;
  transferDate!: string;
  reason?: string;
}

export class RoomTransferDto {
  id!: string;
  studentId!: string;
  studentName!: string;
  fromRoomId!: string;
  fromRoomNumber!: string;
  toRoomId!: string;
  toRoomNumber!: string;
  fromBedNumber!: string;
  toBedNumber!: string;
  transferDate!: string;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  transferredByMemberId!: string;
  createdAt!: string;
}

export class RoomTransferListResultDto {
  rows!: RoomTransferDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListRoomTransfersQueryParamsDto {
  q?: string;
  studentId?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["transferDate", "createdAt"], required: false })
  sort?: "transferDate" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Batch Allocation ────────────────────────────────────────────────────────

export class BatchAllocationItemDto {
  roomId!: string;
  studentId!: string;
  bedNumber!: string;
  startDate!: string;
}

export class CreateBatchAllocationBodyDto {
  @ApiProperty({ type: [BatchAllocationItemDto] })
  allocations!: BatchAllocationItemDto[];
}

export class BatchAllocationResultDto {
  created!: number;
  failed!: number;

  @ApiProperty({ type: [String] })
  errors!: string[];
}

// ── Occupancy Dashboard ─────────────────────────────────────────────────────

export class BuildingOccupancyDto {
  buildingId!: string;
  buildingName!: string;
  totalCapacity!: number;
  totalOccupancy!: number;
  availableBeds!: number;
  occupancyPercent!: number;
}

export class FloorOccupancyDto {
  buildingId!: string;
  buildingName!: string;
  floor!: number;
  totalCapacity!: number;
  totalOccupancy!: number;
  availableBeds!: number;
  occupancyPercent!: number;
}

export class OccupancyDashboardDto {
  @ApiProperty({ type: [BuildingOccupancyDto] })
  buildings!: BuildingOccupancyDto[];

  @ApiProperty({ type: [FloorOccupancyDto] })
  floors!: FloorOccupancyDto[];

  totalCapacity!: number;
  totalOccupancy!: number;
  totalAvailable!: number;
  overallOccupancyPercent!: number;
}
