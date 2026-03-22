import { DATABASE } from "@repo/backend-core";
import {
  ConflictException,
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
  classSections,
  eq,
  inArray,
  isNull,
  member,
  ne,
  or,
  schoolClasses,
  subjectTeacherAssignments,
  subjects,
  timetableEntries,
  user,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import type {
  CopySectionTimetableDto,
  ReplaceSectionTimetableDto,
  TeacherTimetableQueryDto,
  TimetableScopeQueryDto,
  TimetableStaffOptionsQueryDto,
} from "./timetable.schemas";

const WEEKDAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
} as const;

type TimetableEntryInput = ReplaceSectionTimetableDto["entries"][number];
type SectionScope = {
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
};

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

    return this.getSectionTimetableSnapshot(
      institutionId,
      sectionScope.campusId,
      query.classId,
      query.sectionId,
    );
  }

  async listStaffOptions(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: TimetableStaffOptionsQueryDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);

    if (query.classId) {
      await this.assertClassAvailable(institutionId, campusId, query.classId);
    }

    const allStaff = await this.db
      .select({
        id: member.id,
        name: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(member.memberType, "staff"),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .orderBy(asc(user.name));

    const preferredAssignments = await this.db
      .select({
        staffId: subjectTeacherAssignments.membershipId,
      })
      .from(subjectTeacherAssignments)
      .where(
        and(
          eq(subjectTeacherAssignments.institutionId, institutionId),
          eq(subjectTeacherAssignments.subjectId, query.subjectId),
          or(
            eq(subjectTeacherAssignments.classId, query.classId ?? ""),
            isNull(subjectTeacherAssignments.classId),
          ),
          isNull(subjectTeacherAssignments.deletedAt),
        ),
      );

    const preferredIds = new Set(
      preferredAssignments.map((assignment) => assignment.staffId),
    );

    return {
      preferred: allStaff.filter((staff) => preferredIds.has(staff.id)),
      others: allStaff.filter((staff) => !preferredIds.has(staff.id)),
    };
  }

  async getTeacherTimetable(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: TeacherTimetableQueryDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);

    const staffMember = await this.getStaffMember(institutionId, campusId, query.staffId);

    const entries = await this.db
      .select({
        id: timetableEntries.id,
        bellSchedulePeriodId: timetableEntries.bellSchedulePeriodId,
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        subjectId: timetableEntries.subjectId,
        subjectName: subjects.name,
        staffId: timetableEntries.staffId,
        staffName: user.name,
        classId: schoolClasses.id,
        className: schoolClasses.name,
        sectionId: classSections.id,
        sectionName: classSections.name,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(schoolClasses, eq(timetableEntries.classId, schoolClasses.id))
      .innerJoin(classSections, eq(timetableEntries.sectionId, classSections.id))
      .leftJoin(member, eq(timetableEntries.staffId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, campusId),
          eq(timetableEntries.staffId, query.staffId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(asc(timetableEntries.dayOfWeek), asc(timetableEntries.periodIndex));

    return {
      staffId: staffMember.id,
      staffName: staffMember.name,
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

    await this.assertReplacementEntriesValid(
      institutionId,
      sectionScope.campusId,
      sectionId,
      payload.entries,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(timetableEntries)
        .set({
          status: STATUS.TIMETABLE.DELETED,
          deletedAt: new Date(),
        })
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
        payload.entries.map((entry) =>
          this.buildTimetableEntryRow(
            institutionId,
            sectionScope.campusId,
            payload.classId,
            sectionId,
            entry,
          ),
        ),
      );
    });

    return this.getTimetable(institutionId, authSession, scopes, {
      classId: payload.classId,
      sectionId,
    });
  }

  async copySectionTimetable(
    institutionId: string,
    sectionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CopySectionTimetableDto,
  ) {
    const targetScope = await this.getSectionScope(
      institutionId,
      payload.classId,
      sectionId,
      scopes,
    );
    const sourceScope = await this.getSectionScope(
      institutionId,
      payload.sourceClassId,
      payload.sourceSectionId,
      scopes,
    );

    if (
      targetScope.classId === sourceScope.classId &&
      targetScope.sectionId === sourceScope.sectionId
    ) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.COPY_SAME_SECTION);
    }

    if (targetScope.campusId !== sourceScope.campusId) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.COPY_SOURCE_NOT_FOUND);
    }

    const sourceEntries = await this.fetchSectionTimetableEntries(
      institutionId,
      sourceScope.campusId,
      sourceScope.classId,
      sourceScope.sectionId,
    );

    if (sourceEntries.length === 0) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.COPY_SOURCE_EMPTY);
    }

    await this.assertReplacementEntriesValid(
      institutionId,
      targetScope.campusId,
      targetScope.sectionId,
      sourceEntries.map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        periodIndex: entry.periodIndex,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectId: entry.subjectId,
        bellSchedulePeriodId: entry.bellSchedulePeriodId ?? undefined,
        staffId: entry.staffId ?? undefined,
        room: entry.room ?? undefined,
      })),
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(timetableEntries)
        .set({
          status: STATUS.TIMETABLE.DELETED,
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(timetableEntries.institutionId, institutionId),
            eq(timetableEntries.classId, payload.classId),
            eq(timetableEntries.sectionId, sectionId),
            ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          ),
        );

      await tx.insert(timetableEntries).values(
        sourceEntries.map((entry) => ({
          id: randomUUID(),
          institutionId,
          campusId: targetScope.campusId,
          classId: targetScope.classId,
          sectionId: targetScope.sectionId,
          subjectId: entry.subjectId,
          bellSchedulePeriodId: entry.bellSchedulePeriodId,
          staffId: entry.staffId,
          dayOfWeek: entry.dayOfWeek,
          periodIndex: entry.periodIndex,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          status: STATUS.TIMETABLE.ACTIVE,
        })),
      );
    });

    return this.getTimetable(institutionId, authSession, scopes, {
      classId: targetScope.classId,
      sectionId: targetScope.sectionId,
    });
  }

  async deleteEntry(
    institutionId: string,
    entryId: string,
    _authSession: AuthenticatedSession,
  ) {
    const [entry] = await this.db
      .select({ id: timetableEntries.id })
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

  async getSectionTimetableSnapshot(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
  ) {
    const [scope] = await this.db
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
      .where(
        and(
          eq(classSections.id, sectionId),
          eq(schoolClasses.id, classId),
          eq(schoolClasses.campusId, campusId),
          eq(classSections.institutionId, institutionId),
          eq(schoolClasses.institutionId, institutionId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!scope) {
      return null;
    }

    const entries = await this.fetchSectionTimetableEntries(
      institutionId,
      campusId,
      classId,
      sectionId,
    );

    return {
      ...scope,
      entries,
    };
  }

  async assertStaffMemberRemovable(institutionId: string, staffId: string) {
    const [row] = await this.db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.staffId, staffId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .limit(1);

    if (row) {
      throw new ConflictException(
        "Cannot delete a staff record that is assigned in the timetable.",
      );
    }
  }

  async fetchSectionTimetableEntries(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
  ) {
    return this.db
      .select({
        id: timetableEntries.id,
        bellSchedulePeriodId: timetableEntries.bellSchedulePeriodId,
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        subjectId: timetableEntries.subjectId,
        subjectName: subjects.name,
        staffId: timetableEntries.staffId,
        staffName: user.name,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(member, eq(timetableEntries.staffId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, campusId),
          eq(timetableEntries.classId, classId),
          eq(timetableEntries.sectionId, sectionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(asc(timetableEntries.dayOfWeek), asc(timetableEntries.periodIndex));
  }

  private async assertReplacementEntriesValid(
    institutionId: string,
    campusId: string,
    sectionId: string,
    entries: TimetableEntryInput[],
  ) {
    if (entries.length === 0) {
      return;
    }

    await this.assertSubjectsAvailable(
      institutionId,
      campusId,
      entries.map((entry) => entry.subjectId),
    );
    await this.assertStaffMembersAvailable(
      institutionId,
      campusId,
      entries.flatMap((entry) => (entry.staffId ? [entry.staffId] : [])),
    );
    await this.assertNoTeacherConflicts(
      institutionId,
      campusId,
      sectionId,
      entries,
    );
    await this.assertNoRoomConflicts(institutionId, campusId, sectionId, entries);
  }

  private buildTimetableEntryRow(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
    entry: TimetableEntryInput,
  ) {
    return {
      id: randomUUID(),
      institutionId,
      campusId,
      classId,
      sectionId,
      subjectId: entry.subjectId,
      bellSchedulePeriodId: entry.bellSchedulePeriodId ?? null,
      staffId: entry.staffId ?? null,
      dayOfWeek: entry.dayOfWeek,
      periodIndex: entry.periodIndex,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room?.trim() || null,
      status: STATUS.TIMETABLE.ACTIVE,
    };
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
      throw new NotFoundException(
        ERROR_MESSAGES.TIMETABLE.CLASS_SECTION_REQUIRED,
      );
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

  private async assertStaffMembersAvailable(
    institutionId: string,
    campusId: string,
    staffIds: string[],
  ) {
    const uniqueStaffIds = [...new Set(staffIds)];

    if (uniqueStaffIds.length === 0) {
      return;
    }

    const rows = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(member.memberType, "staff"),
          ne(member.status, STATUS.MEMBER.DELETED),
          inArray(member.id, uniqueStaffIds),
        ),
      );

    if (rows.length !== uniqueStaffIds.length) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.STAFF_NOT_FOUND);
    }
  }

  private async assertNoTeacherConflicts(
    institutionId: string,
    campusId: string,
    sectionId: string,
    entries: TimetableEntryInput[],
  ) {
    const staffIds = [...new Set(entries.flatMap((entry) => (entry.staffId ? [entry.staffId] : [])))];
    if (staffIds.length === 0) {
      return;
    }

    const slotConditions = this.buildSlotConditions(entries, (entry) =>
      inArray(timetableEntries.staffId, staffIds),
    );

    if (!slotConditions) {
      return;
    }

    const [conflict] = await this.db
      .select({
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        staffName: user.name,
      })
      .from(timetableEntries)
      .leftJoin(member, eq(timetableEntries.staffId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, campusId),
          ne(timetableEntries.sectionId, sectionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          slotConditions,
        ),
      )
      .limit(1);

    if (conflict) {
      throw new ConflictException(
        `${conflict.staffName ?? "Selected teacher"} is already assigned on ${
          WEEKDAY_LABELS[conflict.dayOfWeek]
        } period ${conflict.periodIndex}.`,
      );
    }
  }

  private async assertNoRoomConflicts(
    institutionId: string,
    campusId: string,
    sectionId: string,
    entries: TimetableEntryInput[],
  ) {
    const roomEntries = entries.filter((entry) => entry.room?.trim());
    if (roomEntries.length === 0) {
      return;
    }

    const roomBySlot = new Map<string, string[]>();
    for (const entry of roomEntries) {
      const slotKey = `${entry.dayOfWeek}:${entry.periodIndex}`;
      const room = entry.room!.trim();
      const existingRooms = roomBySlot.get(slotKey) ?? [];
      existingRooms.push(room);
      roomBySlot.set(slotKey, existingRooms);
    }

    const slotConditions = or(
      ...Array.from(roomBySlot.entries()).map(([slotKey, rooms]) => {
        const [dayOfWeek, periodIndex] = slotKey.split(":");
        return and(
          eq(timetableEntries.dayOfWeek, dayOfWeek as TimetableEntryInput["dayOfWeek"]),
          eq(timetableEntries.periodIndex, Number(periodIndex)),
          inArray(timetableEntries.room, [...new Set(rooms)]),
        )!;
      }),
    );

    const [conflict] = await this.db
      .select({
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, campusId),
          ne(timetableEntries.sectionId, sectionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          slotConditions,
        ),
      )
      .limit(1);

    if (conflict) {
      throw new ConflictException(
        `${conflict.room} is already assigned on ${
          WEEKDAY_LABELS[conflict.dayOfWeek]
        } period ${conflict.periodIndex}.`,
      );
    }
  }

  private buildSlotConditions(
    entries: TimetableEntryInput[],
    extraCondition: (entry: TimetableEntryInput) => SQL,
  ) {
    const slotGroups = new Map<string, TimetableEntryInput[]>();

    for (const entry of entries) {
      const slotKey = `${entry.dayOfWeek}:${entry.periodIndex}`;
      const slotEntries = slotGroups.get(slotKey) ?? [];
      slotEntries.push(entry);
      slotGroups.set(slotKey, slotEntries);
    }

    const conditions = Array.from(slotGroups.values()).map((slotEntries) => {
      const sampleEntry = slotEntries[0];

      if (!sampleEntry) {
        return null;
      }

      return and(
        eq(timetableEntries.dayOfWeek, sampleEntry.dayOfWeek),
        eq(timetableEntries.periodIndex, sampleEntry.periodIndex),
        extraCondition(sampleEntry),
      );
    });

    const validConditions = conditions.filter((condition): condition is SQL => Boolean(condition));

    return validConditions.length > 0 ? or(...validConditions) : null;
  }

  private async assertClassAvailable(
    institutionId: string,
    campusId: string,
    classId: string,
  ) {
    const [row] = await this.db
      .select({ id: schoolClasses.id })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
          eq(schoolClasses.campusId, campusId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }
  }

  private async getStaffMember(
    institutionId: string,
    campusId: string,
    staffId: string,
  ) {
    const [row] = await this.db
      .select({
        id: member.id,
        name: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.id, staffId),
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(member.memberType, "staff"),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.STAFF_NOT_FOUND);
    }

    return row;
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private assertCampusScopeAccess(campusId: string, scopes: ResolvedScopes) {
    if (scopes.campusIds === "all") {
      return;
    }

    if (!scopes.campusIds.includes(campusId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }
}
