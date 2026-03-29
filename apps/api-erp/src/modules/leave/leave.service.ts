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
  calendarEvents,
  count,
  desc,
  eq,
  gte,
  ilike,
  leaveApplications,
  leaveBalances,
  leaveTypes,
  lte,
  member,
  or,
  staffProfiles,
  type AppDatabase,
  user,
  alias,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateLeaveApplicationDto,
  CreateLeaveTypeDto,
  ListLeaveApplicationsQueryDto,
  ListLeaveBalancesQueryDto,
  ReviewLeaveApplicationDto,
  UpdateLeaveTypeDto,
} from "./leave.schemas";

const reviewedByUser = alias(user, "reviewed_by_user");
const reviewedByMember = alias(member, "reviewed_by_member");
const staffUser = alias(user, "staff_user");

const appSortColumns = {
  fromDate: leaveApplications.fromDate,
  createdAt: leaveApplications.createdAt,
  status: leaveApplications.status,
} as const;

@Injectable()
export class LeaveService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Leave Types ──────────────────────────────────────────────────────────

  async listLeaveTypes(institutionId: string, status?: "active" | "inactive") {
    const conditions = [eq(leaveTypes.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(leaveTypes.status, status));
    }

    const rows = await this.db
      .select()
      .from(leaveTypes)
      .where(and(...conditions))
      .orderBy(asc(leaveTypes.name));

    return rows.map((lt) => ({
      id: lt.id,
      name: lt.name,
      maxDaysPerYear: lt.maxDaysPerYear,
      isPaid: lt.isPaid,
      carryForwardDays: lt.carryForwardDays,
      isHalfDayAllowed: lt.isHalfDayAllowed,
      leaveCategory: lt.leaveCategory,
      status: lt.status,
      createdAt: lt.createdAt.toISOString(),
    }));
  }

  async createLeaveType(
    institutionId: string,
    authSession: AuthenticatedSession,
    dto: CreateLeaveTypeDto,
  ) {
    const id = randomUUID();

    await this.db.insert(leaveTypes).values({
      id,
      institutionId,
      name: dto.name,
      maxDaysPerYear: dto.maxDaysPerYear ?? null,
      isPaid: dto.isPaid ?? true,
      carryForwardDays: dto.carryForwardDays ?? 0,
      isHalfDayAllowed: dto.isHalfDayAllowed ?? false,
      leaveCategory: dto.leaveCategory ?? "other",
      status: "active",
    });

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_TYPE,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created leave type "${dto.name}"`,
    });

    return { id };
  }

  async updateLeaveType(
    institutionId: string,
    leaveTypeId: string,
    authSession: AuthenticatedSession,
    dto: UpdateLeaveTypeDto,
  ) {
    const existing = await this.db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, leaveTypeId),
          eq(leaveTypes.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.TYPE_NOT_FOUND);
    }

    const updatedName = dto.name ?? existing.name;

    await this.db
      .update(leaveTypes)
      .set({
        name: updatedName,
        maxDaysPerYear:
          dto.maxDaysPerYear !== undefined
            ? dto.maxDaysPerYear
            : existing.maxDaysPerYear,
        isPaid: dto.isPaid ?? existing.isPaid,
        carryForwardDays: dto.carryForwardDays ?? existing.carryForwardDays,
        isHalfDayAllowed: dto.isHalfDayAllowed ?? existing.isHalfDayAllowed,
        leaveCategory: dto.leaveCategory ?? existing.leaveCategory,
        status: dto.status ?? existing.status,
      })
      .where(eq(leaveTypes.id, leaveTypeId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_TYPE,
      entityId: leaveTypeId,
      entityLabel: updatedName,
      summary: `Updated leave type "${updatedName}"`,
    });

    return { id: leaveTypeId };
  }

  // ── Leave Applications ───────────────────────────────────────────────────

  async listLeaveApplications(
    institutionId: string,
    query: ListLeaveApplicationsQueryDto,
  ) {
    const {
      q,
      staffMemberId,
      leaveTypeId,
      status,
      from,
      to,
      page,
      limit,
      sort,
      order,
    } = query;

    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = appSortColumns[sort ?? "fromDate"];

    const conditions = [eq(leaveApplications.institutionId, institutionId)];

    if (staffMemberId) {
      conditions.push(eq(leaveApplications.staffMemberId, staffMemberId));
    }
    if (leaveTypeId) {
      conditions.push(eq(leaveApplications.leaveTypeId, leaveTypeId));
    }
    if (status) {
      conditions.push(eq(leaveApplications.status, status));
    }
    if (from) {
      conditions.push(gte(leaveApplications.fromDate, from));
    }
    if (to) {
      conditions.push(lte(leaveApplications.toDate, to));
    }
    if (q) {
      conditions.push(
        or(ilike(staffUser.name, `%${q}%`), ilike(leaveTypes.name, `%${q}%`))!,
      );
    }

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select({
          id: leaveApplications.id,
          leaveTypeId: leaveApplications.leaveTypeId,
          leaveTypeName: leaveTypes.name,
          staffMemberId: leaveApplications.staffMemberId,
          staffName: staffUser.name,
          staffEmployeeId: staffProfiles.employeeId,
          fromDate: leaveApplications.fromDate,
          toDate: leaveApplications.toDate,
          daysCount: leaveApplications.daysCount,
          isHalfDay: leaveApplications.isHalfDay,
          reason: leaveApplications.reason,
          status: leaveApplications.status,
          reviewedByName: reviewedByUser.name,
          reviewedAt: leaveApplications.reviewedAt,
          reviewNote: leaveApplications.reviewNote,
          createdAt: leaveApplications.createdAt,
        })
        .from(leaveApplications)
        .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
        .innerJoin(member, eq(leaveApplications.staffMemberId, member.id))
        .innerJoin(staffUser, eq(member.userId, staffUser.id))
        .leftJoin(
          staffProfiles,
          eq(staffProfiles.membershipId, leaveApplications.staffMemberId),
        )
        .leftJoin(
          reviewedByMember,
          eq(leaveApplications.reviewedByMemberId, reviewedByMember.id),
        )
        .leftJoin(
          reviewedByUser,
          eq(reviewedByMember.userId, reviewedByUser.id),
        )
        .where(whereClause)
        .orderBy(orderFn(sortCol)),
      this.db
        .select({ count: count() })
        .from(leaveApplications)
        .innerJoin(member, eq(leaveApplications.staffMemberId, member.id))
        .innerJoin(staffUser, eq(member.userId, staffUser.id))
        .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);

    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        ...r,
        staffEmployeeId: r.staffEmployeeId ?? null,
        reviewedByName: r.reviewedByName ?? null,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getLeaveApplication(institutionId: string, applicationId: string) {
    const rows = await this.db
      .select({
        id: leaveApplications.id,
        leaveTypeId: leaveApplications.leaveTypeId,
        leaveTypeName: leaveTypes.name,
        staffMemberId: leaveApplications.staffMemberId,
        staffName: staffUser.name,
        staffEmployeeId: staffProfiles.employeeId,
        fromDate: leaveApplications.fromDate,
        toDate: leaveApplications.toDate,
        daysCount: leaveApplications.daysCount,
        reason: leaveApplications.reason,
        status: leaveApplications.status,
        reviewedByName: reviewedByUser.name,
        reviewedAt: leaveApplications.reviewedAt,
        reviewNote: leaveApplications.reviewNote,
        createdAt: leaveApplications.createdAt,
      })
      .from(leaveApplications)
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .innerJoin(member, eq(leaveApplications.staffMemberId, member.id))
      .innerJoin(staffUser, eq(member.userId, staffUser.id))
      .leftJoin(
        staffProfiles,
        eq(staffProfiles.membershipId, leaveApplications.staffMemberId),
      )
      .leftJoin(
        reviewedByMember,
        eq(leaveApplications.reviewedByMemberId, reviewedByMember.id),
      )
      .leftJoin(reviewedByUser, eq(reviewedByMember.userId, reviewedByUser.id))
      .where(
        and(
          eq(leaveApplications.id, applicationId),
          eq(leaveApplications.institutionId, institutionId),
        ),
      );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.APPLICATION_NOT_FOUND);
    }

    return {
      ...row,
      staffEmployeeId: row.staffEmployeeId ?? null,
      reviewedByName: row.reviewedByName ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async applyLeave(
    institutionId: string,
    authSession: AuthenticatedSession,
    dto: CreateLeaveApplicationDto,
  ) {
    const leaveType = await this.db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, dto.leaveTypeId),
          eq(leaveTypes.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!leaveType) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.TYPE_NOT_FOUND);
    }
    if (leaveType.status === "inactive") {
      throw new BadRequestException(ERROR_MESSAGES.LEAVE.TYPE_INACTIVE);
    }

    const isHalfDay = dto.isHalfDay ?? false;
    if (isHalfDay && !leaveType.isHalfDayAllowed) {
      throw new BadRequestException(
        "Half-day leave is not allowed for this leave type.",
      );
    }

    const staffMember = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, authSession.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!staffMember) {
      throw new NotFoundException("Staff member not found.");
    }

    const holidays = await this.getHolidayDates(
      institutionId,
      dto.fromDate,
      dto.toDate,
    );
    const daysCount = isHalfDay
      ? 0.5
      : this.calcWorkingDays(dto.fromDate, dto.toDate, holidays);

    const id = randomUUID();

    await this.db.insert(leaveApplications).values({
      id,
      institutionId,
      staffMemberId: staffMember.id,
      leaveTypeId: dto.leaveTypeId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      daysCount: Math.ceil(daysCount),
      isHalfDay,
      reason: dto.reason ?? null,
      status: "pending",
    });

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_APPLICATION,
      entityId: id,
      entityLabel: leaveType.name,
      summary: `Applied for ${leaveType.name} (${dto.fromDate} to ${dto.toDate})`,
    });

    return { id };
  }

  async applyLeaveForStaff(
    institutionId: string,
    authSession: AuthenticatedSession,
    staffMemberId: string,
    dto: CreateLeaveApplicationDto,
  ) {
    const leaveType = await this.db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, dto.leaveTypeId),
          eq(leaveTypes.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!leaveType) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.TYPE_NOT_FOUND);
    }

    const staffMember = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.id, staffMemberId),
          eq(member.organizationId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!staffMember) {
      throw new NotFoundException("Staff member not found.");
    }

    const isHalfDay = dto.isHalfDay ?? false;
    const holidays = await this.getHolidayDates(
      institutionId,
      dto.fromDate,
      dto.toDate,
    );
    const daysCount = isHalfDay
      ? 0.5
      : this.calcWorkingDays(dto.fromDate, dto.toDate, holidays);
    const id = randomUUID();

    await this.db.insert(leaveApplications).values({
      id,
      institutionId,
      staffMemberId,
      leaveTypeId: dto.leaveTypeId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      daysCount: Math.ceil(daysCount),
      isHalfDay,
      reason: dto.reason ?? null,
      status: "pending",
    });

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_APPLICATION,
      entityId: id,
      entityLabel: leaveType.name,
      summary: `Applied ${leaveType.name} for staff member (${dto.fromDate} to ${dto.toDate})`,
    });

    return { id };
  }

  async reviewLeaveApplication(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    dto: ReviewLeaveApplicationDto,
  ) {
    const existing = await this.db
      .select()
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.id, applicationId),
          eq(leaveApplications.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.APPLICATION_NOT_FOUND);
    }
    if (existing.status !== "pending") {
      throw new ConflictException(ERROR_MESSAGES.LEAVE.ALREADY_REVIEWED);
    }

    const reviewerMember = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, authSession.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    await this.db
      .update(leaveApplications)
      .set({
        status: dto.status,
        reviewedByMemberId: reviewerMember?.id ?? null,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote ?? null,
      })
      .where(eq(leaveApplications.id, applicationId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_APPLICATION,
      entityId: applicationId,
      summary: `Leave application ${dto.status}`,
    });

    return { id: applicationId };
  }

  async cancelLeaveApplication(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
  ) {
    const existing = await this.db
      .select()
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.id, applicationId),
          eq(leaveApplications.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.LEAVE.APPLICATION_NOT_FOUND);
    }
    if (existing.status === "cancelled") {
      throw new ConflictException(ERROR_MESSAGES.LEAVE.ALREADY_CANCELLED);
    }

    await this.db
      .update(leaveApplications)
      .set({ status: "cancelled" })
      .where(eq(leaveApplications.id, applicationId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_APPLICATION,
      entityId: applicationId,
      summary: `Leave application cancelled`,
    });

    return { id: applicationId };
  }

  // ── Leave Balances ───────────────────────────────────────────────────────

  async listLeaveBalances(
    institutionId: string,
    query: ListLeaveBalancesQueryDto,
  ) {
    const conditions = [eq(leaveBalances.institutionId, institutionId)];

    if (query.staffMemberId) {
      conditions.push(eq(leaveBalances.staffMemberId, query.staffMemberId));
    }
    if (query.academicYearId) {
      conditions.push(eq(leaveBalances.academicYearId, query.academicYearId));
    }

    const rows = await this.db
      .select({
        id: leaveBalances.id,
        staffMemberId: leaveBalances.staffMemberId,
        staffName: staffUser.name,
        leaveTypeId: leaveBalances.leaveTypeId,
        leaveTypeName: leaveTypes.name,
        academicYearId: leaveBalances.academicYearId,
        allocated: leaveBalances.allocated,
        used: leaveBalances.used,
        carriedForward: leaveBalances.carriedForward,
      })
      .from(leaveBalances)
      .innerJoin(member, eq(leaveBalances.staffMemberId, member.id))
      .innerJoin(staffUser, eq(member.userId, staffUser.id))
      .innerJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
      .where(and(...conditions))
      .orderBy(asc(staffUser.name), asc(leaveTypes.name));

    return rows.map((r) => ({
      ...r,
      remaining: r.allocated + r.carriedForward - r.used,
    }));
  }

  async allocateLeaveBalances(
    institutionId: string,
    academicYearId: string,
    authSession: AuthenticatedSession,
  ) {
    // Get all active leave types with maxDaysPerYear set
    const activeTypes = await this.db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.institutionId, institutionId),
          eq(leaveTypes.status, "active"),
        ),
      );

    // Get all active staff members
    const staffMembers = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, "staff"),
          eq(member.status, "active"),
        ),
      );

    let created = 0;
    for (const staffMember of staffMembers) {
      for (const lt of activeTypes) {
        if (!lt.maxDaysPerYear) continue;

        // Check if balance already exists
        const existing = await this.db
          .select({ id: leaveBalances.id })
          .from(leaveBalances)
          .where(
            and(
              eq(leaveBalances.staffMemberId, staffMember.id),
              eq(leaveBalances.leaveTypeId, lt.id),
              eq(leaveBalances.academicYearId, academicYearId),
            ),
          )
          .then((rows) => rows[0]);

        if (existing) continue;

        await this.db.insert(leaveBalances).values({
          id: randomUUID(),
          institutionId,
          staffMemberId: staffMember.id,
          leaveTypeId: lt.id,
          academicYearId,
          allocated: lt.maxDaysPerYear,
          used: 0,
          carriedForward: 0,
        });
        created++;
      }
    }

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LEAVE_TYPE,
      entityId: academicYearId,
      summary: `Allocated leave balances for ${created} staff-type combinations`,
    });

    return { created };
  }

  // ── Team Leave Calendar ──────────────────────────────────────────────────

  async getTeamLeaveCalendar(institutionId: string, from: string, to: string) {
    const rows = await this.db
      .select({
        id: leaveApplications.id,
        staffMemberId: leaveApplications.staffMemberId,
        staffName: staffUser.name,
        leaveTypeName: leaveTypes.name,
        fromDate: leaveApplications.fromDate,
        toDate: leaveApplications.toDate,
        daysCount: leaveApplications.daysCount,
        isHalfDay: leaveApplications.isHalfDay,
        status: leaveApplications.status,
      })
      .from(leaveApplications)
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .innerJoin(member, eq(leaveApplications.staffMemberId, member.id))
      .innerJoin(staffUser, eq(member.userId, staffUser.id))
      .where(
        and(
          eq(leaveApplications.institutionId, institutionId),
          eq(leaveApplications.status, "approved"),
          lte(leaveApplications.fromDate, to),
          gte(leaveApplications.toDate, from),
        ),
      )
      .orderBy(asc(leaveApplications.fromDate));

    return rows;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async getHolidayDates(
    institutionId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Set<string>> {
    const holidays = await this.db
      .select({
        eventDate: calendarEvents.eventDate,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.institutionId, institutionId),
          eq(calendarEvents.eventType, "holiday"),
          eq(calendarEvents.status, "active"),
          gte(calendarEvents.eventDate, fromDate),
          lte(calendarEvents.eventDate, toDate),
        ),
      );

    return new Set(holidays.map((h) => h.eventDate));
  }

  private calcWorkingDays(
    fromDate: string,
    toDate: string,
    holidays: Set<string>,
  ): number {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let count = 0;
    const cursor = new Date(from);
    while (cursor <= to) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (!holidays.has(dateStr)) {
        count++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  private calcDaysCount(fromDate: string, toDate: string): number {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return (
      Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }
}
