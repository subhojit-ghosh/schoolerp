import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  hostelBuildingStatusSchema,
  hostelBuildingTypeSchema,
  hostelRoomStatusSchema,
  hostelRoomTypeSchema,
  bedAllocationStatusSchema,
  messPlanStatusSchema,
} from "@repo/contracts";

// ── Buildings ────────────────────────────────────────────────────────────────

export const createBuildingSchema = z.object({
  name: z.string().min(1).max(200),
  buildingType: hostelBuildingTypeSchema,
  campusId: z.uuid().optional().nullable(),
  wardenMembershipId: z.uuid().optional().nullable(),
  capacity: z.number().int().min(0).default(0),
  description: z.string().max(1000).optional(),
});

export const updateBuildingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  buildingType: hostelBuildingTypeSchema.optional(),
  campusId: z.uuid().optional().nullable(),
  wardenMembershipId: z.uuid().optional().nullable(),
  capacity: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const updateBuildingStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listBuildingsQuerySchema = z.object({
  q: z.string().optional(),
  status: hostelBuildingStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Rooms ────────────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  buildingId: z.uuid(),
  roomNumber: z.string().min(1).max(50),
  floor: z.number().int().min(0).default(0),
  roomType: hostelRoomTypeSchema,
  capacity: z.number().int().min(1).default(1),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(50).optional(),
  floor: z.number().int().min(0).optional(),
  roomType: hostelRoomTypeSchema.optional(),
  capacity: z.number().int().min(1).optional(),
});

export const updateRoomStatusSchema = z.object({
  status: hostelRoomStatusSchema,
});

export const listRoomsQuerySchema = z.object({
  q: z.string().optional(),
  buildingId: z.string().optional(),
  status: hostelRoomStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["roomNumber", "floor", "createdAt"]).default("roomNumber"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Allocations ──────────────────────────────────────────────────────────────

export const createAllocationSchema = z.object({
  roomId: z.uuid(),
  studentId: z.uuid(),
  bedNumber: z.string().min(1).max(20),
  startDate: z.string().min(1),
});

export const listAllocationsQuerySchema = z.object({
  q: z.string().optional(),
  roomId: z.string().optional(),
  buildingId: z.string().optional(),
  status: bedAllocationStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["bedNumber", "startDate", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Mess Plans ───────────────────────────────────────────────────────────────

export const createMessPlanSchema = z.object({
  name: z.string().min(1).max(200),
  monthlyFeeInPaise: z.number().int().min(0),
  description: z.string().max(1000).optional(),
});

export const updateMessPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  monthlyFeeInPaise: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const updateMessPlanStatusSchema = z.object({
  status: messPlanStatusSchema,
});

export const listMessPlansQuerySchema = z.object({
  q: z.string().optional(),
  status: messPlanStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type CreateBuildingDto = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingDto = z.infer<typeof updateBuildingSchema>;
export type UpdateBuildingStatusDto = z.infer<typeof updateBuildingStatusSchema>;
export type ListBuildingsQueryDto = z.infer<typeof listBuildingsQuerySchema>;
export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
export type UpdateRoomStatusDto = z.infer<typeof updateRoomStatusSchema>;
export type ListRoomsQueryDto = z.infer<typeof listRoomsQuerySchema>;
export type CreateAllocationDto = z.infer<typeof createAllocationSchema>;
export type ListAllocationsQueryDto = z.infer<typeof listAllocationsQuerySchema>;
export type CreateMessPlanDto = z.infer<typeof createMessPlanSchema>;
export type UpdateMessPlanDto = z.infer<typeof updateMessPlanSchema>;
export type UpdateMessPlanStatusDto = z.infer<typeof updateMessPlanStatusSchema>;
export type ListMessPlansQueryDto = z.infer<typeof listMessPlansQuerySchema>;

// ── Parse helpers ────────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateBuilding(input: unknown) {
  return parseOrBadRequest(createBuildingSchema, input);
}
export function parseUpdateBuilding(input: unknown) {
  return parseOrBadRequest(updateBuildingSchema, input);
}
export function parseUpdateBuildingStatus(input: unknown) {
  return parseOrBadRequest(updateBuildingStatusSchema, input);
}
export function parseListBuildings(input: unknown) {
  return parseOrBadRequest(listBuildingsQuerySchema, input);
}
export function parseCreateRoom(input: unknown) {
  return parseOrBadRequest(createRoomSchema, input);
}
export function parseUpdateRoom(input: unknown) {
  return parseOrBadRequest(updateRoomSchema, input);
}
export function parseUpdateRoomStatus(input: unknown) {
  return parseOrBadRequest(updateRoomStatusSchema, input);
}
export function parseListRooms(input: unknown) {
  return parseOrBadRequest(listRoomsQuerySchema, input);
}
export function parseCreateAllocation(input: unknown) {
  return parseOrBadRequest(createAllocationSchema, input);
}
export function parseListAllocations(input: unknown) {
  return parseOrBadRequest(listAllocationsQuerySchema, input);
}
export function parseCreateMessPlan(input: unknown) {
  return parseOrBadRequest(createMessPlanSchema, input);
}
export function parseUpdateMessPlan(input: unknown) {
  return parseOrBadRequest(updateMessPlanSchema, input);
}
export function parseUpdateMessPlanStatus(input: unknown) {
  return parseOrBadRequest(updateMessPlanStatusSchema, input);
}
export function parseListMessPlans(input: unknown) {
  return parseOrBadRequest(listMessPlansQuerySchema, input);
}
