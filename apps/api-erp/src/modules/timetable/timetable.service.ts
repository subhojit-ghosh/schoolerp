import { DATABASE } from "@repo/backend-core";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  campus,
  classSections,
  schoolClasses,
  subjects,
  timetableEntries,
} from "@repo/database";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import type {
  ReplaceSectionTimetableDto,
  TimetableScopeQueryDto,
} from "./timetable.schemas";

@Injectable()
export class TimetableService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async getTimetable(
    institutionId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: TimetableScopeQueryDto,
  ) {
    const sectionScope = await this.getSectionScope(
      institutionId,
      query.classId,
      query.sectionId,
      scopes,
    );

    const entries = await this.db
      .select({
        id: timetableEntries.id,
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        subjectId: timetableEntries.subjectId,
        subjectName: subjects.name,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, sectionScope.campusId),
          eq(timetableEntries.classId, query.classId),
          eq(timetableEntries.sectionId, query.sectionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(asc(timetableEntries.dayOfWeek), asc(timetableEntries.periodIndex));

    return {
      campusId: sectionScope.campusId,
      campusName: sectionScope.campusName,
      classId: sectionScope.classId,
      className: sectionScope.className,
      sectionId: sectionScope.sectionId,
      sectionName: sectionScope.sectionName,
      entries,
    };
  }

  async replaceSectionTimetable(
    institutionId: string,
    sectionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: ReplaceSectionTimetableDto,
  ) {
    const sectionScope = await this.getSectionScope(
      institutionId,
      payload.classId,
      sectionId,
      scopes,
    );

    if (payload.entries.length > 0) {
      await this.assertSubjectsAvailable(
        institutionId,
        sectionScope.campusId,
        payload.entries.map((entry) => entry.subjectId),
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(timetableEntries)
        .set({ status: STATUS.TIMETABLE.DELETED, deletedAt: new Date() })
        .where(
          and(
            eq(timetableEntries.institutionId, institutionId),
            eq(timetableEntries.classId, payload.classId),
            eq(timetableEntries.sectionId, sectionId),
            ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          ),
        );

      if (payload.entries.length === 0) {
        return;
      }

      await tx.insert(timetableEntries).values(
        payload.entries.map((entry) => ({
          id: randomUUID(),
          institutionId,
          campusId: sectionScope.campusId,
          classId: payload.classId,
          sectionId,
          dayOfWeek: entry.dayOfWeek,
          periodIndex: entry.periodIndex,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectId: entry.subjectId,
          room: entry.room?.trim() || null,
          status: STATUS.TIMETABLE.ACTIVE,
        })),
      );
    });

    return this.getTimetable(institutionId, authSession, scopes, {
      classId: payload.classId,
      sectionId,
    });
  }

  async deleteEntry(
    institutionId: string,
    entryId: string,
    _authSession: AuthenticatedSession,
  ) {
    const [entry] = await this.db
      .select({
        id: timetableEntries.id,
      })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.id, entryId),
          eq(timetableEntries.institutionId, institutionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .limit(1);

    if (!entry) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.ENTRY_NOT_FOUND);
    }

    await this.db
      .update(timetableEntries)
      .set({
        status: STATUS.TIMETABLE.DELETED,
        deletedAt: new Date(),
      })
      .where(eq(timetableEntries.id, entryId));
  }

  private async getSectionScope(
    institutionId: string,
    classId: string,
    sectionId: string,
    scopes: ResolvedScopes,
  ) {
    const conditions = [
      eq(classSections.institutionId, institutionId),
      eq(schoolClasses.institutionId, institutionId),
      eq(classSections.id, sectionId),
      eq(schoolClasses.id, classId),
      ne(schoolClasses.status, STATUS.CLASS.DELETED),
      eq(classSections.status, STATUS.SECTION.ACTIVE),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];
    const scopeFilter = campusScopeFilter(schoolClasses.campusId, scopes);

    if (scopeFilter) {
      conditions.push(scopeFilter);
    }

    const [row] = await this.db
      .select({
        campusId: campus.id,
        campusName: campus.name,
        classId: schoolClasses.id,
        className: schoolClasses.name,
        sectionId: classSections.id,
        sectionName: classSections.name,
      })
      .from(classSections)
      .innerJoin(schoolClasses, eq(classSections.classId, schoolClasses.id))
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.CLASS_SECTION_REQUIRED);
    }

    return row;
  }

  private async assertSubjectsAvailable(
    institutionId: string,
    campusId: string,
    subjectIds: string[],
  ) {
    const uniqueSubjectIds = [...new Set(subjectIds)];

    const availableSubjects = await this.db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        and(
          eq(subjects.institutionId, institutionId),
          eq(subjects.campusId, campusId),
          inArray(subjects.id, uniqueSubjectIds),
          eq(subjects.status, STATUS.SUBJECT.ACTIVE),
        ),
      );

    if (availableSubjects.length !== uniqueSubjectIds.length) {
      throw new NotFoundException(ERROR_MESSAGES.SUBJECTS.SUBJECT_NOT_FOUND);
    }
  }
}
