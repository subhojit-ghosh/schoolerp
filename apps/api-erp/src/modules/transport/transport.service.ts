import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  campus,
  count,
  desc,
  eq,
  ilike,
  isNull,
  member,
  ne,
  or,
  studentTransportAssignments,
  students,
  transportDrivers,
  transportRoutes,
  transportStops,
  transportVehicles,
  vehicleMaintenanceLogs,
  type AppDatabase,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateAssignmentDto,
  CreateDriverDto,
  CreateMaintenanceLogDto,
  CreateRouteDto,
  CreateStopDto,
  CreateVehicleDto,
  ListAssignmentsQueryDto,
  ListDriversQueryDto,
  ListMaintenanceLogsQueryDto,
  ListRouteStudentsQueryDto,
  ListRoutesQueryDto,
  ListVehiclesQueryDto,
  UpdateAssignmentDto,
  UpdateDriverDto,
  UpdateRouteDto,
  UpdateStopDto,
  UpdateVehicleDto,
} from "./transport.schemas";

@Injectable()
export class TransportService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Routes ────────────────────────────────────────────────────────────────

  async listRoutes(institutionId: string, query: ListRoutesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "name";
    const sortOrder = query.order ?? SORT_ORDERS.ASC;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;
    const sortCol =
      sortField === "createdAt"
        ? transportRoutes.createdAt
        : transportRoutes.name;

    const filters = [
      eq(transportRoutes.institutionId, institutionId),
      ...(query.status
        ? [eq(transportRoutes.status, query.status)]
        : [ne(transportRoutes.status, "inactive")]),
      ...(query.campusId ? [eq(transportRoutes.campusId, query.campusId)] : []),
      ...(query.q ? [ilike(transportRoutes.name, `%${query.q}%`)] : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(transportRoutes)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const stopCounts = await this.db
      .select({
        routeId: transportStops.routeId,
        stopCount: count(),
      })
      .from(transportStops)
      .where(eq(transportStops.institutionId, institutionId))
      .groupBy(transportStops.routeId);

    const stopCountMap = new Map(
      stopCounts.map((s) => [s.routeId, s.stopCount]),
    );

    const rows = await this.db
      .select({
        id: transportRoutes.id,
        name: transportRoutes.name,
        description: transportRoutes.description,
        campusId: transportRoutes.campusId,
        campusName: campus.name,
        status: transportRoutes.status,
        createdAt: transportRoutes.createdAt,
      })
      .from(transportRoutes)
      .leftJoin(campus, eq(transportRoutes.campusId, campus.id))
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        campusId: r.campusId ?? null,
        campusName: r.campusName ?? null,
        status: r.status,
        stopCount: stopCountMap.get(r.id) ?? 0,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getRoute(institutionId: string, routeId: string) {
    const [route] = await this.db
      .select({
        id: transportRoutes.id,
        name: transportRoutes.name,
        description: transportRoutes.description,
        campusId: transportRoutes.campusId,
        campusName: campus.name,
        status: transportRoutes.status,
        createdAt: transportRoutes.createdAt,
      })
      .from(transportRoutes)
      .leftJoin(campus, eq(transportRoutes.campusId, campus.id))
      .where(
        and(
          eq(transportRoutes.id, routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!route) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    const stops = await this.db
      .select()
      .from(transportStops)
      .where(
        and(
          eq(transportStops.routeId, routeId),
          eq(transportStops.institutionId, institutionId),
        ),
      )
      .orderBy(asc(transportStops.sequenceNumber));

    return {
      id: route.id,
      name: route.name,
      description: route.description ?? null,
      campusId: route.campusId ?? null,
      campusName: route.campusName ?? null,
      status: route.status,
      createdAt: route.createdAt.toISOString(),
      stops: stops.map((s) => ({
        id: s.id,
        routeId: s.routeId,
        name: s.name,
        sequenceNumber: s.sequenceNumber,
        pickupTime: s.pickupTime ?? null,
        dropTime: s.dropTime ?? null,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  async createRoute(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateRouteDto,
  ) {
    const id = randomUUID();

    await this.db.insert(transportRoutes).values({
      id,
      institutionId,
      name: dto.name,
      description: dto.description ?? null,
      campusId: dto.campusId ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_ROUTE,
        entityId: id,
        entityLabel: dto.name,
        summary: `Created transport route "${dto.name}"`,
      })
      .catch(() => {});

    return { id };
  }

  async updateRoute(
    institutionId: string,
    routeId: string,
    session: AuthenticatedSession,
    dto: UpdateRouteDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.id, routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    await this.db
      .update(transportRoutes)
      .set({
        name: dto.name ?? existing.name,
        description:
          dto.description !== undefined
            ? dto.description
            : existing.description,
        campusId: dto.campusId !== undefined ? dto.campusId : existing.campusId,
        status: dto.status ?? existing.status,
      })
      .where(eq(transportRoutes.id, routeId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_ROUTE,
        entityId: routeId,
        entityLabel: dto.name ?? existing.name,
        summary: `Updated transport route "${dto.name ?? existing.name}"`,
      })
      .catch(() => {});

    return { id: routeId };
  }

  // ── Stops ─────────────────────────────────────────────────────────────────

  async createStop(
    institutionId: string,
    routeId: string,
    session: AuthenticatedSession,
    dto: CreateStopDto,
  ) {
    const [route] = await this.db
      .select()
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.id, routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!route) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    // Check sequence number uniqueness
    const [existingStop] = await this.db
      .select({ id: transportStops.id })
      .from(transportStops)
      .where(
        and(
          eq(transportStops.routeId, routeId),
          eq(transportStops.sequenceNumber, dto.sequenceNumber),
        ),
      );

    if (existingStop) {
      throw new ConflictException(
        ERROR_MESSAGES.TRANSPORT.STOP_SEQUENCE_EXISTS,
      );
    }

    const id = randomUUID();

    await this.db.insert(transportStops).values({
      id,
      institutionId,
      routeId,
      name: dto.name,
      sequenceNumber: dto.sequenceNumber,
      pickupTime: dto.pickupTime ?? null,
      dropTime: dto.dropTime ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_STOP,
        entityId: id,
        entityLabel: dto.name,
        summary: `Added stop "${dto.name}" to route "${route.name}"`,
      })
      .catch(() => {});

    return { id };
  }

  async updateStop(
    institutionId: string,
    routeId: string,
    stopId: string,
    session: AuthenticatedSession,
    dto: UpdateStopDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportStops)
      .where(
        and(
          eq(transportStops.id, stopId),
          eq(transportStops.routeId, routeId),
          eq(transportStops.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.STOP_NOT_FOUND);
    }

    if (
      dto.sequenceNumber !== undefined &&
      dto.sequenceNumber !== existing.sequenceNumber
    ) {
      const [conflict] = await this.db
        .select({ id: transportStops.id })
        .from(transportStops)
        .where(
          and(
            eq(transportStops.routeId, routeId),
            eq(transportStops.sequenceNumber, dto.sequenceNumber),
          ),
        );
      if (conflict) {
        throw new ConflictException(
          ERROR_MESSAGES.TRANSPORT.STOP_SEQUENCE_EXISTS,
        );
      }
    }

    await this.db
      .update(transportStops)
      .set({
        name: dto.name ?? existing.name,
        sequenceNumber: dto.sequenceNumber ?? existing.sequenceNumber,
        pickupTime:
          dto.pickupTime !== undefined ? dto.pickupTime : existing.pickupTime,
        dropTime: dto.dropTime !== undefined ? dto.dropTime : existing.dropTime,
        status: dto.status ?? existing.status,
      })
      .where(eq(transportStops.id, stopId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_STOP,
        entityId: stopId,
        entityLabel: dto.name ?? existing.name,
        summary: `Updated stop "${dto.name ?? existing.name}"`,
      })
      .catch(() => {});

    return { id: stopId };
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  async listVehicles(institutionId: string, query: ListVehiclesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "registrationNumber";
    const sortOrder = query.order ?? SORT_ORDERS.ASC;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;
    const sortCol =
      sortField === "createdAt"
        ? transportVehicles.createdAt
        : sortField === "type"
          ? transportVehicles.type
          : transportVehicles.registrationNumber;

    const filters = [
      eq(transportVehicles.institutionId, institutionId),
      ...(query.status
        ? [eq(transportVehicles.status, query.status)]
        : [ne(transportVehicles.status, "inactive")]),
      ...(query.routeId ? [eq(transportVehicles.routeId, query.routeId)] : []),
      ...(query.q
        ? [
            or(
              ilike(transportVehicles.registrationNumber, `%${query.q}%`),
              ilike(transportVehicles.driverName, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(transportVehicles)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: transportVehicles.id,
        registrationNumber: transportVehicles.registrationNumber,
        type: transportVehicles.type,
        capacity: transportVehicles.capacity,
        driverName: transportVehicles.driverName,
        driverContact: transportVehicles.driverContact,
        routeId: transportVehicles.routeId,
        routeName: transportRoutes.name,
        status: transportVehicles.status,
        createdAt: transportVehicles.createdAt,
      })
      .from(transportVehicles)
      .leftJoin(
        transportRoutes,
        eq(transportVehicles.routeId, transportRoutes.id),
      )
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        type: v.type,
        capacity: v.capacity,
        driverName: v.driverName ?? null,
        driverContact: v.driverContact ?? null,
        routeId: v.routeId ?? null,
        routeName: v.routeName ?? null,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createVehicle(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateVehicleDto,
  ) {
    const [existing] = await this.db
      .select({ id: transportVehicles.id })
      .from(transportVehicles)
      .where(
        and(
          eq(transportVehicles.institutionId, institutionId),
          eq(transportVehicles.registrationNumber, dto.registrationNumber),
        ),
      );

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.TRANSPORT.VEHICLE_REG_EXISTS);
    }

    const id = randomUUID();

    await this.db.insert(transportVehicles).values({
      id,
      institutionId,
      registrationNumber: dto.registrationNumber,
      type: dto.type,
      capacity: dto.capacity,
      driverName: dto.driverName ?? null,
      driverContact: dto.driverContact ?? null,
      routeId: dto.routeId ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_VEHICLE,
        entityId: id,
        entityLabel: dto.registrationNumber,
        summary: `Added vehicle "${dto.registrationNumber}"`,
      })
      .catch(() => {});

    return { id };
  }

  async updateVehicle(
    institutionId: string,
    vehicleId: string,
    session: AuthenticatedSession,
    dto: UpdateVehicleDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportVehicles)
      .where(
        and(
          eq(transportVehicles.id, vehicleId),
          eq(transportVehicles.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.VEHICLE_NOT_FOUND);
    }

    if (
      dto.registrationNumber &&
      dto.registrationNumber !== existing.registrationNumber
    ) {
      const [conflict] = await this.db
        .select({ id: transportVehicles.id })
        .from(transportVehicles)
        .where(
          and(
            eq(transportVehicles.institutionId, institutionId),
            eq(transportVehicles.registrationNumber, dto.registrationNumber),
          ),
        );
      if (conflict) {
        throw new ConflictException(
          ERROR_MESSAGES.TRANSPORT.VEHICLE_REG_EXISTS,
        );
      }
    }

    await this.db
      .update(transportVehicles)
      .set({
        registrationNumber:
          dto.registrationNumber ?? existing.registrationNumber,
        type: dto.type ?? existing.type,
        capacity: dto.capacity ?? existing.capacity,
        driverName:
          dto.driverName !== undefined ? dto.driverName : existing.driverName,
        driverContact:
          dto.driverContact !== undefined
            ? dto.driverContact
            : existing.driverContact,
        routeId: dto.routeId !== undefined ? dto.routeId : existing.routeId,
        status: dto.status ?? existing.status,
      })
      .where(eq(transportVehicles.id, vehicleId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_VEHICLE,
        entityId: vehicleId,
        entityLabel: dto.registrationNumber ?? existing.registrationNumber,
        summary: `Updated vehicle "${dto.registrationNumber ?? existing.registrationNumber}"`,
      })
      .catch(() => {});

    return { id: vehicleId };
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  async listAssignments(institutionId: string, query: ListAssignmentsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "createdAt";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;
    const sortCol =
      sortField === "startDate"
        ? studentTransportAssignments.startDate
        : studentTransportAssignments.createdAt;

    const filters = [
      eq(studentTransportAssignments.institutionId, institutionId),
      ...(query.status
        ? [eq(studentTransportAssignments.status, query.status)]
        : [ne(studentTransportAssignments.status, "inactive")]),
      ...(query.routeId
        ? [eq(studentTransportAssignments.routeId, query.routeId)]
        : []),
      ...(query.stopId
        ? [eq(studentTransportAssignments.stopId, query.stopId)]
        : []),
      ...(query.studentId
        ? [eq(studentTransportAssignments.studentId, query.studentId)]
        : []),
      ...(query.q
        ? [
            or(
              ilike(students.firstName, `%${query.q}%`),
              ilike(students.lastName, `%${query.q}%`),
              ilike(students.admissionNumber, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(studentTransportAssignments)
      .innerJoin(
        students,
        eq(studentTransportAssignments.studentId, students.id),
      )
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: studentTransportAssignments.id,
        studentId: studentTransportAssignments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        routeId: studentTransportAssignments.routeId,
        routeName: transportRoutes.name,
        stopId: studentTransportAssignments.stopId,
        stopName: transportStops.name,
        assignmentType: studentTransportAssignments.assignmentType,
        startDate: studentTransportAssignments.startDate,
        endDate: studentTransportAssignments.endDate,
        status: studentTransportAssignments.status,
        createdAt: studentTransportAssignments.createdAt,
      })
      .from(studentTransportAssignments)
      .innerJoin(
        students,
        eq(studentTransportAssignments.studentId, students.id),
      )
      .innerJoin(
        transportRoutes,
        eq(studentTransportAssignments.routeId, transportRoutes.id),
      )
      .innerJoin(
        transportStops,
        eq(studentTransportAssignments.stopId, transportStops.id),
      )
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: `${r.studentFirstName} ${r.studentLastName ?? ""}`.trim(),
        admissionNumber: r.admissionNumber,
        routeId: r.routeId,
        routeName: r.routeName,
        stopId: r.stopId,
        stopName: r.stopName,
        assignmentType: r.assignmentType,
        startDate: r.startDate,
        endDate: r.endDate ?? null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createAssignment(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateAssignmentDto,
  ) {
    // Verify student belongs to institution
    const [student] = await this.db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, dto.studentId),
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
        ),
      );

    if (!student) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    // Verify route belongs to institution
    const [route] = await this.db
      .select()
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.id, dto.routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!route) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    // Verify stop belongs to route
    const [stop] = await this.db
      .select()
      .from(transportStops)
      .where(
        and(
          eq(transportStops.id, dto.stopId),
          eq(transportStops.routeId, dto.routeId),
        ),
      );

    if (!stop) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.STOP_NOT_FOUND);
    }

    // Check if student already has an active assignment
    const [activeAssignment] = await this.db
      .select({ id: studentTransportAssignments.id })
      .from(studentTransportAssignments)
      .where(
        and(
          eq(studentTransportAssignments.studentId, dto.studentId),
          eq(studentTransportAssignments.status, "active"),
        ),
      );

    if (activeAssignment) {
      throw new ConflictException(
        ERROR_MESSAGES.TRANSPORT.STUDENT_ALREADY_ASSIGNED,
      );
    }

    const id = randomUUID();
    const studentName = `${student.firstName} ${student.lastName ?? ""}`.trim();

    await this.db.insert(studentTransportAssignments).values({
      id,
      institutionId,
      studentId: dto.studentId,
      routeId: dto.routeId,
      stopId: dto.stopId,
      assignmentType: dto.assignmentType ?? "both",
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_ASSIGNMENT,
        entityId: id,
        entityLabel: studentName,
        summary: `Assigned "${studentName}" to route "${route.name}"`,
      })
      .catch(() => {});

    return { id };
  }

  async updateAssignment(
    institutionId: string,
    assignmentId: string,
    session: AuthenticatedSession,
    dto: UpdateAssignmentDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(studentTransportAssignments)
      .where(
        and(
          eq(studentTransportAssignments.id, assignmentId),
          eq(studentTransportAssignments.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRANSPORT.ASSIGNMENT_NOT_FOUND,
      );
    }

    // If changing stop, verify it belongs to the (possibly new) route
    const routeId = dto.routeId ?? existing.routeId;
    const stopId = dto.stopId ?? existing.stopId;

    if (dto.stopId && (dto.routeId || dto.stopId !== existing.stopId)) {
      const [stop] = await this.db
        .select()
        .from(transportStops)
        .where(
          and(
            eq(transportStops.id, stopId),
            eq(transportStops.routeId, routeId),
          ),
        );

      if (!stop) {
        throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.STOP_NOT_FOUND);
      }
    }

    await this.db
      .update(studentTransportAssignments)
      .set({
        routeId,
        stopId,
        assignmentType: dto.assignmentType ?? existing.assignmentType,
        startDate: dto.startDate ?? existing.startDate,
        endDate: dto.endDate !== undefined ? dto.endDate : existing.endDate,
        status: dto.status ?? existing.status,
      })
      .where(eq(studentTransportAssignments.id, assignmentId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_ASSIGNMENT,
        entityId: assignmentId,
        entityLabel: assignmentId,
        summary: `Updated transport assignment`,
      })
      .catch(() => {});

    return { id: assignmentId };
  }

  // ── Drivers ──────────────────────────────────────────────────────────────

  async listDrivers(institutionId: string, query: ListDriversQueryDto) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "name";
    const sortOrder = query.order ?? SORT_ORDERS.ASC;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;
    const sortCol =
      sortField === "createdAt"
        ? transportDrivers.createdAt
        : transportDrivers.name;

    const filters = [
      eq(transportDrivers.institutionId, institutionId),
      ...(query.status
        ? [eq(transportDrivers.status, query.status)]
        : [ne(transportDrivers.status, "inactive")]),
      ...(query.q
        ? [
            or(
              ilike(transportDrivers.name, `%${query.q}%`),
              ilike(transportDrivers.mobile, `%${query.q}%`),
              ilike(transportDrivers.licenseNumber, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(transportDrivers)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    // Count vehicles per driver
    const vehicleCounts = await this.db
      .select({
        driverId: transportVehicles.driverId,
        vehicleCount: count(),
      })
      .from(transportVehicles)
      .where(eq(transportVehicles.institutionId, institutionId))
      .groupBy(transportVehicles.driverId);

    const vehicleCountMap = new Map(
      vehicleCounts
        .filter((v) => v.driverId !== null)
        .map((v) => [v.driverId, v.vehicleCount]),
    );

    const rows = await this.db
      .select()
      .from(transportDrivers)
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((d) => ({
        id: d.id,
        name: d.name,
        mobile: d.mobile,
        licenseNumber: d.licenseNumber ?? null,
        licenseExpiry: d.licenseExpiry ?? null,
        address: d.address ?? null,
        emergencyContact: d.emergencyContact ?? null,
        status: d.status,
        vehicleCount: vehicleCountMap.get(d.id) ?? 0,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getDriver(institutionId: string, driverId: string) {
    const [driver] = await this.db
      .select()
      .from(transportDrivers)
      .where(
        and(
          eq(transportDrivers.id, driverId),
          eq(transportDrivers.institutionId, institutionId),
        ),
      );

    if (!driver) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRANSPORT_DEPTH.DRIVER_NOT_FOUND,
      );
    }

    return {
      id: driver.id,
      name: driver.name,
      mobile: driver.mobile,
      licenseNumber: driver.licenseNumber ?? null,
      licenseExpiry: driver.licenseExpiry ?? null,
      address: driver.address ?? null,
      emergencyContact: driver.emergencyContact ?? null,
      status: driver.status,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    };
  }

  async createDriver(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateDriverDto,
  ) {
    const id = randomUUID();

    await this.db.insert(transportDrivers).values({
      id,
      institutionId,
      name: dto.name,
      mobile: dto.mobile,
      licenseNumber: dto.licenseNumber ?? null,
      licenseExpiry: dto.licenseExpiry ?? null,
      address: dto.address ?? null,
      emergencyContact: dto.emergencyContact ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_DRIVER,
        entityId: id,
        entityLabel: dto.name,
        summary: `Created transport driver "${dto.name}"`,
      })
      .catch(() => {});

    return { id };
  }

  async updateDriver(
    institutionId: string,
    driverId: string,
    session: AuthenticatedSession,
    dto: UpdateDriverDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportDrivers)
      .where(
        and(
          eq(transportDrivers.id, driverId),
          eq(transportDrivers.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRANSPORT_DEPTH.DRIVER_NOT_FOUND,
      );
    }

    // If deactivating, check for active vehicles assigned to this driver
    if (dto.status === "inactive" && existing.status === "active") {
      const [activeVehicle] = await this.db
        .select({ id: transportVehicles.id })
        .from(transportVehicles)
        .where(
          and(
            eq(transportVehicles.driverId, driverId),
            eq(transportVehicles.status, "active"),
          ),
        );

      if (activeVehicle) {
        throw new ConflictException(
          ERROR_MESSAGES.TRANSPORT_DEPTH.DRIVER_HAS_VEHICLES,
        );
      }
    }

    await this.db
      .update(transportDrivers)
      .set({
        name: dto.name ?? existing.name,
        mobile: dto.mobile ?? existing.mobile,
        licenseNumber:
          dto.licenseNumber !== undefined
            ? dto.licenseNumber
            : existing.licenseNumber,
        licenseExpiry:
          dto.licenseExpiry !== undefined
            ? dto.licenseExpiry
            : existing.licenseExpiry,
        address: dto.address !== undefined ? dto.address : existing.address,
        emergencyContact:
          dto.emergencyContact !== undefined
            ? dto.emergencyContact
            : existing.emergencyContact,
        status: dto.status ?? existing.status,
      })
      .where(eq(transportDrivers.id, driverId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_DRIVER,
        entityId: driverId,
        entityLabel: dto.name ?? existing.name,
        summary: `Updated transport driver "${dto.name ?? existing.name}"`,
      })
      .catch(() => {});

    return { id: driverId };
  }

  // ── Maintenance Logs ─────────────────────────────────────────────────────

  async listMaintenanceLogs(
    institutionId: string,
    query: ListMaintenanceLogsQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "maintenanceDate";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;
    const sortCol =
      sortField === "createdAt"
        ? vehicleMaintenanceLogs.createdAt
        : vehicleMaintenanceLogs.maintenanceDate;

    const filters = [
      eq(vehicleMaintenanceLogs.institutionId, institutionId),
      ...(query.vehicleId
        ? [eq(vehicleMaintenanceLogs.vehicleId, query.vehicleId)]
        : []),
      ...(query.maintenanceType
        ? [eq(vehicleMaintenanceLogs.maintenanceType, query.maintenanceType)]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(vehicleMaintenanceLogs)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: vehicleMaintenanceLogs.id,
        vehicleId: vehicleMaintenanceLogs.vehicleId,
        vehicleRegistrationNumber: transportVehicles.registrationNumber,
        maintenanceType: vehicleMaintenanceLogs.maintenanceType,
        description: vehicleMaintenanceLogs.description,
        costInPaise: vehicleMaintenanceLogs.costInPaise,
        maintenanceDate: vehicleMaintenanceLogs.maintenanceDate,
        nextDueDate: vehicleMaintenanceLogs.nextDueDate,
        vendorName: vehicleMaintenanceLogs.vendorName,
        createdByMemberId: vehicleMaintenanceLogs.createdByMemberId,
        createdAt: vehicleMaintenanceLogs.createdAt,
      })
      .from(vehicleMaintenanceLogs)
      .innerJoin(
        transportVehicles,
        eq(vehicleMaintenanceLogs.vehicleId, transportVehicles.id),
      )
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        vehicleId: r.vehicleId,
        vehicleRegistrationNumber: r.vehicleRegistrationNumber,
        maintenanceType: r.maintenanceType,
        description: r.description,
        costInPaise: r.costInPaise ?? null,
        maintenanceDate: r.maintenanceDate,
        nextDueDate: r.nextDueDate ?? null,
        vendorName: r.vendorName ?? null,
        createdByMemberId: r.createdByMemberId,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createMaintenanceLog(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateMaintenanceLogDto,
  ) {
    // Verify vehicle belongs to institution
    const [vehicle] = await this.db
      .select()
      .from(transportVehicles)
      .where(
        and(
          eq(transportVehicles.id, dto.vehicleId),
          eq(transportVehicles.institutionId, institutionId),
        ),
      );

    if (!vehicle) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.VEHICLE_NOT_FOUND);
    }

    // Look up the current user's membership to use as createdByMemberId
    const [createdByMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!createdByMember) {
      throw new BadRequestException("Active membership is required.");
    }

    const id = randomUUID();

    await this.db.insert(vehicleMaintenanceLogs).values({
      id,
      institutionId,
      vehicleId: dto.vehicleId,
      maintenanceType: dto.maintenanceType,
      description: dto.description,
      costInPaise: dto.costInPaise ?? null,
      maintenanceDate: dto.maintenanceDate,
      nextDueDate: dto.nextDueDate ?? null,
      vendorName: dto.vendorName ?? null,
      createdByMemberId: createdByMember.id,
    });

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_MAINTENANCE,
        entityId: id,
        entityLabel: vehicle.registrationNumber,
        summary: `Logged ${dto.maintenanceType} maintenance for vehicle "${vehicle.registrationNumber}"`,
      })
      .catch(() => {});

    return { id };
  }

  // ── Route Students Report ────────────────────────────────────────────────

  async listRouteStudents(
    institutionId: string,
    routeId: string,
    query: ListRouteStudentsQueryDto,
  ) {
    const [route] = await this.db
      .select({ id: transportRoutes.id, name: transportRoutes.name })
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.id, routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!route) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);

    const filters = [
      eq(studentTransportAssignments.routeId, routeId),
      eq(studentTransportAssignments.institutionId, institutionId),
      eq(studentTransportAssignments.status, "active"),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(studentTransportAssignments)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        studentId: studentTransportAssignments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        stopId: studentTransportAssignments.stopId,
        stopName: transportStops.name,
        sequenceNumber: transportStops.sequenceNumber,
        assignmentType: studentTransportAssignments.assignmentType,
        startDate: studentTransportAssignments.startDate,
        endDate: studentTransportAssignments.endDate,
      })
      .from(studentTransportAssignments)
      .innerJoin(
        students,
        eq(studentTransportAssignments.studentId, students.id),
      )
      .innerJoin(
        transportStops,
        eq(studentTransportAssignments.stopId, transportStops.id),
      )
      .where(and(...filters))
      .orderBy(asc(transportStops.sequenceNumber))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      routeId: route.id,
      routeName: route.name,
      rows: rows.map((r) => ({
        studentId: r.studentId,
        studentName: `${r.studentFirstName} ${r.studentLastName ?? ""}`.trim(),
        admissionNumber: r.admissionNumber,
        stopId: r.stopId,
        stopName: r.stopName,
        sequenceNumber: r.sequenceNumber,
        assignmentType: r.assignmentType,
        startDate: r.startDate,
        endDate: r.endDate ?? null,
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  // ── Deactivate Route (with dependency checks) ───────────────────────────

  async deactivateRoute(
    institutionId: string,
    routeId: string,
    session: AuthenticatedSession,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportRoutes)
      .where(
        and(
          eq(transportRoutes.id, routeId),
          eq(transportRoutes.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ROUTE_NOT_FOUND);
    }

    // Check for active student assignments
    const [activeAssignment] = await this.db
      .select({ id: studentTransportAssignments.id })
      .from(studentTransportAssignments)
      .where(
        and(
          eq(studentTransportAssignments.routeId, routeId),
          eq(studentTransportAssignments.status, "active"),
        ),
      );

    if (activeAssignment) {
      throw new ConflictException(
        ERROR_MESSAGES.TRANSPORT.ROUTE_HAS_ACTIVE_ASSIGNMENTS,
      );
    }

    // Check for active vehicles
    const [activeVehicle] = await this.db
      .select({ id: transportVehicles.id })
      .from(transportVehicles)
      .where(
        and(
          eq(transportVehicles.routeId, routeId),
          eq(transportVehicles.status, "active"),
        ),
      );

    if (activeVehicle) {
      throw new ConflictException(
        ERROR_MESSAGES.TRANSPORT.ROUTE_HAS_ACTIVE_VEHICLES,
      );
    }

    await this.db
      .update(transportRoutes)
      .set({ status: "inactive" })
      .where(eq(transportRoutes.id, routeId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_ROUTE,
        entityId: routeId,
        entityLabel: existing.name,
        summary: `Deactivated transport route "${existing.name}"`,
      })
      .catch(() => {});

    return { id: routeId };
  }

  // ── Deactivate Vehicle (with dependency checks) ─────────────────────────

  async deactivateVehicle(
    institutionId: string,
    vehicleId: string,
    session: AuthenticatedSession,
  ) {
    const [existing] = await this.db
      .select()
      .from(transportVehicles)
      .where(
        and(
          eq(transportVehicles.id, vehicleId),
          eq(transportVehicles.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.VEHICLE_NOT_FOUND);
    }

    // If vehicle is assigned to a route, check for active student assignments on that route
    if (existing.routeId) {
      const [activeAssignment] = await this.db
        .select({ id: studentTransportAssignments.id })
        .from(studentTransportAssignments)
        .where(
          and(
            eq(studentTransportAssignments.routeId, existing.routeId),
            eq(studentTransportAssignments.status, "active"),
          ),
        );

      if (activeAssignment) {
        throw new ConflictException(
          ERROR_MESSAGES.TRANSPORT.VEHICLE_HAS_ACTIVE_ASSIGNMENTS,
        );
      }
    }

    await this.db
      .update(transportVehicles)
      .set({ status: "inactive" })
      .where(eq(transportVehicles.id, vehicleId));

    this.auditService
      .record({
        institutionId,
        authSession: session,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TRANSPORT_VEHICLE,
        entityId: vehicleId,
        entityLabel: existing.registrationNumber,
        summary: `Deactivated vehicle "${existing.registrationNumber}"`,
      })
      .catch(() => {});

    return { id: vehicleId };
  }
}
