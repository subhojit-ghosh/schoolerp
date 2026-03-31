import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  ne,
  sum,
  sql,
  hostelBuildings,
  hostelRooms,
  bedAllocations,
  messPlans,
  messPlanAssignments,
  hostelRoomTransfers,
  students,
  member,
  user,
  type AppDatabase,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  HOSTEL_BUILDING_STATUS,
  BED_ALLOCATION_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateBuildingDto,
  UpdateBuildingDto,
  UpdateBuildingStatusDto,
  ListBuildingsQueryDto,
  CreateRoomDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
  ListRoomsQueryDto,
  CreateAllocationDto,
  ListAllocationsQueryDto,
  CreateMessPlanDto,
  UpdateMessPlanDto,
  UpdateMessPlanStatusDto,
  ListMessPlansQueryDto,
  CreateMessAssignmentDto,
  ListMessAssignmentsQueryDto,
  CreateRoomTransferDto,
  ListRoomTransfersQueryDto,
  CreateBatchAllocationDto,
} from "./hostel.schemas";

// ── Sort maps ─────────────────────────────────────────────────────────────

const buildingSortColumns = {
  name: hostelBuildings.name,
  createdAt: hostelBuildings.createdAt,
} as const;

const roomSortColumns = {
  roomNumber: hostelRooms.roomNumber,
  floor: hostelRooms.floor,
  createdAt: hostelRooms.createdAt,
} as const;

const allocationSortColumns = {
  bedNumber: bedAllocations.bedNumber,
  startDate: bedAllocations.startDate,
  createdAt: bedAllocations.createdAt,
} as const;

const messPlanSortColumns = {
  name: messPlans.name,
  createdAt: messPlans.createdAt,
} as const;

const messAssignmentSortColumns = {
  startDate: messPlanAssignments.startDate,
  createdAt: messPlanAssignments.createdAt,
} as const;

const roomTransferSortColumns = {
  transferDate: hostelRoomTransfers.transferDate,
  createdAt: hostelRoomTransfers.createdAt,
} as const;

