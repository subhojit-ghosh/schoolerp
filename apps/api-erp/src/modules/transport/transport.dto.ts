import { ApiProperty } from "@nestjs/swagger";

// ── Routes ─────────────────────────────────────────────────────────────────

export class CreateRouteBodyDto {
  name!: string;
  description?: string;
  campusId?: string;
}

export class UpdateRouteBodyDto {
  name?: string;
  description?: string;
  campusId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class RouteDto {
  id!: string;
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  @ApiProperty({ nullable: true })
  campusName!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  stopCount!: number;
  createdAt!: string;
}

export class RouteDetailDto extends RouteDto {
  @ApiProperty({ type: () => [StopDto] })
  stops!: StopDto[];
}

export class RouteListResultDto {
  rows!: RouteDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListRoutesQueryParamsDto {
  q?: string;
  campusId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Stops ──────────────────────────────────────────────────────────────────

export class CreateStopBodyDto {
  name!: string;
  sequenceNumber!: number;
  pickupTime?: string;
  dropTime?: string;
}

export class UpdateStopBodyDto {
  name?: string;
  sequenceNumber?: number;
  pickupTime?: string;
  dropTime?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class StopDto {
  id!: string;
  routeId!: string;
  name!: string;
  sequenceNumber!: number;

  @ApiProperty({ nullable: true })
  pickupTime!: string | null;

  @ApiProperty({ nullable: true })
  dropTime!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

// ── Vehicles ───────────────────────────────────────────────────────────────

export class CreateVehicleBodyDto {
  registrationNumber!: string;

  @ApiProperty({ enum: ["bus", "van", "auto"] })
  type!: "bus" | "van" | "auto";

  capacity!: number;
  driverName?: string;
  driverContact?: string;
  routeId?: string;
}

export class UpdateVehicleBodyDto {
  registrationNumber?: string;

  @ApiProperty({ enum: ["bus", "van", "auto"], required: false })
  type?: "bus" | "van" | "auto";

  capacity?: number;
  driverName?: string;
  driverContact?: string;
  routeId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class VehicleDto {
  id!: string;
  registrationNumber!: string;

  @ApiProperty({ enum: ["bus", "van", "auto"] })
  type!: "bus" | "van" | "auto";

  capacity!: number;

  @ApiProperty({ nullable: true })
  driverName!: string | null;

  @ApiProperty({ nullable: true })
  driverContact!: string | null;

  @ApiProperty({ nullable: true })
  routeId!: string | null;

  @ApiProperty({ nullable: true })
  routeName!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class VehicleListResultDto {
  rows!: VehicleDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListVehiclesQueryParamsDto {
  q?: string;
  routeId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["registrationNumber", "type", "createdAt"],
    required: false,
  })
  sort?: "registrationNumber" | "type" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Assignments ────────────────────────────────────────────────────────────

export class CreateAssignmentBodyDto {
  studentId!: string;
  routeId!: string;
  stopId!: string;

  @ApiProperty({ enum: ["pickup", "dropoff", "both"], required: false })
  assignmentType?: "pickup" | "dropoff" | "both";

  startDate!: string;
  endDate?: string;
}

export class UpdateAssignmentBodyDto {
  routeId?: string;
  stopId?: string;

  @ApiProperty({ enum: ["pickup", "dropoff", "both"], required: false })
  assignmentType?: "pickup" | "dropoff" | "both";

  startDate?: string;
  endDate?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class AssignmentDto {
  id!: string;
  studentId!: string;
  studentName!: string;

  @ApiProperty({ nullable: true })
  admissionNumber!: string | null;

  routeId!: string;
  routeName!: string;
  stopId!: string;
  stopName!: string;

  @ApiProperty({ enum: ["pickup", "dropoff", "both"] })
  assignmentType!: "pickup" | "dropoff" | "both";

  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class AssignmentListResultDto {
  rows!: AssignmentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListAssignmentsQueryParamsDto {
  q?: string;
  routeId?: string;
  stopId?: string;
  studentId?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["startDate", "createdAt"], required: false })
  sort?: "startDate" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Drivers ───────────────────────────────────────────────────────────────

export class CreateDriverBodyDto {
  name!: string;
  mobile!: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  address?: string;
  emergencyContact?: string;
}

export class UpdateDriverBodyDto {
  name?: string;
  mobile?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  address?: string;
  emergencyContact?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class DriverDto {
  id!: string;
  name!: string;
  mobile!: string;

  @ApiProperty({ nullable: true })
  licenseNumber!: string | null;

  @ApiProperty({ nullable: true })
  licenseExpiry!: string | null;

  @ApiProperty({ nullable: true })
  address!: string | null;

  @ApiProperty({ nullable: true })
  emergencyContact!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  vehicleCount!: number;
  createdAt!: string;
}

export class DriverListResultDto {
  rows!: DriverDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListDriversQueryParamsDto {
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

// ── Maintenance Logs ──────────────────────────────────────────────────────

export class CreateMaintenanceLogBodyDto {
  vehicleId!: string;

  @ApiProperty({ enum: ["regular", "repair", "inspection"] })
  maintenanceType!: "regular" | "repair" | "inspection";

  description!: string;
  costInPaise?: number;
  maintenanceDate!: string;
  nextDueDate?: string;
  vendorName?: string;
}

export class MaintenanceLogDto {
  id!: string;
  vehicleId!: string;
  vehicleRegistrationNumber!: string;

  @ApiProperty({ enum: ["regular", "repair", "inspection"] })
  maintenanceType!: "regular" | "repair" | "inspection";

  description!: string;

  @ApiProperty({ nullable: true })
  costInPaise!: number | null;

  maintenanceDate!: string;

  @ApiProperty({ nullable: true })
  nextDueDate!: string | null;

  @ApiProperty({ nullable: true })
  vendorName!: string | null;

  createdByMemberId!: string;
  createdAt!: string;
}

export class MaintenanceLogListResultDto {
  rows!: MaintenanceLogDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListMaintenanceLogsQueryParamsDto {
  vehicleId?: string;

  @ApiProperty({
    enum: ["regular", "repair", "inspection"],
    required: false,
  })
  maintenanceType?: "regular" | "repair" | "inspection";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["maintenanceDate", "createdAt"], required: false })
  sort?: "maintenanceDate" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Route Students Report ─────────────────────────────────────────────────

export class RouteStudentDto {
  studentId!: string;
  studentName!: string;

  @ApiProperty({ nullable: true })
  admissionNumber!: string | null;

  stopId!: string;
  stopName!: string;
  sequenceNumber!: number;

  @ApiProperty({ enum: ["pickup", "dropoff", "both"] })
  assignmentType!: "pickup" | "dropoff" | "both";

  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;
}

export class RouteStudentListResultDto {
  routeId!: string;
  routeName!: string;
  rows!: RouteStudentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListRouteStudentsQueryParamsDto {
  page?: number;
  limit?: number;
}
