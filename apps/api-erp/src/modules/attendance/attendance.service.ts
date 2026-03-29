import { DATABASE } from "@repo/backend-core";
import {
  ATTENDANCE_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  type AttendanceStatus,
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
  attendanceRecords,
  calendarEvents,
  campus,
  classSections,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  member,
  ne,
  or,
  schoolClasses,
  students,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import { NotificationFactory } from "../communications/notification.factory";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { AuthService } from "../auth/auth.service";
import type {
  AttendanceDayQueryDto,
  AttendanceDayViewQueryDto,
  AttendanceOverviewQueryDto,
  AttendanceClassReportQueryDto,
  AttendanceStudentReportQueryDto,
  MonthlyRegisterQueryDto,
  ConsolidatedReportQueryDto,
  ChronicAbsenteesQueryDto,
  UpsertAttendanceDayDto,
} from "./attendance.schemas";

type AttendanceRosterStudent = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  campusId: string;
  campusName: string;
  classId: string;
  sectionId: string;
};

type AttendanceCounts = Record<AttendanceStatus, number>;

const EMPTY_ATTENDANCE_COUNTS: AttendanceCounts = {
  [ATTENDANCE_STATUSES.PRESENT]: 0,
  [ATTENDANCE_STATUSES.ABSENT]: 0,
  [ATTENDANCE_STATUSES.LATE]: 0,
  [ATTENDANCE_STATUSES.HALF_DAY]: 0,
  [ATTENDANCE_STATUSES.EXCUSED]: 0,
};

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  async listClassSections(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);

    const rows = await this.db
      .select({
        classId: students.classId,
        className: schoolClasses.name,
        sectionId: students.sectionId,
        sectionName: classSections.name,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, selectedCampus.id),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
        asc(classSections.displayOrder),
        asc(classSections.name),
      );

    const grouped = new Map<
      string,
      {
        classId: string;
        className: string;
        sectionId: string;
        sectionName: string;
        studentCount: number;
      }
    >();

    for (const row of rows) {
      const key = `${row.classId}::${row.sectionId}`;
      const current = grouped.get(key);

      if (current) {
        current.studentCount += 1;
        continue;
      }

      grouped.set(key, {
        classId: row.classId,
        className: row.className,
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        studentCount: 1,
      });
    }

    return Array.from(grouped.values());
  }

  async getAttendanceDay(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceDayQueryDto,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);
    this.assertClassSectionScopeAccess(query.classId, query.sectionId, scopes);
    const [classSection, roster] = await Promise.all([
      this.getClassSection(query.classId, query.sectionId),
      this.listRosterForScope(institutionId, selectedCampus.id, scopes, query),
    ]);

    if (roster.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND);
    }

    const attendanceByStudentId = await this.listAttendanceByStudentId(
      institutionId,
      query.attendanceDate,
      roster.map((student) => student.studentId),
    );

    return {
      attendanceDate: query.attendanceDate,
      campusId: selectedCampus.id,
      campusName: selectedCampus.name,
      classId: query.classId,
      className: classSection.className,
      sectionId: query.sectionId,
      sectionName: classSection.sectionName,
      totalStudents: roster.length,
      entries: roster.map((student) => ({
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        status: attendanceByStudentId.get(student.studentId) ?? null,
      })),
    };
  }

  async upsertAttendanceDay(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpsertAttendanceDayDto,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);
    this.assertClassSectionScopeAccess(
      payload.classId,
      payload.sectionId,
      scopes,
    );
    const membership = await this.authService.getMembershipForOrganization(
      authSession.user.id,
      institutionId,
    );

    if (!membership) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    const markingMembershipId = membership.id;
    const roster = await this.listRosterForScope(
      institutionId,
      selectedCampus.id,
      scopes,
      payload,
    );
    const classSection = await this.getClassSection(
      payload.classId,
      payload.sectionId,
    );

    if (roster.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND);
    }

    this.assertRosterMatchesPayload(roster, payload.entries);

    const rosterByStudentId = new Map(
      roster.map((student) => [student.studentId, student] as const),
    );
    const existingAttendanceByStudentId = await this.listAttendanceByStudentId(
      institutionId,
      payload.attendanceDate,
      roster.map((student) => student.studentId),
    );
    const now = new Date();
    let createdCount = 0;
    let updatedCount = 0;
    let changedCount = 0;

    for (const entry of payload.entries) {
      const existingStatus = existingAttendanceByStudentId.get(entry.studentId);

      if (!existingStatus) {
        createdCount += 1;
        continue;
      }

      updatedCount += 1;

      if (existingStatus !== entry.status) {
        changedCount += 1;
      }
    }

    await this.db.transaction(async (tx) => {
      for (const entry of payload.entries) {
        const rosterStudent = rosterByStudentId.get(entry.studentId);

        if (!rosterStudent) {
          continue;
        }

        await tx
          .insert(attendanceRecords)
          .values({
            id: randomUUID(),
            institutionId,
            campusId: rosterStudent.campusId,
            studentId: rosterStudent.studentId,
            attendanceDate: payload.attendanceDate,
            classId: rosterStudent.classId,
            sectionId: rosterStudent.sectionId,
            status: entry.status,
            markedByMembershipId: markingMembershipId,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              attendanceRecords.institutionId,
              attendanceRecords.studentId,
              attendanceRecords.attendanceDate,
            ],
            set: {
              campusId: rosterStudent.campusId,
              classId: rosterStudent.classId,
              sectionId: rosterStudent.sectionId,
              status: entry.status,
              markedByMembershipId: markingMembershipId,
              updatedAt: now,
            },
          });
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.MARK,
        entityType: AUDIT_ENTITY_TYPES.ATTENDANCE_DAY,
        entityId: `${payload.attendanceDate}:${payload.classId}:${payload.sectionId}`,
        entityLabel: `${classSection.className} ${classSection.sectionName}`,
        summary: `Marked attendance for ${classSection.className} ${classSection.sectionName} on ${payload.attendanceDate}.`,
        metadata: {
          attendanceDate: payload.attendanceDate,
          classId: payload.classId,
          sectionId: payload.sectionId,
          totalEntries: payload.entries.length,
          createdCount,
          updatedCount,
          changedCount,
        },
      });
    });

    // Notify guardians about absent students (non-blocking)
    const absentEntries = payload.entries.filter(
      (e) => e.status === ATTENDANCE_STATUSES.ABSENT,
    );

    if (absentEntries.length > 0) {
      this.notificationFactory
        .notify({
          institutionId,
          createdByUserId: authSession.user.id,
          type: NOTIFICATION_TYPES.ATTENDANCE_ABSENT,
          channel: NOTIFICATION_CHANNELS.OPERATIONS,
          tone: NOTIFICATION_TONES.WARNING,
          audience: "guardians",
          title: "Student marked absent",
          message: `${absentEntries.length} student${absentEntries.length > 1 ? "s" : ""} marked absent in ${classSection.className} ${classSection.sectionName} on ${payload.attendanceDate}.`,
          senderLabel: authSession.user.name,
        })
        .catch(() => {});
    }

    return this.getAttendanceDay(institutionId, authSession, scopes, payload);
  }

  async listAttendanceDayView(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceDayViewQueryDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const rows = await this.db
      .select({
        campusId: attendanceRecords.campusId,
        campusName: campus.name,
        classId: attendanceRecords.classId,
        className: schoolClasses.name,
        sectionId: attendanceRecords.sectionId,
        sectionName: classSections.name,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .innerJoin(campus, eq(attendanceRecords.campusId, campus.id))
      .innerJoin(schoolClasses, eq(attendanceRecords.classId, schoolClasses.id))
      .innerJoin(
        classSections,
        eq(attendanceRecords.sectionId, classSections.id),
      )
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, query.attendanceDate),
          eq(attendanceRecords.campusId, activeCampusId),
          sectionScopeFilter(attendanceRecords.sectionId, scopes),
        ),
      )
      .orderBy(
        asc(campus.name),
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
        asc(classSections.displayOrder),
        asc(classSections.name),
      );

    const summaries = new Map<
      string,
      {
        attendanceDate: string;
        campusId: string;
        campusName: string;
        classId: string;
        className: string;
        sectionId: string;
        sectionName: string;
        totalStudents: number;
        counts: AttendanceCounts;
      }
    >();

    for (const row of rows) {
      const key = [row.campusId, row.classId, row.sectionId].join("::");
      const current = summaries.get(key) ?? {
        attendanceDate: query.attendanceDate,
        campusId: row.campusId,
        campusName: row.campusName,
        classId: row.classId,
        className: row.className,
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        totalStudents: 0,
        counts: { ...EMPTY_ATTENDANCE_COUNTS },
      };

      current.totalStudents += 1;
      current.counts[row.status] += 1;
      summaries.set(key, current);
    }

    return Array.from(summaries.values());
  }

  async getAttendanceOverview(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceOverviewQueryDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);

    // Get all distinct (campus, class, section) combos with active students
    const sectionRows = await this.db
      .select({
        campusId: campus.id,
        campusName: campus.name,
        classId: schoolClasses.id,
        className: schoolClasses.name,
        sectionId: classSections.id,
        sectionName: classSections.name,
        displayOrderClass: schoolClasses.displayOrder,
        displayOrderSection: classSections.displayOrder,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          eq(member.primaryCampusId, activeCampusId),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(
        asc(campus.name),
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
        asc(classSections.displayOrder),
        asc(classSections.name),
      );

    // Build distinct section map preserving order, counting students
    const sectionMap = new Map<
      string,
      {
        campusId: string;
        campusName: string;
        classId: string;
        className: string;
        sectionId: string;
        sectionName: string;
        studentCount: number;
      }
    >();

    for (const row of sectionRows) {
      const key = `${row.campusId}::${row.classId}::${row.sectionId}`;
      const current = sectionMap.get(key);
      if (current) {
        current.studentCount += 1;
      } else {
        sectionMap.set(key, {
          campusId: row.campusId,
          campusName: row.campusName,
          classId: row.classId,
          className: row.className,
          sectionId: row.sectionId,
          sectionName: row.sectionName,
          studentCount: 1,
        });
      }
    }

    // Get attendance records for the date grouped by (campusId, classId, sectionId)
    const attendanceRows = await this.db
      .select({
        campusId: attendanceRecords.campusId,
        classId: attendanceRecords.classId,
        sectionId: attendanceRecords.sectionId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, query.date),
          eq(attendanceRecords.campusId, activeCampusId),
          sectionScopeFilter(attendanceRecords.sectionId, scopes),
        ),
      );

    // Build counts map keyed by campusId::classId::sectionId
    const countsMap = new Map<string, AttendanceCounts>();
    for (const row of attendanceRows) {
      const key = `${row.campusId}::${row.classId}::${row.sectionId}`;
      const current = countsMap.get(key) ?? { ...EMPTY_ATTENDANCE_COUNTS };
      current[row.status] += 1;
      countsMap.set(key, current);
    }

    // Merge
    return Array.from(sectionMap.entries()).map(([key, section]) => {
      const counts = countsMap.get(key) ?? null;
      return {
        campusId: section.campusId,
        campusName: section.campusName,
        classId: section.classId,
        className: section.className,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        studentCount: section.studentCount,
        marked: counts !== null,
        counts: counts
          ? {
              present: counts[ATTENDANCE_STATUSES.PRESENT],
              absent: counts[ATTENDANCE_STATUSES.ABSENT],
              late: counts[ATTENDANCE_STATUSES.LATE],
              half_day: counts[ATTENDANCE_STATUSES.HALF_DAY],
              excused: counts[ATTENDANCE_STATUSES.EXCUSED],
            }
          : null,
      };
    });
  }

  async getAttendanceClassReport(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceClassReportQueryDto,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);
    this.assertClassSectionScopeAccess(query.classId, query.sectionId, scopes);
    const classSection = await this.getClassSection(
      query.classId,
      query.sectionId,
    );

    // Get all students in the section
    const studentRows = await this.db
      .select({
        studentId: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, selectedCampus.id),
          eq(students.classId, query.classId),
          eq(students.sectionId, query.sectionId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .orderBy(asc(students.firstName), asc(students.lastName));

    const studentIds = studentRows.map((s) => s.studentId);

    // Get attendance records for the date range
    const recordRows =
      studentIds.length > 0
        ? await this.db
            .select({
              studentId: attendanceRecords.studentId,
              attendanceDate: attendanceRecords.attendanceDate,
              status: attendanceRecords.status,
            })
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.institutionId, institutionId),
                eq(attendanceRecords.classId, query.classId),
                eq(attendanceRecords.sectionId, query.sectionId),
                gte(attendanceRecords.attendanceDate, query.startDate),
                lte(attendanceRecords.attendanceDate, query.endDate),
                inArray(attendanceRecords.studentId, studentIds),
              ),
            )
        : [];

    // Collect all dates in range that have records
    const allDatesSet = new Set<string>();
    for (const row of recordRows) {
      allDatesSet.add(row.attendanceDate);
    }
    const dates = Array.from(allDatesSet).sort();

    // Build per-student data
    const studentRecordsMap = new Map<
      string,
      {
        records: Record<string, string>;
        present: number;
        absent: number;
        late: number;
        excused: number;
      }
    >();

    for (const row of recordRows) {
      const current = studentRecordsMap.get(row.studentId) ?? {
        records: {},
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      current.records[row.attendanceDate] = row.status;
      if (row.status === ATTENDANCE_STATUSES.PRESENT) current.present += 1;
      else if (row.status === ATTENDANCE_STATUSES.ABSENT) current.absent += 1;
      else if (row.status === ATTENDANCE_STATUSES.LATE) current.late += 1;
      else if (row.status === ATTENDANCE_STATUSES.EXCUSED) current.excused += 1;
      studentRecordsMap.set(row.studentId, current);
    }

    const studentResults = studentRows.map((s) => {
      const data = studentRecordsMap.get(s.studentId) ?? {
        records: {},
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      const totalMarkedDays =
        data.present + data.absent + data.late + data.excused;
      return {
        studentId: s.studentId,
        admissionNumber: s.admissionNumber,
        fullName: [s.firstName, s.lastName].filter(Boolean).join(" "),
        present: data.present,
        absent: data.absent,
        late: data.late,
        excused: data.excused,
        attendancePercent:
          totalMarkedDays === 0
            ? 0
            : Math.round((data.present / totalMarkedDays) * 100),
        records: data.records,
      };
    });

    return {
      classId: query.classId,
      className: classSection.className,
      sectionId: query.sectionId,
      sectionName: classSection.sectionName,
      campusId: selectedCampus.id,
      campusName: selectedCampus.name,
      startDate: query.startDate,
      endDate: query.endDate,
      dates,
      students: studentResults,
    };
  }

  async getAttendanceStudentReport(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceStudentReportQueryDto,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);
    // Get student with institution check, join to class and section via campus
    const [studentRow] = await this.db
      .select({
        studentId: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        classId: students.classId,
        className: schoolClasses.name,
        sectionId: students.sectionId,
        sectionName: classSections.name,
        campusId: campus.id,
        campusName: campus.name,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.id, query.studentId),
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, selectedCampus.id),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          sectionScopeFilter(students.sectionId, scopes),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!studentRow) {
      throw new NotFoundException(ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND);
    }

    // Get attendance records for the date range ordered by date asc
    const recordRows = await this.db
      .select({
        attendanceDate: attendanceRecords.attendanceDate,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.studentId, query.studentId),
          gte(attendanceRecords.attendanceDate, query.startDate),
          lte(attendanceRecords.attendanceDate, query.endDate),
        ),
      )
      .orderBy(asc(attendanceRecords.attendanceDate));

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const row of recordRows) {
      if (row.status === ATTENDANCE_STATUSES.PRESENT) present += 1;
      else if (row.status === ATTENDANCE_STATUSES.ABSENT) absent += 1;
      else if (row.status === ATTENDANCE_STATUSES.LATE) late += 1;
      else if (row.status === ATTENDANCE_STATUSES.EXCUSED) excused += 1;
    }

    const totalMarkedDays = present + absent + late + excused;

    return {
      studentId: studentRow.studentId,
      admissionNumber: studentRow.admissionNumber,
      fullName: [studentRow.firstName, studentRow.lastName]
        .filter(Boolean)
        .join(" "),
      classId: studentRow.classId,
      className: studentRow.className,
      sectionId: studentRow.sectionId,
      sectionName: studentRow.sectionName,
      campusId: studentRow.campusId,
      campusName: studentRow.campusName,
      startDate: query.startDate,
      endDate: query.endDate,
      totalMarkedDays,
      present,
      absent,
      late,
      excused,
      attendancePercent:
        totalMarkedDays === 0
          ? 0
          : Math.round((present / totalMarkedDays) * 100),
      records: recordRows.map((r) => ({
        date: r.attendanceDate,
        status: r.status,
      })),
    };
  }

  // ── Monthly attendance register ──────────────────────────────────────

  async getMonthlyRegister(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: MonthlyRegisterQueryDto,
  ) {
    const selectedCampus = await this.getActiveCampus(
      institutionId,
      authSession,
    );
    this.assertCampusScopeAccess(selectedCampus.id, scopes);
    this.assertClassSectionScopeAccess(query.classId, query.sectionId, scopes);
    const classSection = await this.getClassSection(
      query.classId,
      query.sectionId,
    );

    // Calculate date range for the month
    const startDate = `${query.year}-${String(query.month).padStart(2, "0")}-01`;
    const lastDay = new Date(query.year, query.month, 0).getDate();
    const endDate = `${query.year}-${String(query.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Get holidays in range
    const holidays = await this.getHolidayDates(
      institutionId,
      selectedCampus.id,
      startDate,
      endDate,
    );

    // Get students
    const studentRows = await this.db
      .select({
        studentId: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, selectedCampus.id),
          eq(students.classId, query.classId),
          eq(students.sectionId, query.sectionId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
        ),
      )
      .orderBy(asc(students.firstName), asc(students.lastName));

    const studentIds = studentRows.map((s) => s.studentId);

    // Get attendance records
    const recordRows =
      studentIds.length > 0
        ? await this.db
            .select({
              studentId: attendanceRecords.studentId,
              attendanceDate: attendanceRecords.attendanceDate,
              status: attendanceRecords.status,
            })
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.institutionId, institutionId),
                gte(attendanceRecords.attendanceDate, startDate),
                lte(attendanceRecords.attendanceDate, endDate),
                inArray(attendanceRecords.studentId, studentIds),
              ),
            )
        : [];

    // Build student-day map
    const recordMap = new Map<string, Map<number, string>>();
    for (const row of recordRows) {
      const dayNum = new Date(row.attendanceDate).getDate();
      let studentDays = recordMap.get(row.studentId);
      if (!studentDays) {
        studentDays = new Map();
        recordMap.set(row.studentId, studentDays);
      }
      studentDays.set(dayNum, row.status);
    }

    // Count working days (exclude Sundays and holidays)
    let workingDays = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${query.year}-${String(query.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek !== 0 && !holidays.has(dateStr)) {
        workingDays++;
      }
    }

    const studentData = studentRows.map((s) => {
      const dayMap = recordMap.get(s.studentId) ?? new Map();
      const days: Record<string, string | null> = {};
      let present = 0;
      let absent = 0;
      let late = 0;
      let halfDay = 0;
      let excused = 0;

      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${query.year}-${String(query.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayOfWeek = new Date(dateStr).getDay();

        if (dayOfWeek === 0) {
          days[d] = "S"; // Sunday
        } else if (holidays.has(dateStr)) {
          days[d] = "H"; // Holiday
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const status: string | null = dayMap.get(d) ?? null;
          days[d] = status;
          if (status === ATTENDANCE_STATUSES.PRESENT) present++;
          else if (status === ATTENDANCE_STATUSES.ABSENT) absent++;
          else if (status === ATTENDANCE_STATUSES.LATE) late++;
          else if (status === ATTENDANCE_STATUSES.HALF_DAY) halfDay++;
          else if (status === ATTENDANCE_STATUSES.EXCUSED) excused++;
        }
      }

      const totalMarked = present + absent + late + halfDay + excused;
      return {
        studentId: s.studentId,
        admissionNumber: s.admissionNumber,
        fullName: [s.firstName, s.lastName].filter(Boolean).join(" "),
        days,
        totals: {
          present,
          absent,
          late,
          halfDay,
          excused,
          percentage:
            totalMarked === 0 ? 0 : Math.round((present / totalMarked) * 100),
        },
      };
    });

    return {
      classId: query.classId,
      className: classSection.className,
      sectionId: query.sectionId,
      sectionName: classSection.sectionName,
      campusId: selectedCampus.id,
      campusName: selectedCampus.name,
      month: query.month,
      year: query.year,
      daysInMonth: lastDay,
      workingDays,
      holidays: Array.from(holidays),
      students: studentData,
    };
  }

  // ── Consolidated attendance report ────────────────────────────────────

  async getConsolidatedReport(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ConsolidatedReportQueryDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const campusId = query.campusId ?? activeCampusId;

    // Get all sections with student counts
    const sectionRows = await this.db
      .select({
        classId: students.classId,
        className: schoolClasses.name,
        sectionId: students.sectionId,
        sectionName: classSections.name,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
        asc(classSections.displayOrder),
        asc(classSections.name),
      );

    // Build section map
    const sectionMap = new Map<
      string,
      {
        classId: string;
        className: string;
        sectionId: string;
        sectionName: string;
        studentCount: number;
      }
    >();
    for (const row of sectionRows) {
      const key = `${row.classId}::${row.sectionId}`;
      const current = sectionMap.get(key);
      if (current) {
        current.studentCount++;
      } else {
        sectionMap.set(key, { ...row, studentCount: 1 });
      }
    }

    // Get attendance records for date range
    const attendanceRows = await this.db
      .select({
        classId: attendanceRecords.classId,
        sectionId: attendanceRecords.sectionId,
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.campusId, campusId),
          gte(attendanceRecords.attendanceDate, query.startDate),
          lte(attendanceRecords.attendanceDate, query.endDate),
          sectionScopeFilter(attendanceRecords.sectionId, scopes),
        ),
      );

    // Per-student attendance counts grouped by section
    type StudentAttendance = { present: number; total: number };
    const sectionStudents = new Map<string, Map<string, StudentAttendance>>();

    for (const row of attendanceRows) {
      const sectionKey = `${row.classId}::${row.sectionId}`;
      let studentMap = sectionStudents.get(sectionKey);
      if (!studentMap) {
        studentMap = new Map();
        sectionStudents.set(sectionKey, studentMap);
      }
      const sa = studentMap.get(row.studentId) ?? { present: 0, total: 0 };
      sa.total++;
      if (
        row.status === ATTENDANCE_STATUSES.PRESENT ||
        row.status === ATTENDANCE_STATUSES.LATE
      ) {
        sa.present++;
      }
      studentMap.set(row.studentId, sa);
    }

    const CHRONIC_THRESHOLD = 75;
    const sections = Array.from(sectionMap.entries()).map(([key, section]) => {
      const studentMap = sectionStudents.get(key);
      let totalPercent = 0;
      let chronicAbsenteeCount = 0;
      let markedStudentCount = 0;

      if (studentMap) {
        for (const sa of studentMap.values()) {
          const pct = sa.total > 0 ? (sa.present / sa.total) * 100 : 0;
          totalPercent += pct;
          markedStudentCount++;
          if (pct < CHRONIC_THRESHOLD) chronicAbsenteeCount++;
        }
      }

      return {
        classId: section.classId,
        className: section.className,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        studentCount: section.studentCount,
        avgAttendancePercent:
          markedStudentCount > 0
            ? Number((totalPercent / markedStudentCount).toFixed(1))
            : 0,
        chronicAbsenteeCount,
      };
    });

    return {
      campusId,
      startDate: query.startDate,
      endDate: query.endDate,
      sections,
    };
  }

  // ── Chronic absentees ─────────────────────────────────────────────────

  async getChronicAbsentees(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ChronicAbsenteesQueryDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const campusId = query.campusId ?? activeCampusId;
    const threshold = query.threshold;

    // Get all attendance records in range for this campus
    const rows = await this.db
      .select({
        studentId: attendanceRecords.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        classId: students.classId,
        className: schoolClasses.name,
        sectionId: students.sectionId,
        sectionName: classSections.name,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.campusId, campusId),
          gte(attendanceRecords.attendanceDate, query.startDate),
          lte(attendanceRecords.attendanceDate, query.endDate),
          ne(member.status, STATUS.MEMBER.DELETED),
          sectionScopeFilter(attendanceRecords.sectionId, scopes),
        ),
      );

    // Aggregate per student
    type StudentData = {
      name: string;
      admissionNumber: string;
      className: string;
      sectionName: string;
      present: number;
      total: number;
    };
    const studentMap = new Map<string, StudentData>();

    for (const row of rows) {
      const existing = studentMap.get(row.studentId) ?? {
        name: [row.studentFirstName, row.studentLastName]
          .filter(Boolean)
          .join(" "),
        admissionNumber: row.admissionNumber,
        className: row.className,
        sectionName: row.sectionName,
        present: 0,
        total: 0,
      };
      existing.total++;
      if (
        row.status === ATTENDANCE_STATUSES.PRESENT ||
        row.status === ATTENDANCE_STATUSES.LATE
      ) {
        existing.present++;
      }
      studentMap.set(row.studentId, existing);
    }

    // Filter below threshold
    const absentees = Array.from(studentMap.entries())
      .map(([studentId, data]) => {
        const pct =
          data.total > 0
            ? Number(((data.present / data.total) * 100).toFixed(1))
            : 0;
        return {
          studentId,
          fullName: data.name,
          admissionNumber: data.admissionNumber,
          className: data.className,
          sectionName: data.sectionName,
          attendancePercent: pct,
          totalDays: data.total,
          presentDays: data.present,
        };
      })
      .filter((s) => s.attendancePercent < threshold)
      .sort((a, b) => a.attendancePercent - b.attendancePercent);

    return {
      campusId,
      startDate: query.startDate,
      endDate: query.endDate,
      threshold,
      students: absentees,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private async getHolidayDates(
    institutionId: string,
    campusId: string,
    startDate: string,
    endDate: string,
  ): Promise<Set<string>> {
    const rows = await this.db
      .select({ eventDate: calendarEvents.eventDate })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.institutionId, institutionId),
          eq(calendarEvents.eventType, "holiday"),
          eq(calendarEvents.status, "active"),
          gte(calendarEvents.eventDate, startDate),
          lte(calendarEvents.eventDate, endDate),
          or(
            isNull(calendarEvents.campusId),
            eq(calendarEvents.campusId, campusId),
          ),
        ),
      );

    return new Set(rows.map((r) => r.eventDate));
  }

  private async getClassSection(classId: string, sectionId: string) {
    const [row] = await this.db
      .select({
        className: schoolClasses.name,
        sectionName: classSections.name,
      })
      .from(schoolClasses)
      .innerJoin(classSections, eq(classSections.classId, schoolClasses.id))
      .where(
        and(eq(schoolClasses.id, classId), eq(classSections.id, sectionId)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.ATTENDANCE.CLASS_SECTION_REQUIRED,
      );
    }

    return row;
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

  private async listRosterForScope(
    institutionId: string,
    campusId: string,
    scopes: ResolvedScopes,
    scope: AttendanceDayQueryDto | UpsertAttendanceDayDto,
  ) {
    const classId = scope.classId.trim();
    const sectionId = scope.sectionId.trim();

    if (!classId || !sectionId) {
      throw new BadRequestException(
        ERROR_MESSAGES.ATTENDANCE.CLASS_SECTION_REQUIRED,
      );
    }

    return this.db
      .select({
        studentId: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        campusId: campus.id,
        campusName: campus.name,
        classId: students.classId,
        sectionId: students.sectionId,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(students.classId, classId),
          eq(students.sectionId, sectionId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          sectionScopeFilter(students.sectionId, scopes),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .orderBy(asc(students.firstName), asc(students.lastName))
      .then((rows) =>
        rows.map((row) => ({
          studentId: row.studentId,
          admissionNumber: row.admissionNumber,
          fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
          campusId: row.campusId,
          campusName: row.campusName,
          classId: row.classId,
          sectionId: row.sectionId,
        })),
      );
  }

  private async listAttendanceByStudentId(
    institutionId: string,
    attendanceDate: string,
    studentIds: string[],
  ) {
    const rows = await this.db
      .select({
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, attendanceDate),
        ),
      );

    return new Map(
      rows
        .filter((row) => studentIds.includes(row.studentId))
        .map((row) => [row.studentId, row.status] as const),
    );
  }

  private assertRosterMatchesPayload(
    roster: AttendanceRosterStudent[],
    entries: UpsertAttendanceDayDto["entries"],
  ) {
    const rosterIds = roster.map((student) => student.studentId).sort();
    const submittedIds = entries.map((entry) => entry.studentId).sort();

    if (
      rosterIds.length !== submittedIds.length ||
      rosterIds.some((studentId, index) => studentId !== submittedIds[index])
    ) {
      throw new BadRequestException(ERROR_MESSAGES.ATTENDANCE.ROSTER_MISMATCH);
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private async getActiveCampus(
    institutionId: string,
    authSession: AuthenticatedSession,
  ) {
    return this.getCampus(
      institutionId,
      this.requireActiveCampusId(authSession),
    );
  }

  private assertCampusScopeAccess(campusId: string, scopes: ResolvedScopes) {
    if (scopes.campusIds === "all") {
      return;
    }

    if (!scopes.campusIds.includes(campusId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }

  private assertClassSectionScopeAccess(
    classId: string,
    sectionId: string,
    scopes: ResolvedScopes,
  ) {
    if (scopes.classIds !== "all" && !scopes.classIds.includes(classId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.PERMISSION_DENIED);
    }

    if (scopes.sectionIds !== "all" && !scopes.sectionIds.includes(sectionId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.PERMISSION_DENIED);
    }
  }
}
