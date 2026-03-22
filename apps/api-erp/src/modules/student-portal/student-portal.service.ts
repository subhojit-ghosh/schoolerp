import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  and,
  announcements,
  asc,
  calendarEvents,
  campus,
  classSections,
  desc,
  eq,
  inArray,
  isNull,
  member,
  ne,
  or,
  schoolClasses,
  students,
  subjects,
  timetableEntries,
} from "@repo/database";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { ANNOUNCEMENT_AUDIENCE } from "../../constants/status";
import type {
  AuthenticatedAccessContext,
  AuthenticatedSession,
} from "../auth/auth.types";
import { ExamsService } from "../exams/exams.service";
import { StudentsService } from "../students/students.service";
import { TimetableService } from "../timetable/timetable.service";
import type { StudentPortalOverviewQueryDto } from "./student-portal.schemas";

const STUDENT_PORTAL_ITEM_LIMIT = 8;
const ALL_SCOPES = {
  campusIds: "all",
  classIds: "all",
  sectionIds: "all",
} as const;

type StudentPortalStudent = {
  classId: string;
  sectionId: string;
  studentId: string;
};

@Injectable()
export class StudentPortalService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly studentsService: StudentsService,
    private readonly examsService: ExamsService,
    private readonly timetableService: TimetableService,
  ) {}

  async getOverview(
    institutionId: string,
    authSession: AuthenticatedSession,
    activeContext: AuthenticatedAccessContext | null,
    query: StudentPortalOverviewQueryDto = {},
  ) {
    this.ensureStudentContext(authSession);

    const activeCampusId = this.requireActiveCampusId(authSession);
    const currentStudent = await this.getCurrentStudent(
      institutionId,
      activeCampusId,
      activeContext?.membershipIds ?? [],
    );
    const studentSummary = await this.studentsService.getStudentSummary(
      institutionId,
      currentStudent.studentId,
      authSession,
      ALL_SCOPES,
    );
    const [timetable, announcements, calendarEvents] = await Promise.all([
      this.getTimetable(
        institutionId,
        studentSummary.student.campusId,
        studentSummary.student.classId,
        studentSummary.student.sectionId,
      ),
      this.listAnnouncements(institutionId, studentSummary.student.campusId),
      this.listCalendarEvents(institutionId, studentSummary.student.campusId),
    ]);

    const selectedReportCardTermId = this.resolveSelectedReportCardTermId(
      studentSummary.exams.recentTerms.map((term) => term.examTermId),
      query.examTermId,
    );
    const selectedReportCard = selectedReportCardTermId
      ? await this.examsService.getExamReportCard(
          institutionId,
          selectedReportCardTermId,
          { studentId: currentStudent.studentId },
          ALL_SCOPES,
        )
      : null;

    return {
      studentSummary,
      timetable,
      announcements,
      calendarEvents,
      selectedReportCardTermId,
      selectedReportCard,
    };
  }

  private ensureStudentContext(authSession: AuthenticatedSession) {
    if (authSession.activeContextKey !== AUTH_CONTEXT_KEYS.STUDENT) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CONTEXT_ACCESS_REQUIRED);
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private async getCurrentStudent(
    institutionId: string,
    activeCampusId: string,
    membershipIds: string[],
  ): Promise<StudentPortalStudent> {
    const rows =
      membershipIds.length === 0
        ? []
        : await this.db
            .select({
              studentId: students.id,
              classId: students.classId,
              sectionId: students.sectionId,
              campusId: member.primaryCampusId,
            })
            .from(students)
            .innerJoin(member, eq(students.membershipId, member.id))
            .where(
              and(
                eq(students.institutionId, institutionId),
                inArray(students.membershipId, membershipIds),
                ne(member.status, STATUS.MEMBER.DELETED),
                isNull(students.deletedAt),
              ),
            );

    const matchingStudent =
      rows.find((row) => row.campusId === activeCampusId) ?? rows[0];

    if (!matchingStudent) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CONTEXT_ACCESS_REQUIRED);
    }

    return {
      studentId: matchingStudent.studentId,
      classId: matchingStudent.classId,
      sectionId: matchingStudent.sectionId,
    };
  }

  private resolveSelectedReportCardTermId(
    availableTermIds: string[],
    requestedTermId?: string,
  ) {
    if (requestedTermId && availableTermIds.includes(requestedTermId)) {
      return requestedTermId;
    }

    return availableTermIds[0] ?? null;
  }

  private async getTimetable(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
  ) {
    return this.timetableService.getSectionTimetableSnapshot(
      institutionId,
      campusId,
      classId,
      sectionId,
    );
  }

  private async listAnnouncements(institutionId: string, campusId: string) {
    return this.db
      .select({
        id: announcements.id,
        institutionId: announcements.institutionId,
        campusId: announcements.campusId,
        campusName: campus.name,
        title: announcements.title,
        summary: announcements.summary,
        body: announcements.body,
        audience: announcements.audience,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        createdByUserId: announcements.createdByUserId,
      })
      .from(announcements)
      .leftJoin(campus, eq(announcements.campusId, campus.id))
      .where(
        and(
          eq(announcements.institutionId, institutionId),
          or(
            eq(announcements.campusId, campusId),
            isNull(announcements.campusId),
          ),
          ne(announcements.status, STATUS.ANNOUNCEMENT.DELETED),
          eq(announcements.status, STATUS.ANNOUNCEMENT.PUBLISHED),
          or(
            eq(announcements.audience, ANNOUNCEMENT_AUDIENCE.ALL),
            eq(announcements.audience, ANNOUNCEMENT_AUDIENCE.STUDENTS),
          ),
        ),
      )
      .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
      .limit(STUDENT_PORTAL_ITEM_LIMIT);
  }

  private async listCalendarEvents(institutionId: string, campusId: string) {
    return this.db
      .select({
        id: calendarEvents.id,
        institutionId: calendarEvents.institutionId,
        campusId: calendarEvents.campusId,
        campusName: campus.name,
        title: calendarEvents.title,
        description: calendarEvents.description,
        eventDate: calendarEvents.eventDate,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        isAllDay: calendarEvents.isAllDay,
        eventType: calendarEvents.eventType,
        status: calendarEvents.status,
        createdAt: calendarEvents.createdAt,
      })
      .from(calendarEvents)
      .leftJoin(campus, eq(calendarEvents.campusId, campus.id))
      .where(
        and(
          eq(calendarEvents.institutionId, institutionId),
          or(
            eq(calendarEvents.campusId, campusId),
            isNull(calendarEvents.campusId),
          ),
          ne(calendarEvents.status, STATUS.CALENDAR_EVENT.DELETED),
          eq(calendarEvents.status, STATUS.CALENDAR_EVENT.ACTIVE),
        ),
      )
      .orderBy(asc(calendarEvents.eventDate), asc(calendarEvents.title))
      .limit(STUDENT_PORTAL_ITEM_LIMIT);
  }
}
