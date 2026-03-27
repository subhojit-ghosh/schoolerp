import {
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
  ne,
  or,
  studentTransportAssignments,
  students,
  transportRoutes,
  transportStops,
  transportVehicles,
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
  CreateRouteDto,
  CreateStopDto,
  CreateVehicleDto,
  ListAssignmentsQueryDto,
  ListRoutesQueryDto,
  ListVehiclesQueryDto,
  UpdateAssignmentDto,
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
    const sortCol = sortField === "createdAt" ? transportRoutes.createdAt : transportRoutes.name;

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

    const stopCountMap = new Map(stopCounts.map((s) => [s.routeId, s.stopCount]));

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
        status: r.status as "active" | "inactive",
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
      status: route.status as "active" | "inactive",
      createdAt: route.createdAt.toISOString(),
      stops: stops.map((s) => ({
        id: s.id,
        routeId: s.routeId,
        name: s.name,
        sequenceNumber: s.sequenceNumber,
        pickupTime: s.pickupTime ?? null,
        dropTime: s.dropTime ?? null,
        status: s.status as "active" | "inactive",
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
        description: dto.description !== undefined ? dto.description : existing.description,
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
      throw new ConflictException(ERROR_MESSAGES.TRANSPORT.STOP_SEQUENCE_EXISTS);
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

    if (dto.sequenceNumber !== undefined && dto.sequenceNumber !== existing.sequenceNumber) {
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
        throw new ConflictException(ERROR_MESSAGES.TRANSPORT.STOP_SEQUENCE_EXISTS);
      }
    }

    await this.db
      .update(transportStops)
      .set({
        name: dto.name ?? existing.name,
        sequenceNumber: dto.sequenceNumber ?? existing.sequenceNumber,
        pickupTime: dto.pickupTime !== undefined ? dto.pickupTime : existing.pickupTime,
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
      .leftJoin(transportRoutes, eq(transportVehicles.routeId, transportRoutes.id))
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        type: v.type as "bus" | "van" | "auto",
        capacity: v.capacity,
        driverName: v.driverName ?? null,
        driverContact: v.driverContact ?? null,
        routeId: v.routeId ?? null,
        routeName: v.routeName ?? null,
        status: v.status as "active" | "inactive",
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
        throw new ConflictException(ERROR_MESSAGES.TRANSPORT.VEHICLE_REG_EXISTS);
      }
    }

    await this.db
      .update(transportVehicles)
      .set({
        registrationNumber: dto.registrationNumber ?? existing.registrationNumber,
        type: dto.type ?? existing.type,
        capacity: dto.capacity ?? existing.capacity,
        driverName: dto.driverName !== undefined ? dto.driverName : existing.driverName,
        driverContact:
          dto.driverContact !== undefined ? dto.driverContact : existing.driverContact,
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
      ...(query.routeId ? [eq(studentTransportAssignments.routeId, query.routeId)] : []),
      ...(query.stopId ? [eq(studentTransportAssignments.stopId, query.stopId)] : []),
      ...(query.studentId ? [eq(studentTransportAssignments.studentId, query.studentId)] : []),
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
      .innerJoin(students, eq(studentTransportAssignments.studentId, students.id))
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
      .innerJoin(students, eq(studentTransportAssignments.studentId, students.id))
      .innerJoin(transportRoutes, eq(studentTransportAssignments.routeId, transportRoutes.id))
      .innerJoin(transportStops, eq(studentTransportAssignments.stopId, transportStops.id))
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
        assignmentType: r.assignmentType as "pickup" | "dropoff" | "both",
        startDate: r.startDate,
        endDate: r.endDate ?? null,
        status: r.status as "active" | "inactive",
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
      throw new ConflictException(ERROR_MESSAGES.TRANSPORT.STUDENT_ALREADY_ASSIGNED);
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
      throw new NotFoundException(ERROR_MESSAGES.TRANSPORT.ASSIGNMENT_NOT_FOUND);
    }

    // If changing stop, verify it belongs to the (possibly new) route
    const routeId = dto.routeId ?? existing.routeId;
    const stopId = dto.stopId ?? existing.stopId;

    if (dto.stopId && (dto.routeId || dto.stopId !== existing.stopId)) {
      const [stop] = await this.db
        .select()
        .from(transportStops)
        .where(and(eq(transportStops.id, stopId), eq(transportStops.routeId, routeId)));

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
}
