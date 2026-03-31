import { z } from "zod";

// ── Routes ─────────────────────────────────────────────────────────────────

export const createRouteSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  campusId: z.string().optional(),
});

export type CreateRouteDto = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).optional(),
  campusId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;

export const listRoutesQuerySchema = z.object({
  q: z.string().trim().optional(),
  campusId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListRoutesQueryDto = z.infer<typeof listRoutesQuerySchema>;

// ── Stops ──────────────────────────────────────────────────────────────────

export const createStopSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sequenceNumber: z.number().int().positive(),
  pickupTime: z.string().trim().max(10).optional(),
  dropTime: z.string().trim().max(10).optional(),
});

export type CreateStopDto = z.infer<typeof createStopSchema>;

export const updateStopSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  sequenceNumber: z.number().int().positive().optional(),
  pickupTime: z.string().trim().max(10).optional(),
  dropTime: z.string().trim().max(10).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateStopDto = z.infer<typeof updateStopSchema>;

// ── Vehicles ───────────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1).max(50),
  type: z.enum(["bus", "van", "auto"]),
  capacity: z.number().int().positive(),
  driverName: z.string().trim().max(200).optional(),
  driverContact: z.string().trim().max(20).optional(),
  routeId: z.string().optional(),
});

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1).max(50).optional(),
  type: z.enum(["bus", "van", "auto"]).optional(),
  capacity: z.number().int().positive().optional(),
  driverName: z.string().trim().max(200).optional(),
  driverContact: z.string().trim().max(20).optional(),
  routeId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;

export const listVehiclesQuerySchema = z.object({
  q: z.string().trim().optional(),
  routeId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["registrationNumber", "type", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListVehiclesQueryDto = z.infer<typeof listVehiclesQuerySchema>;

// ── Assignments ────────────────────────────────────────────────────────────

export const createAssignmentSchema = z.object({
  studentId: z.string().min(1),
  routeId: z.string().min(1),
  stopId: z.string().min(1),
  assignmentType: z.enum(["pickup", "dropoff", "both"]).default("both"),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  routeId: z.string().optional(),
  stopId: z.string().optional(),
  assignmentType: z.enum(["pickup", "dropoff", "both"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;

export const listAssignmentsQuerySchema = z.object({
  q: z.string().trim().optional(),
  routeId: z.string().optional(),
  stopId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["startDate", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListAssignmentsQueryDto = z.infer<
  typeof listAssignmentsQuerySchema
>;

// ── Drivers ───────────────────────────────────────────────────────────────

export const createDriverSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mobile: z.string().trim().min(10).max(15),
  licenseNumber: z.string().trim().max(50).optional(),
  licenseExpiry: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  emergencyContact: z.string().trim().max(15).optional(),
});

export type CreateDriverDto = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  mobile: z.string().trim().min(10).max(15).optional(),
  licenseNumber: z.string().trim().max(50).optional(),
  licenseExpiry: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  emergencyContact: z.string().trim().max(15).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;

export const listDriversQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListDriversQueryDto = z.infer<typeof listDriversQuerySchema>;

// ── Maintenance Logs ──────────────────────────────────────────────────────

export const createMaintenanceLogSchema = z.object({
  vehicleId: z.string().min(1),
  maintenanceType: z.enum(["regular", "repair", "inspection"]),
  description: z.string().trim().min(1).max(1000),
  costInPaise: z.number().int().nonnegative().optional(),
  maintenanceDate: z.string().min(1),
  nextDueDate: z.string().optional(),
  vendorName: z.string().trim().max(200).optional(),
});

export type CreateMaintenanceLogDto = z.infer<
  typeof createMaintenanceLogSchema
>;

export const listMaintenanceLogsQuerySchema = z.object({
  vehicleId: z.string().optional(),
  maintenanceType: z.enum(["regular", "repair", "inspection"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["maintenanceDate", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListMaintenanceLogsQueryDto = z.infer<
  typeof listMaintenanceLogsQuerySchema
>;

// ── Route Students Report ─────────────────────────────────────────────────

export const listRouteStudentsQuerySchema = z.object({
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
});

export type ListRouteStudentsQueryDto = z.infer<
  typeof listRouteStudentsQuerySchema
>;

// ── Parsers ────────────────────────────────────────────────────────────────

export function parseCreateRoute(data: unknown): CreateRouteDto {
  return createRouteSchema.parse(data);
}
export function parseUpdateRoute(data: unknown): UpdateRouteDto {
  return updateRouteSchema.parse(data);
}
export function parseListRoutes(data: unknown): ListRoutesQueryDto {
  return listRoutesQuerySchema.parse(data);
}
export function parseCreateStop(data: unknown): CreateStopDto {
  return createStopSchema.parse(data);
}
export function parseUpdateStop(data: unknown): UpdateStopDto {
  return updateStopSchema.parse(data);
}
export function parseCreateVehicle(data: unknown): CreateVehicleDto {
  return createVehicleSchema.parse(data);
}
export function parseUpdateVehicle(data: unknown): UpdateVehicleDto {
  return updateVehicleSchema.parse(data);
}
export function parseListVehicles(data: unknown): ListVehiclesQueryDto {
  return listVehiclesQuerySchema.parse(data);
}
export function parseCreateAssignment(data: unknown): CreateAssignmentDto {
  return createAssignmentSchema.parse(data);
}
export function parseUpdateAssignment(data: unknown): UpdateAssignmentDto {
  return updateAssignmentSchema.parse(data);
}
export function parseListAssignments(data: unknown): ListAssignmentsQueryDto {
  return listAssignmentsQuerySchema.parse(data);
}
export function parseCreateDriver(data: unknown): CreateDriverDto {
  return createDriverSchema.parse(data);
}
export function parseUpdateDriver(data: unknown): UpdateDriverDto {
  return updateDriverSchema.parse(data);
}
export function parseListDrivers(data: unknown): ListDriversQueryDto {
  return listDriversQuerySchema.parse(data);
}
export function parseCreateMaintenanceLog(
  data: unknown,
): CreateMaintenanceLogDto {
  return createMaintenanceLogSchema.parse(data);
}
export function parseListMaintenanceLogs(
  data: unknown,
): ListMaintenanceLogsQueryDto {
  return listMaintenanceLogsQuerySchema.parse(data);
}
export function parseListRouteStudents(
  data: unknown,
): ListRouteStudentsQueryDto {
  return listRouteStudentsQuerySchema.parse(data);
}
