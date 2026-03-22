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
  isNull,
  ne,
  or,
  schoolClasses,
  subjects,
  timetableEntries,
} from "@repo/database";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { ANNOUNCEMENT_AUDIENCE } from "../../constants/status";
import type {
  AuthenticatedLinkedStudent,
  AuthenticatedSession,
} from "../auth/auth.types";
import { StudentsService } from "../students/students.service";
import { TimetableService } from "../timetable/timetable.service";
import type { FamilyOverviewQueryDto } from "./family.schemas";

const FAMILY_ITEM_LIMIT = 8;
const ALL_SCOPES = {
  campusIds: "all",
  classIds: "all",
  sectionIds: "all",
} as const;

type FamilySelectedTimetable = {
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  entries: Array<{
    id: string;
    dayOfWeek:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    periodIndex: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    subjectName: string;
    room: string | null;
  }>;
};

@Injectable()
export class FamilyService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly studentsService: StudentsService,
    private readonly timetableService: TimetableService,
  ) {}

  async getOverview(
    institutionId: string,
    authSession: AuthenticatedSession,
    linkedStudentContext: AuthenticatedLinkedStudent[],
    query: FamilyOverviewQueryDto = {},
  ) {
    this.ensureParentContext(authSession);

    const activeCampusId = this.requireActiveCampusId(authSession);
    const linkedStudents = linkedStudentContext.filter(
      (student: AuthenticatedLinkedStudent) =>
        student.campusId === activeCampusId,
    );
    const selectedStudentId = this.resolveSelectedStudentId(
      linkedStudents,
      query.studentId,
    );

    const studentSummaryResults = await Promise.allSettled(
      linkedStudents.map(async (linkedStudent: AuthenticatedLinkedStudent) => ({
        linkedStudent,
        summary: await this.studentsService.getStudentSummary(
          institutionId,
          linkedStudent.studentId,
          authSession,
          ALL_SCOPES,
        ),
      })),
    );

    const studentSummaries = studentSummaryResults
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          linkedStudent: AuthenticatedLinkedStudent;
          summary: Awaited<ReturnType<StudentsService["getStudentSummary"]>>;
        }> => result.status === "fulfilled",
      )
      .map(
        (
          result: PromiseFulfilledResult<{
            linkedStudent: AuthenticatedLinkedStudent;
            summary: Awaited<ReturnType<StudentsService["getStudentSummary"]>>;
          }>,
        ) => result.value.summary,
      );

    const selectedStudentSummary =
      studentSummaries.find(
        (summary) => summary.student.id === selectedStudentId,
      ) ??
      studentSummaries[0] ??
      null;

    const [announcements, calendarEvents] = await Promise.all([
      this.listFamilyAnnouncements(institutionId, activeCampusId),
      this.listFamilyCalendarEvents(institutionId, activeCampusId),
    ]);

    const selectedTimetable = selectedStudentSummary
      ? await this.getSelectedTimetable(
          institutionId,
          activeCampusId,
          selectedStudentSummary.student.classId,
          selectedStudentSummary.student.sectionId,
        )
      : null;

    return {
      linkedStudents,
      studentSummaries,
      selectedStudentId: selectedStudentSummary?.student.id ?? null,
      selectedStudentSummary,
      selectedTimetable,
      announcements,
      calendarEvents,
    };
  }

  private ensureParentContext(authSession: AuthenticatedSession) {
    if (authSession.activeContextKey !== AUTH_CONTEXT_KEYS.PARENT) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CONTEXT_ACCESS_REQUIRED);
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private resolveSelectedStudentId(
    linkedStudents: AuthenticatedLinkedStudent[],
    requestedStudentId?: string,
  ) {
    const fallbackStudent = linkedStudents[0];

    if (!requestedStudentId) {
      return fallbackStudent?.studentId ?? null;
    }

    const requested = linkedStudents.find(
      (student: AuthenticatedLinkedStudent) =>
        student.studentId === requestedStudentId,
    );

    return requested?.studentId ?? fallbackStudent?.studentId ?? null;
  }

  private async getSelectedTimetable(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
  ): Promise<FamilySelectedTimetable | null> {
    return this.timetableService.getSectionTimetableSnapshot(
      institutionId,
      campusId,
      classId,
      sectionId,
    );
  }

  private async listFamilyAnnouncements(
    institutionId: string,
    campusId: string,
  ) {
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
            eq(announcements.audience, ANNOUNCEMENT_AUDIENCE.GUARDIANS),
          ),
        ),
      )
      .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
      .limit(FAMILY_ITEM_LIMIT);
  }

  private async listFamilyCalendarEvents(
    institutionId: string,
    campusId: string,
  ) {
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
      .limit(FAMILY_ITEM_LIMIT);
  }
}
