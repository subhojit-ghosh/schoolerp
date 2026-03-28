import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  STAFF_ATTENDANCE_STATUSES,
  type StaffAttendanceStatus,
} from "@repo/contracts";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  campus,
  eq,
  gte,
  inArray,
  lte,
  member,
  ne,
  staffAttendanceRecords,
  staffProfiles,
  user,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuthService } from "../auth/auth.service";
import type {
  StaffAttendanceRosterQueryDto,
  UpsertStaffAttendanceDayDto,
  StaffAttendanceDayViewQueryDto,
  StaffAttendanceReportQueryDto,
} from "./staff-attendance.schemas";

type StaffAttendanceCounts = Record<StaffAttendanceStatus, number>;

const EMPTY_STAFF_ATTENDANCE_COUNTS: StaffAttendanceCounts = {
  [STAFF_ATTENDANCE_STATUSES.PRESENT]: 0,
  [STAFF_ATTENDANCE_STATUSES.ABSENT]: 0,
  [STAFF_ATTENDANCE_STATUSES.HALF_DAY]: 0,
  [STAFF_ATTENDANCE_STATUSES.ON_LEAVE]: 0,
};

@Injectable()
export class StaffAttendanceService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async getRoster(
    institutionId: string,
    query: StaffAttendanceRosterQueryDto,
  ) {
    const matchedCampus = await this.getCampus(institutionId, query.campusId);

    // Get all active staff members for this campus
    const staffRows = await this.db
      .select({
        membershipId: member.id,
        staffName: user.name,
        designation: staffProfiles.designation,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(staffProfiles, eq(staffProfiles.membershipId, member.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, query.campusId),
          eq(member.memberType, "staff"),
          eq(member.status, STATUS.MEMBER.ACTIVE),
        ),
      )
      .orderBy(asc(user.name));

    if (staffRows.length === 0) {
      throw new NotFoundException(
        ERROR_MESSAGES.STAFF_ATTENDANCE.NO_STAFF_FOUND,
      );
    }

    // Get existing attendance records for the date
    const membershipIds = staffRows.map((s) => s.membershipId);
    const existingRecords = await this.db
      .select({
        staffMembershipId: staffAttendanceRecords.staffMembershipId,
        status: staffAttendanceRecords.status,
        notes: staffAttendanceRecords.notes,
      })
      .from(staffAttendanceRecords)
      .where(
        and(
          eq(staffAttendanceRecords.institutionId, institutionId),
          eq(staffAttendanceRecords.attendanceDate, query.attendanceDate),
          inArray(staffAttendanceRecords.staffMembershipId, membershipIds),
        ),
      );

    const recordMap = new Map(
      existingRecords.map((r) => [
        r.staffMembershipId,
        { status: r.status, notes: r.notes },
      ]),
    );

    const roster = staffRows.map((s) => {
      const record = recordMap.get(s.membershipId);
      return {
        membershipId: s.membershipId,
        staffName: s.staffName,
        designation: s.designation,
        status: record?.status ?? null,
        notes: record?.notes ?? null,
      };
    });

    const summary = this.computeSummary(roster);

    return {
      attendanceDate: query.attendanceDate,
      campusId: matchedCampus.id,
      campusName: matchedCampus.name,
      roster,
      summary,
    };
  }

  async upsertDay(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: UpsertStaffAttendanceDayDto,
  ) {
    const matchedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );

    const membership = await this.authService.getMembershipForOrganization(
      authSession.user.id,
      institutionId,
    );

    if (!membership) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    const markingMembershipId = membership.id;

    // Verify all staff membership IDs belong to active staff in this campus
    const staffRows = await this.db
      .select({
        membershipId: member.id,
        staffName: user.name,
        designation: staffProfiles.designation,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(staffProfiles, eq(staffProfiles.membershipId, member.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, payload.campusId),
          eq(member.memberType, "staff"),
          eq(member.status, STATUS.MEMBER.ACTIVE),
        ),
      );

    if (staffRows.length === 0) {
      throw new NotFoundException(
        ERROR_MESSAGES.STAFF_ATTENDANCE.NO_STAFF_FOUND,
      );
    }

    // Verify roster matches
    const rosterIds = staffRows
      .map((s) => s.membershipId)
      .sort();
    const submittedIds = payload.entries
      .map((e) => e.staffMembershipId)
      .sort();

    if (
      rosterIds.length !== submittedIds.length ||
      rosterIds.some((id, index) => id !== submittedIds[index])
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF_ATTENDANCE.ROSTER_MISMATCH,
      );
    }

    const now = new Date();

    await this.db.transaction(async (tx) => {
      for (const entry of payload.entries) {
        await tx
          .insert(staffAttendanceRecords)
          .values({
            id: randomUUID(),
            institutionId,
            campusId: payload.campusId,
            staffMembershipId: entry.staffMembershipId,
            attendanceDate: payload.attendanceDate,
            status: entry.status,
            markedByMembershipId: markingMembershipId,
            notes: entry.notes ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              staffAttendanceRecords.institutionId,
              staffAttendanceRecords.staffMembershipId,
              staffAttendanceRecords.attendanceDate,
            ],
            set: {
              campusId: payload.campusId,
              status: entry.status,
              markedByMembershipId: markingMembershipId,
              notes: entry.notes ?? null,
              updatedAt: now,
            },
          });
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.MARK,
        entityType: AUDIT_ENTITY_TYPES.STAFF_ATTENDANCE_DAY,
        entityId: `${payload.attendanceDate}:${payload.campusId}`,
        entityLabel: `Staff attendance — ${matchedCampus.name}`,
        summary: `Marked staff attendance for ${matchedCampus.name} on ${payload.attendanceDate}.`,
        metadata: {
          attendanceDate: payload.attendanceDate,
          campusId: payload.campusId,
          totalEntries: payload.entries.length,
        },
      });
    });

    // Return the updated roster
    return this.getRoster(institutionId, {
      campusId: payload.campusId,
      attendanceDate: payload.attendanceDate,
    });
  }

  async getDayView(
    institutionId: string,
    query: StaffAttendanceDayViewQueryDto,
  ) {
    // Get all campuses for the institution
    const campuses = await this.db
      .select({
        id: campus.id,
        name: campus.name,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .orderBy(asc(campus.name));

    // Get all staff attendance records for the date
    const records = await this.db
      .select({
        campusId: staffAttendanceRecords.campusId,
        status: staffAttendanceRecords.status,
      })
      .from(staffAttendanceRecords)
      .where(
        and(
          eq(staffAttendanceRecords.institutionId, institutionId),
          eq(staffAttendanceRecords.attendanceDate, query.attendanceDate),
        ),
      );

    // Get total active staff per campus
    const staffCountRows = await this.db
      .select({
        campusId: member.primaryCampusId,
        membershipId: member.id,
      })
      .from(member)
      .innerJoin(staffProfiles, eq(staffProfiles.membershipId, member.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, "staff"),
          eq(member.status, STATUS.MEMBER.ACTIVE),
        ),
      );

    const staffCountByCampus = new Map<string, number>();
    for (const row of staffCountRows) {
      if (!row.campusId) continue;
      staffCountByCampus.set(
        row.campusId,
        (staffCountByCampus.get(row.campusId) ?? 0) + 1,
      );
    }

    // Build per-campus counts
    const recordsByCampus = new Map<string, StaffAttendanceCounts>();
    for (const row of records) {
      const current =
        recordsByCampus.get(row.campusId) ?? {
          ...EMPTY_STAFF_ATTENDANCE_COUNTS,
        };
      current[row.status as StaffAttendanceStatus] += 1;
      recordsByCampus.set(row.campusId, current);
    }

    const campusSummaries = campuses.map((c) => {
      const counts = recordsByCampus.get(c.id);
      const total = staffCountByCampus.get(c.id) ?? 0;
      return {
        campusId: c.id,
        campusName: c.name,
        present: counts?.[STAFF_ATTENDANCE_STATUSES.PRESENT] ?? 0,
        absent: counts?.[STAFF_ATTENDANCE_STATUSES.ABSENT] ?? 0,
        halfDay: counts?.[STAFF_ATTENDANCE_STATUSES.HALF_DAY] ?? 0,
        onLeave: counts?.[STAFF_ATTENDANCE_STATUSES.ON_LEAVE] ?? 0,
        total,
        marked: counts !== undefined,
      };
    });

    return {
      attendanceDate: query.attendanceDate,
      campuses: campusSummaries,
    };
  }

  async getReport(
    institutionId: string,
    query: StaffAttendanceReportQueryDto,
  ) {
    const matchedCampus = await this.getCampus(
      institutionId,
      query.campusId,
    );

    // Get all active staff for the campus
    const staffRows = await this.db
      .select({
        membershipId: member.id,
        staffName: user.name,
        designation: staffProfiles.designation,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(staffProfiles, eq(staffProfiles.membershipId, member.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, query.campusId),
          eq(member.memberType, "staff"),
          eq(member.status, STATUS.MEMBER.ACTIVE),
        ),
      )
      .orderBy(asc(user.name));

    const membershipIds = staffRows.map((s) => s.membershipId);

    // Get attendance records for the date range
    const records =
      membershipIds.length > 0
        ? await this.db
            .select({
              staffMembershipId: staffAttendanceRecords.staffMembershipId,
              status: staffAttendanceRecords.status,
            })
            .from(staffAttendanceRecords)
            .where(
              and(
                eq(staffAttendanceRecords.institutionId, institutionId),
                eq(staffAttendanceRecords.campusId, query.campusId),
                gte(staffAttendanceRecords.attendanceDate, query.fromDate),
                lte(staffAttendanceRecords.attendanceDate, query.toDate),
                inArray(
                  staffAttendanceRecords.staffMembershipId,
                  membershipIds,
                ),
              ),
            )
        : [];

    // Aggregate per staff
    const countsMap = new Map<string, StaffAttendanceCounts>();
    for (const row of records) {
      const current =
        countsMap.get(row.staffMembershipId) ?? {
          ...EMPTY_STAFF_ATTENDANCE_COUNTS,
        };
      current[row.status as StaffAttendanceStatus] += 1;
      countsMap.set(row.staffMembershipId, current);
    }

    const staff = staffRows.map((s) => {
      const counts = countsMap.get(s.membershipId) ?? {
        ...EMPTY_STAFF_ATTENDANCE_COUNTS,
      };
      const totalMarkedDays =
        counts[STAFF_ATTENDANCE_STATUSES.PRESENT] +
        counts[STAFF_ATTENDANCE_STATUSES.ABSENT] +
        counts[STAFF_ATTENDANCE_STATUSES.HALF_DAY] +
        counts[STAFF_ATTENDANCE_STATUSES.ON_LEAVE];

      return {
        membershipId: s.membershipId,
        staffName: s.staffName,
        designation: s.designation,
        present: counts[STAFF_ATTENDANCE_STATUSES.PRESENT],
        absent: counts[STAFF_ATTENDANCE_STATUSES.ABSENT],
        halfDay: counts[STAFF_ATTENDANCE_STATUSES.HALF_DAY],
        onLeave: counts[STAFF_ATTENDANCE_STATUSES.ON_LEAVE],
        totalMarkedDays,
        attendancePercent:
          totalMarkedDays === 0
            ? 0
            : Math.round(
                (counts[STAFF_ATTENDANCE_STATUSES.PRESENT] / totalMarkedDays) *
                  100,
              ),
      };
    });

    return {
      campusId: matchedCampus.id,
      campusName: matchedCampus.name,
      fromDate: query.fromDate,
      toDate: query.toDate,
      staff,
    };
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [matchedCampus] = await this.db
      .select({
        id: campus.id,
        name: campus.name,
      })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private computeSummary(
    roster: { status: string | null }[],
  ) {
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let onLeave = 0;

    for (const item of roster) {
      if (item.status === STAFF_ATTENDANCE_STATUSES.PRESENT) present += 1;
      else if (item.status === STAFF_ATTENDANCE_STATUSES.ABSENT) absent += 1;
      else if (item.status === STAFF_ATTENDANCE_STATUSES.HALF_DAY) halfDay += 1;
      else if (item.status === STAFF_ATTENDANCE_STATUSES.ON_LEAVE)
        onLeave += 1;
    }

    return {
      present,
      absent,
      halfDay,
      onLeave,
      total: roster.length,
    };
  }
}
