import { DATABASE } from "@repo/backend-core";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@repo/contracts";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import { attendanceRecords, campus, member, students } from "@repo/database";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { AuthService } from "../auth/auth.service";
import type {
  AttendanceClassSectionQueryDto,
  AttendanceDayQueryDto,
  AttendanceDayViewQueryDto,
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
        sectionId: students.sectionId,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, query.campusId),
          isNull(students.deletedAt),
          ne(member.status, STATUS.MEMBER.DELETED),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(asc(students.classId), asc(students.sectionId));

    const grouped = new Map<
      string,
      { classId: string; sectionId: string; studentCount: number }
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
        sectionId: row.sectionId,
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
    const roster = await this.listRosterForScope(institutionId, query);

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
      sectionId: query.sectionId,
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

    if (roster.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.ATTENDANCE.NO_STUDENTS_FOUND);
    }

    this.assertRosterMatchesPayload(roster, payload.entries);

    const rosterByStudentId = new Map(
      roster.map((student) => [student.studentId, student] as const),
    );
    const now = new Date();

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
        sectionId: attendanceRecords.sectionId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .innerJoin(campus, eq(attendanceRecords.campusId, campus.id))
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, query.attendanceDate),
        ),
      )
      .orderBy(
        asc(campus.name),
        asc(attendanceRecords.classId),
        asc(attendanceRecords.sectionId),
      );

    const summaries = new Map<
      string,
      {
        attendanceDate: string;
        campusId: string;
        campusName: string;
        classId: string;
        sectionId: string;
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
        sectionId: row.sectionId,
        totalStudents: 0,
        counts: { ...EMPTY_ATTENDANCE_COUNTS },
      };

      current.totalStudents += 1;
      current.counts[row.status] += 1;
      summaries.set(key, current);
    }

    return Array.from(summaries.values());
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
          isNull(students.deletedAt),
          ne(member.status, STATUS.MEMBER.DELETED),
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
