import { DATABASE } from "@repo/backend-core";
import {
  ATTENDANCE_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AttendanceStatus,
} from "@repo/contracts";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  attendanceRecords,
  campus,
  classSections,
  member,
  schoolClasses,
  students,
} from "@repo/database";
import { and, asc, eq, gte, inArray, isNull, lte, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { AuthService } from "../auth/auth.service";
import type {
  AttendanceClassSectionQueryDto,
  AttendanceDayQueryDto,
  AttendanceDayViewQueryDto,
  AttendanceOverviewQueryDto,
  AttendanceClassReportQueryDto,
  AttendanceStudentReportQueryDto,
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
  [ATTENDANCE_STATUSES.EXCUSED]: 0,
};

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async listClassSections(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: AttendanceClassSectionQueryDto,
  ) {
    await this.getCampus(institutionId, query.campusId);

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
          eq(member.primaryCampusId, query.campusId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(asc(schoolClasses.displayOrder), asc(schoolClasses.name), asc(classSections.displayOrder), asc(classSections.name));

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
    query: AttendanceDayQueryDto,
  ) {
    const selectedCampus = await this.getCampus(institutionId, query.campusId);
    const [classSection, roster] = await Promise.all([
      this.getClassSection(query.classId, query.sectionId),
      this.listRosterForScope(institutionId, query),
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
    payload: UpsertAttendanceDayDto,
  ) {
    const membership = await this.authService.getMembershipForOrganization(
      authSession.user.id,
      institutionId,
    );

    if (!membership) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    const markingMembershipId = membership.id;
    const roster = await this.listRosterForScope(institutionId, payload);
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

    return this.getAttendanceDay(institutionId, authSession, payload);
  }

  async listAttendanceDayView(
    institutionId: string,
    authSession: AuthenticatedSession,
    query: AttendanceDayViewQueryDto,
  ) {
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
      .innerJoin(classSections, eq(attendanceRecords.sectionId, classSections.id))
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, query.attendanceDate),
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
    query: AttendanceOverviewQueryDto,
  ) {
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
        ),
      );

    // Build counts map keyed by campusId::classId::sectionId
    const countsMap = new Map<string, AttendanceCounts>();
    for (const row of attendanceRows) {
      const key = `${row.campusId}::${row.classId}::${row.sectionId}`;
      const current = countsMap.get(key) ?? { ...EMPTY_ATTENDANCE_COUNTS };
      current[row.status as keyof AttendanceCounts] += 1;
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
              excused: counts[ATTENDANCE_STATUSES.EXCUSED],
            }
          : null,
      };
    });
  }

  async getAttendanceClassReport(
    institutionId: string,
    query: AttendanceClassReportQueryDto,
  ) {
    // Validate campus, class, section
    const selectedCampus = await this.getCampus(institutionId, query.campusId);
    const classSection = await this.getClassSection(query.classId, query.sectionId);

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
          eq(member.primaryCampusId, query.campusId),
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
      { records: Record<string, string>; present: number; absent: number; late: number; excused: number }
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
      const totalMarkedDays = data.present + data.absent + data.late + data.excused;
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
      campusId: query.campusId,
      campusName: selectedCampus.name,
      startDate: query.startDate,
      endDate: query.endDate,
      dates,
      students: studentResults,
    };
  }

  async getAttendanceStudentReport(
    institutionId: string,
    query: AttendanceStudentReportQueryDto,
  ) {
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
          eq(member.status, STATUS.MEMBER.ACTIVE),
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
      fullName: [studentRow.firstName, studentRow.lastName].filter(Boolean).join(" "),
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
          eq(member.primaryCampusId, scope.campusId),
          eq(students.classId, classId),
          eq(students.sectionId, sectionId),
          eq(member.status, STATUS.MEMBER.ACTIVE),
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
}