@Injectable()
export class HostelService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Buildings ─────────────────────────────────────────────────────────

  async listBuildings(institutionId: string, query: ListBuildingsQueryDto) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = buildingSortColumns[sort ?? "name"];

    const conditions = [eq(hostelBuildings.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(hostelBuildings.status, status));
    } else {
      conditions.push(
        ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
      );
    }
    if (q) {
      conditions.push(ilike(hostelBuildings.name, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(hostelBuildings)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: hostelBuildings.id,
        name: hostelBuildings.name,
        buildingType: hostelBuildings.buildingType,
        campusId: hostelBuildings.campusId,
        wardenMembershipId: hostelBuildings.wardenMembershipId,
        capacity: hostelBuildings.capacity,
        description: hostelBuildings.description,
        status: hostelBuildings.status,
        createdAt: hostelBuildings.createdAt,
      })
      .from(hostelBuildings)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async getBuilding(institutionId: string, buildingId: string) {
    const [building] = await this.db
      .select({
        id: hostelBuildings.id,
        name: hostelBuildings.name,
        buildingType: hostelBuildings.buildingType,
        campusId: hostelBuildings.campusId,
        wardenMembershipId: hostelBuildings.wardenMembershipId,
        capacity: hostelBuildings.capacity,
        description: hostelBuildings.description,
        status: hostelBuildings.status,
        createdAt: hostelBuildings.createdAt,
        updatedAt: hostelBuildings.updatedAt,
      })
      .from(hostelBuildings)
      .where(
        and(
          eq(hostelBuildings.id, buildingId),
          eq(hostelBuildings.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      );

    if (!building) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.BUILDING_NOT_FOUND);
    }

    return building;
  }

  async createBuilding(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateBuildingDto,
  ) {
    const id = randomUUID();
    await this.db.insert(hostelBuildings).values({
      id,
      institutionId,
      name: dto.name,
      buildingType: dto.buildingType,
      campusId: dto.campusId ?? null,
      wardenMembershipId: dto.wardenMembershipId ?? null,
      capacity: dto.capacity ?? 0,
      description: dto.description ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_BUILDING,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created hostel building "${dto.name}"`,
    });

    return { id };
  }

  async updateBuilding(
    institutionId: string,
    buildingId: string,
    session: AuthenticatedSession,
    dto: UpdateBuildingDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(hostelBuildings)
      .where(
        and(
          eq(hostelBuildings.id, buildingId),
          eq(hostelBuildings.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.BUILDING_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.buildingType !== undefined) updates.buildingType = dto.buildingType;
    if (dto.campusId !== undefined) updates.campusId = dto.campusId;
    if (dto.wardenMembershipId !== undefined)
      updates.wardenMembershipId = dto.wardenMembershipId;
    if (dto.capacity !== undefined) updates.capacity = dto.capacity;
    if (dto.description !== undefined) updates.description = dto.description;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(hostelBuildings)
        .set(updates)
        .where(eq(hostelBuildings.id, buildingId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_BUILDING,
      entityId: buildingId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated hostel building "${dto.name ?? existing.name}"`,
    });

    return { id: buildingId };
  }

  async updateBuildingStatus(
    institutionId: string,
    buildingId: string,
    session: AuthenticatedSession,
    dto: UpdateBuildingStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(hostelBuildings)
      .where(
        and(
          eq(hostelBuildings.id, buildingId),
          eq(hostelBuildings.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.BUILDING_NOT_FOUND);
    }

    await this.db
      .update(hostelBuildings)
      .set({ status: dto.status })
      .where(eq(hostelBuildings.id, buildingId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_BUILDING,
      entityId: buildingId,
      entityLabel: existing.name,
      summary: `Changed hostel building "${existing.name}" status to ${dto.status}`,
    });

    return { id: buildingId };
  }

  // ── Rooms ──────────────────────────────────────────────────────────────

  async listRooms(institutionId: string, query: ListRoomsQueryDto) {
    const { q, buildingId, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = roomSortColumns[sort ?? "roomNumber"];

    const conditions = [eq(hostelRooms.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(hostelRooms.status, status));
    }
    if (buildingId) {
      conditions.push(eq(hostelRooms.buildingId, buildingId));
    }
    if (q) {
      conditions.push(ilike(hostelRooms.roomNumber, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(hostelRooms)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: hostelRooms.id,
        buildingId: hostelRooms.buildingId,
        buildingName: hostelBuildings.name,
        roomNumber: hostelRooms.roomNumber,
        floor: hostelRooms.floor,
        roomType: hostelRooms.roomType,
        capacity: hostelRooms.capacity,
        occupancy: hostelRooms.occupancy,
        status: hostelRooms.status,
        createdAt: hostelRooms.createdAt,
      })
      .from(hostelRooms)
      .leftJoin(hostelBuildings, eq(hostelRooms.buildingId, hostelBuildings.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async createRoom(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateRoomDto,
  ) {
    // Verify building exists
    const [building] = await this.db
      .select({ id: hostelBuildings.id, name: hostelBuildings.name })
      .from(hostelBuildings)
      .where(
        and(
          eq(hostelBuildings.id, dto.buildingId),
          eq(hostelBuildings.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      );

    if (!building) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.BUILDING_NOT_FOUND);
    }

    const id = randomUUID();
    await this.db.insert(hostelRooms).values({
      id,
      institutionId,
      buildingId: dto.buildingId,
      roomNumber: dto.roomNumber,
      floor: dto.floor ?? 0,
      roomType: dto.roomType,
      capacity: dto.capacity ?? 1,
      occupancy: 0,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_ROOM,
      entityId: id,
      entityLabel: dto.roomNumber,
      summary: `Created hostel room "${dto.roomNumber}" in building "${building.name}"`,
    });

    return { id };
  }

  async updateRoom(
    institutionId: string,
    roomId: string,
    session: AuthenticatedSession,
    dto: UpdateRoomDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(hostelRooms)
      .where(
        and(
          eq(hostelRooms.id, roomId),
          eq(hostelRooms.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ROOM_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.roomNumber !== undefined) updates.roomNumber = dto.roomNumber;
    if (dto.floor !== undefined) updates.floor = dto.floor;
    if (dto.roomType !== undefined) updates.roomType = dto.roomType;
    if (dto.capacity !== undefined) updates.capacity = dto.capacity;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(hostelRooms)
        .set(updates)
        .where(eq(hostelRooms.id, roomId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_ROOM,
      entityId: roomId,
      entityLabel: dto.roomNumber ?? existing.roomNumber,
      summary: `Updated hostel room "${dto.roomNumber ?? existing.roomNumber}"`,
    });

    return { id: roomId };
  }

  async updateRoomStatus(
    institutionId: string,
    roomId: string,
    session: AuthenticatedSession,
    dto: UpdateRoomStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(hostelRooms)
      .where(
        and(
          eq(hostelRooms.id, roomId),
          eq(hostelRooms.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ROOM_NOT_FOUND);
    }

    await this.db
      .update(hostelRooms)
      .set({ status: dto.status })
      .where(eq(hostelRooms.id, roomId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_ROOM,
      entityId: roomId,
      entityLabel: existing.roomNumber,
      summary: `Changed hostel room "${existing.roomNumber}" status to ${dto.status}`,
    });

    return { id: roomId };
  }

  // ── Allocations ────────────────────────────────────────────────────────

  async listAllocations(institutionId: string, query: ListAllocationsQueryDto) {
    const { q, roomId, buildingId, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = allocationSortColumns[sort ?? "createdAt"];

    const conditions = [eq(bedAllocations.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(bedAllocations.status, status));
    }
    if (roomId) {
      conditions.push(eq(bedAllocations.roomId, roomId));
    }
    if (buildingId) {
      conditions.push(eq(hostelRooms.buildingId, buildingId));
    }
    if (q) {
      conditions.push(ilike(bedAllocations.bedNumber, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(bedAllocations)
      .leftJoin(hostelRooms, eq(bedAllocations.roomId, hostelRooms.id))
      .leftJoin(hostelBuildings, eq(hostelRooms.buildingId, hostelBuildings.id))
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: bedAllocations.id,
        roomId: bedAllocations.roomId,
        roomNumber: hostelRooms.roomNumber,
        buildingName: hostelBuildings.name,
        studentId: bedAllocations.studentId,
        bedNumber: bedAllocations.bedNumber,
        startDate: bedAllocations.startDate,
        endDate: bedAllocations.endDate,
        status: bedAllocations.status,
        createdAt: bedAllocations.createdAt,
      })
      .from(bedAllocations)
      .leftJoin(hostelRooms, eq(bedAllocations.roomId, hostelRooms.id))
      .leftJoin(hostelBuildings, eq(hostelRooms.buildingId, hostelBuildings.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve student names
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const studentNames = await this.resolveStudentNames(studentIds);

    const enrichedRows = rows.map((row) => ({
      ...row,
      studentName: studentNames.get(row.studentId) ?? "Unknown",
    }));

    return { rows: enrichedRows, total, page: safePage, pageSize, pageCount };
  }

  async createAllocation(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateAllocationDto,
  ) {
    // Verify room exists and has capacity
    const [room] = await this.db
      .select()
      .from(hostelRooms)
      .where(
        and(
          eq(hostelRooms.id, dto.roomId),
          eq(hostelRooms.institutionId, institutionId),
        ),
      );

    if (!room) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ROOM_NOT_FOUND);
    }

    if (room.occupancy >= room.capacity) {
      throw new BadRequestException(ERROR_MESSAGES.HOSTEL.ROOM_FULL);
    }

    // Verify student exists
    const [student] = await this.db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.id, dto.studentId),
          eq(students.institutionId, institutionId),
        ),
      );

    if (!student) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.STUDENT_NOT_FOUND);
    }

    // Check for existing active allocation
    const [existingAllocation] = await this.db
      .select({ id: bedAllocations.id })
      .from(bedAllocations)
      .where(
        and(
          eq(bedAllocations.studentId, dto.studentId),
          eq(bedAllocations.status, BED_ALLOCATION_STATUS.ACTIVE),
        ),
      );

    if (existingAllocation) {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL.STUDENT_ALREADY_ALLOCATED,
      );
    }

    const id = randomUUID();

    await this.db.insert(bedAllocations).values({
      id,
      institutionId,
      roomId: dto.roomId,
      studentId: dto.studentId,
      bedNumber: dto.bedNumber,
      startDate: dto.startDate,
    });

    // Increment room occupancy
    await this.db
      .update(hostelRooms)
      .set({ occupancy: room.occupancy + 1 })
      .where(eq(hostelRooms.id, dto.roomId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.BED_ALLOCATION,
      entityId: id,
      entityLabel: dto.bedNumber,
      summary: `Allocated bed "${dto.bedNumber}" in room "${room.roomNumber}"`,
    });

    return { id };
  }

  async vacateAllocation(
    institutionId: string,
    allocationId: string,
    session: AuthenticatedSession,
  ) {
    const [allocation] = await this.db
      .select()
      .from(bedAllocations)
      .where(
        and(
          eq(bedAllocations.id, allocationId),
          eq(bedAllocations.institutionId, institutionId),
        ),
      );

    if (!allocation) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ALLOCATION_NOT_FOUND);
    }

    if (allocation.status === BED_ALLOCATION_STATUS.VACATED) {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL.ALLOCATION_ALREADY_VACATED,
      );
    }

    const today = new Date().toISOString().split("T")[0];

    await this.db
      .update(bedAllocations)
      .set({ status: BED_ALLOCATION_STATUS.VACATED, endDate: today })
      .where(eq(bedAllocations.id, allocationId));

    // Decrement room occupancy
    const [room] = await this.db
      .select({ id: hostelRooms.id, occupancy: hostelRooms.occupancy })
      .from(hostelRooms)
      .where(eq(hostelRooms.id, allocation.roomId));

    if (room && room.occupancy > 0) {
      await this.db
        .update(hostelRooms)
        .set({ occupancy: room.occupancy - 1 })
        .where(eq(hostelRooms.id, allocation.roomId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.BED_ALLOCATION,
      entityId: allocationId,
      entityLabel: allocation.bedNumber,
      summary: `Vacated bed "${allocation.bedNumber}"`,
    });

    return { id: allocationId };
  }

  // ── Mess Plans ─────────────────────────────────────────────────────────

  async listMessPlans(institutionId: string, query: ListMessPlansQueryDto) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = messPlanSortColumns[sort ?? "name"];

    const conditions = [eq(messPlans.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(messPlans.status, status));
    }
    if (q) {
      conditions.push(ilike(messPlans.name, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(messPlans)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: messPlans.id,
        name: messPlans.name,
        monthlyFeeInPaise: messPlans.monthlyFeeInPaise,
        description: messPlans.description,
        status: messPlans.status,
        createdAt: messPlans.createdAt,
      })
      .from(messPlans)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async createMessPlan(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateMessPlanDto,
  ) {
    const id = randomUUID();
    await this.db.insert(messPlans).values({
      id,
      institutionId,
      name: dto.name,
      monthlyFeeInPaise: dto.monthlyFeeInPaise,
      description: dto.description ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.MESS_PLAN,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created mess plan "${dto.name}"`,
    });

    return { id };
  }

  async updateMessPlan(
    institutionId: string,
    planId: string,
    session: AuthenticatedSession,
    dto: UpdateMessPlanDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(messPlans)
      .where(
        and(
          eq(messPlans.id, planId),
          eq(messPlans.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.MESS_PLAN_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.monthlyFeeInPaise !== undefined)
      updates.monthlyFeeInPaise = dto.monthlyFeeInPaise;
    if (dto.description !== undefined) updates.description = dto.description;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(messPlans)
        .set(updates)
        .where(eq(messPlans.id, planId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.MESS_PLAN,
      entityId: planId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated mess plan "${dto.name ?? existing.name}"`,
    });

    return { id: planId };
  }

  async updateMessPlanStatus(
    institutionId: string,
    planId: string,
    session: AuthenticatedSession,
    dto: UpdateMessPlanStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(messPlans)
      .where(
        and(
          eq(messPlans.id, planId),
          eq(messPlans.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.MESS_PLAN_NOT_FOUND);
    }

    await this.db
      .update(messPlans)
      .set({ status: dto.status })
      .where(eq(messPlans.id, planId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.MESS_PLAN,
      entityId: planId,
      entityLabel: existing.name,
      summary: `Changed mess plan "${existing.name}" status to ${dto.status}`,
    });

    return { id: planId };
  }

  // ── Mess Plan Assignments ──────────────────────────────────────────────

  async listMessAssignments(
    institutionId: string,
    query: ListMessAssignmentsQueryDto,
  ) {
    const { q, messPlanId, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = messAssignmentSortColumns[sort ?? "createdAt"];

    const conditions = [eq(messPlanAssignments.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(messPlanAssignments.status, status));
    }
    if (messPlanId) {
      conditions.push(eq(messPlanAssignments.messPlanId, messPlanId));
    }
    if (q) {
      conditions.push(ilike(messPlans.name, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(messPlanAssignments)
      .leftJoin(messPlans, eq(messPlanAssignments.messPlanId, messPlans.id))
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: messPlanAssignments.id,
        studentId: messPlanAssignments.studentId,
        messPlanId: messPlanAssignments.messPlanId,
        messPlanName: messPlans.name,
        bedAllocationId: messPlanAssignments.bedAllocationId,
        startDate: messPlanAssignments.startDate,
        endDate: messPlanAssignments.endDate,
        status: messPlanAssignments.status,
        createdAt: messPlanAssignments.createdAt,
      })
      .from(messPlanAssignments)
      .leftJoin(messPlans, eq(messPlanAssignments.messPlanId, messPlans.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve student names
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const studentNames = await this.resolveStudentNames(studentIds);

    const enrichedRows = rows.map((row) => ({
      ...row,
      studentName: studentNames.get(row.studentId) ?? "Unknown",
      messPlanName: row.messPlanName ?? "Unknown",
    }));

    return { rows: enrichedRows, total, page: safePage, pageSize, pageCount };
  }

  async createMessAssignment(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateMessAssignmentDto,
  ) {
    // Verify student exists
    const [student] = await this.db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.id, dto.studentId),
          eq(students.institutionId, institutionId),
        ),
      );

    if (!student) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.STUDENT_NOT_FOUND);
    }

    // Verify mess plan exists
    const [plan] = await this.db
      .select({ id: messPlans.id, name: messPlans.name })
      .from(messPlans)
      .where(
        and(
          eq(messPlans.id, dto.messPlanId),
          eq(messPlans.institutionId, institutionId),
        ),
      );

    if (!plan) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.MESS_PLAN_NOT_FOUND);
    }

    // Check for existing active assignment
    const [existing] = await this.db
      .select({ id: messPlanAssignments.id })
      .from(messPlanAssignments)
      .where(
        and(
          eq(messPlanAssignments.studentId, dto.studentId),
          eq(messPlanAssignments.status, "active"),
        ),
      );

    if (existing) {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL_DEPTH.STUDENT_ALREADY_HAS_MESS,
      );
    }

    const id = randomUUID();

    await this.db.insert(messPlanAssignments).values({
      id,
      institutionId,
      studentId: dto.studentId,
      messPlanId: dto.messPlanId,
      bedAllocationId: dto.bedAllocationId ?? null,
      startDate: dto.startDate,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_MESS_ASSIGNMENT,
      entityId: id,
      entityLabel: plan.name,
      summary: `Assigned mess plan "${plan.name}" to student`,
    });

    return { id };
  }

  async deactivateMessAssignment(
    institutionId: string,
    assignmentId: string,
    session: AuthenticatedSession,
  ) {
    const [assignment] = await this.db
      .select()
      .from(messPlanAssignments)
      .where(
        and(
          eq(messPlanAssignments.id, assignmentId),
          eq(messPlanAssignments.institutionId, institutionId),
        ),
      );

    if (!assignment) {
      throw new NotFoundException(
        ERROR_MESSAGES.HOSTEL_DEPTH.MESS_ASSIGNMENT_NOT_FOUND,
      );
    }

    if (assignment.status === "inactive") {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL_DEPTH.MESS_ASSIGNMENT_ALREADY_INACTIVE,
      );
    }

    const today = new Date().toISOString().split("T")[0];

    await this.db
      .update(messPlanAssignments)
      .set({ status: "inactive", endDate: today })
      .where(eq(messPlanAssignments.id, assignmentId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_MESS_ASSIGNMENT,
      entityId: assignmentId,
      entityLabel: assignmentId,
      summary: `Deactivated mess plan assignment`,
    });

    return { id: assignmentId };
  }

  // ── Room Transfers ────────────────────────────────────────────────────────

  async listRoomTransfers(
    institutionId: string,
    query: ListRoomTransfersQueryDto,
  ) {
    const { q, studentId, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = roomTransferSortColumns[sort ?? "createdAt"];

    const conditions = [eq(hostelRoomTransfers.institutionId, institutionId)];
    if (studentId) {
      conditions.push(eq(hostelRoomTransfers.studentId, studentId));
    }
    if (q) {
      conditions.push(ilike(hostelRoomTransfers.reason, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(hostelRoomTransfers)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: hostelRoomTransfers.id,
        studentId: hostelRoomTransfers.studentId,
        fromRoomId: hostelRoomTransfers.fromRoomId,
        toRoomId: hostelRoomTransfers.toRoomId,
        fromBedNumber: hostelRoomTransfers.fromBedNumber,
        toBedNumber: hostelRoomTransfers.toBedNumber,
        transferDate: hostelRoomTransfers.transferDate,
        reason: hostelRoomTransfers.reason,
        transferredByMemberId: hostelRoomTransfers.transferredByMemberId,
        createdAt: hostelRoomTransfers.createdAt,
      })
      .from(hostelRoomTransfers)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve student names and room numbers
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const studentNames = await this.resolveStudentNames(studentIds);

    const allRoomIds = [
      ...new Set(rows.flatMap((r) => [r.fromRoomId, r.toRoomId])),
    ];
    const roomNumbers = await this.resolveRoomNumbers(allRoomIds);

    const enrichedRows = rows.map((row) => ({
      ...row,
      studentName: studentNames.get(row.studentId) ?? "Unknown",
      fromRoomNumber: roomNumbers.get(row.fromRoomId) ?? "Unknown",
      toRoomNumber: roomNumbers.get(row.toRoomId) ?? "Unknown",
    }));

    return { rows: enrichedRows, total, page: safePage, pageSize, pageCount };
  }

  async createRoomTransfer(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateRoomTransferDto,
  ) {
    // Find the student's current active bed allocation
    const [currentAllocation] = await this.db
      .select()
      .from(bedAllocations)
      .where(
        and(
          eq(bedAllocations.studentId, dto.studentId),
          eq(bedAllocations.institutionId, institutionId),
          eq(bedAllocations.status, BED_ALLOCATION_STATUS.ACTIVE),
        ),
      );

    if (!currentAllocation) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ALLOCATION_NOT_FOUND);
    }

    // Verify source and destination are different
    if (currentAllocation.roomId === dto.toRoomId) {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL_DEPTH.TRANSFER_SAME_ROOM,
      );
    }

    // Verify destination room exists and has capacity
    const [toRoom] = await this.db
      .select()
      .from(hostelRooms)
      .where(
        and(
          eq(hostelRooms.id, dto.toRoomId),
          eq(hostelRooms.institutionId, institutionId),
        ),
      );

    if (!toRoom) {
      throw new NotFoundException(ERROR_MESSAGES.HOSTEL.ROOM_NOT_FOUND);
    }

    if (toRoom.occupancy >= toRoom.capacity) {
      throw new BadRequestException(
        ERROR_MESSAGES.HOSTEL_DEPTH.ROOM_TRANSFER_FAILED,
      );
    }

    // Get from room for occupancy update
    const [fromRoom] = await this.db
      .select({ id: hostelRooms.id, occupancy: hostelRooms.occupancy })
      .from(hostelRooms)
      .where(eq(hostelRooms.id, currentAllocation.roomId));

    // Resolve the performing member
    const [performingMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!performingMember) {
      throw new BadRequestException("Active membership is required.");
    }

    const transferId = randomUUID();
    const newAllocationId = randomUUID();
    const today = dto.transferDate;

    // Vacate old allocation
    await this.db
      .update(bedAllocations)
      .set({ status: BED_ALLOCATION_STATUS.VACATED, endDate: today })
      .where(eq(bedAllocations.id, currentAllocation.id));

    // Create new allocation
    await this.db.insert(bedAllocations).values({
      id: newAllocationId,
      institutionId,
      roomId: dto.toRoomId,
      studentId: dto.studentId,
      bedNumber: dto.toBedNumber,
      startDate: today,
    });

    // Record transfer history
    await this.db.insert(hostelRoomTransfers).values({
      id: transferId,
      institutionId,
      studentId: dto.studentId,
      fromRoomId: currentAllocation.roomId,
      toRoomId: dto.toRoomId,
      fromBedNumber: currentAllocation.bedNumber,
      toBedNumber: dto.toBedNumber,
      transferDate: today,
      reason: dto.reason ?? null,
      transferredByMemberId: performingMember.id,
    });

    // Adjust occupancy: decrement from room, increment to room
    if (fromRoom && fromRoom.occupancy > 0) {
      await this.db
        .update(hostelRooms)
        .set({ occupancy: fromRoom.occupancy - 1 })
        .where(eq(hostelRooms.id, currentAllocation.roomId));
    }
    await this.db
      .update(hostelRooms)
      .set({ occupancy: toRoom.occupancy + 1 })
      .where(eq(hostelRooms.id, dto.toRoomId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.HOSTEL_ROOM_TRANSFER,
      entityId: transferId,
      entityLabel: `Transfer to room`,
      summary: `Transferred student from bed "${currentAllocation.bedNumber}" to bed "${dto.toBedNumber}"`,
    });

    return { id: transferId };
  }

  // ── Occupancy Dashboard ───────────────────────────────────────────────────

  async getOccupancyDashboard(institutionId: string) {
    // Building-wise occupancy
    const buildingRows = await this.db
      .select({
        buildingId: hostelBuildings.id,
        buildingName: hostelBuildings.name,
        totalCapacity: sum(hostelRooms.capacity),
        totalOccupancy: sum(hostelRooms.occupancy),
      })
      .from(hostelRooms)
      .innerJoin(
        hostelBuildings,
        eq(hostelRooms.buildingId, hostelBuildings.id),
      )
      .where(
        and(
          eq(hostelRooms.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      )
      .groupBy(hostelBuildings.id, hostelBuildings.name);

    const buildings = buildingRows.map((r) => {
      const totalCapacity = Number(r.totalCapacity) || 0;
      const totalOccupancy = Number(r.totalOccupancy) || 0;
      const availableBeds = totalCapacity - totalOccupancy;
      const occupancyPercent =
        totalCapacity > 0
          ? Math.round((totalOccupancy / totalCapacity) * 100)
          : 0;
      return {
        buildingId: r.buildingId,
        buildingName: r.buildingName,
        totalCapacity,
        totalOccupancy,
        availableBeds,
        occupancyPercent,
      };
    });

    // Floor-wise occupancy
    const floorRows = await this.db
      .select({
        buildingId: hostelBuildings.id,
        buildingName: hostelBuildings.name,
        floor: hostelRooms.floor,
        totalCapacity: sum(hostelRooms.capacity),
        totalOccupancy: sum(hostelRooms.occupancy),
      })
      .from(hostelRooms)
      .innerJoin(
        hostelBuildings,
        eq(hostelRooms.buildingId, hostelBuildings.id),
      )
      .where(
        and(
          eq(hostelRooms.institutionId, institutionId),
          ne(hostelBuildings.status, HOSTEL_BUILDING_STATUS.DELETED),
        ),
      )
      .groupBy(hostelBuildings.id, hostelBuildings.name, hostelRooms.floor);

    const floors = floorRows.map((r) => {
      const totalCapacity = Number(r.totalCapacity) || 0;
      const totalOccupancy = Number(r.totalOccupancy) || 0;
      const availableBeds = totalCapacity - totalOccupancy;
      const occupancyPercent =
        totalCapacity > 0
          ? Math.round((totalOccupancy / totalCapacity) * 100)
          : 0;
      return {
        buildingId: r.buildingId,
        buildingName: r.buildingName,
        floor: r.floor,
        totalCapacity,
        totalOccupancy,
        availableBeds,
        occupancyPercent,
      };
    });

    // Grand totals
    const totalCapacity = buildings.reduce((s, b) => s + b.totalCapacity, 0);
    const totalOccupancy = buildings.reduce((s, b) => s + b.totalOccupancy, 0);
    const totalAvailable = totalCapacity - totalOccupancy;
    const overallOccupancyPercent =
      totalCapacity > 0
        ? Math.round((totalOccupancy / totalCapacity) * 100)
        : 0;

    return {
      buildings,
      floors,
      totalCapacity,
      totalOccupancy,
      totalAvailable,
      overallOccupancyPercent,
    };
  }

  // ── Batch Allocation ──────────────────────────────────────────────────────

  async createBatchAllocation(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateBatchAllocationDto,
  ) {
    let created = 0;
    const errors: string[] = [];

    for (const item of dto.allocations) {
      try {
        await this.createAllocation(institutionId, session, {
          roomId: item.roomId,
          studentId: item.studentId,
          bedNumber: item.bedNumber,
          startDate: item.startDate,
        });
        created++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Student ${item.studentId}: ${message}`);
      }
    }

    return { created, failed: errors.length, errors };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async resolveStudentNames(
    studentIds: string[],
  ): Promise<Map<string, string>> {
    if (studentIds.length === 0) return new Map();

    const results = await this.db
      .select({
        studentId: students.id,
        memberName: user.name,
      })
      .from(students)
      .leftJoin(member, eq(students.membershipId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        sql`${students.id} IN (${sql.join(
          studentIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    const map = new Map<string, string>();
    for (const r of results) {
      map.set(r.studentId, r.memberName ?? "Unknown");
    }
    return map;
  }

  private async resolveRoomNumbers(
    roomIds: string[],
  ): Promise<Map<string, string>> {
    if (roomIds.length === 0) return new Map();

    const results = await this.db
      .select({
        id: hostelRooms.id,
        roomNumber: hostelRooms.roomNumber,
      })
      .from(hostelRooms)
      .where(
        sql`${hostelRooms.id} IN (${sql.join(
          roomIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    const map = new Map<string, string>();
    for (const r of results) {
      map.set(r.id, r.roomNumber);
    }
    return map;
  }
}
