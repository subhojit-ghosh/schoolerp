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
  academicYears,
  and,
  asc,
  bellSchedulePeriods,
  bellSchedules,
  campus,
  classSections,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  member,
  ne,
  or,
  schoolClasses,
  subjectTeacherAssignments,
  subjects,
  timetableAssignments,
  timetableEntries,
  timetableVersions,
  user,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import type {
  CopySectionTimetableDto,
  CreateTimetableVersionDto,
  ListTimetableVersionsQueryDto,
  PublishTimetableVersionDto,
  ReplaceSectionTimetableDto,
  SetTimetableVersionStatusDto,
  TeacherTimetableQueryDto,
  TimetableScopeQueryDto,
  TimetableStaffOptionsQueryDto,
  UpdateTimetableVersionDto,
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

const IMPORTED_LIVE_TIMETABLE_NAME = "Imported live timetable";

type TimetableEntryInput = ReplaceSectionTimetableDto["entries"][number];
type SectionScope = {
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
};

type VersionRecord = {
  id: string;
  institutionId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  bellScheduleId: string;
  bellScheduleName: string;
  academicYearId: string | null;
  name: string;
  notes: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ResolvedVersionAssignment = {
  effectiveFrom: string;
  effectiveTo: string | null;
  version: VersionRecord;
};

@Injectable()
export class TimetableService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

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
      {
        date: query.date,
        versionId: query.versionId,
      },
    );
  }

  async listTimetableVersions(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListTimetableVersionsQueryDto,
  ) {
    const sectionScope = await this.getSectionScope(
      institutionId,
      query.classId,
      query.sectionId,
      scopes,
    );

    await this.ensureLegacyVersionForSection(
      institutionId,
      sectionScope,
      authSession.user.id,
    );

    const versions = await this.db
      .select({
        id: timetableVersions.id,
        institutionId: timetableVersions.institutionId,
        campusId: timetableVersions.campusId,
        classId: timetableVersions.classId,
        sectionId: timetableVersions.sectionId,
        bellScheduleId: timetableVersions.bellScheduleId,
        bellScheduleName: bellSchedules.name,
        academicYearId: timetableVersions.academicYearId,
        name: timetableVersions.name,
        notes: timetableVersions.notes,
        status: timetableVersions.status,
        publishedAt: timetableVersions.publishedAt,
        createdAt: timetableVersions.createdAt,
        updatedAt: timetableVersions.updatedAt,
      })
      .from(timetableVersions)
      .innerJoin(
        bellSchedules,
        eq(timetableVersions.bellScheduleId, bellSchedules.id),
      )
      .where(
        and(
          eq(timetableVersions.institutionId, institutionId),
          eq(timetableVersions.classId, query.classId),
          eq(timetableVersions.sectionId, query.sectionId),
        ),
      )
      .orderBy(
        desc(timetableVersions.status),
        desc(timetableVersions.publishedAt),
        desc(timetableVersions.createdAt),
      );

    const entryCounts = await this.db
      .select({
        timetableVersionId: timetableEntries.timetableVersionId,
        id: timetableEntries.id,
      })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.classId, query.classId),
          eq(timetableEntries.sectionId, query.sectionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      );
    const countByVersionId = new Map<string, number>();
    for (const row of entryCounts) {
      if (!row.timetableVersionId) {
        continue;
      }

      countByVersionId.set(
        row.timetableVersionId,
        (countByVersionId.get(row.timetableVersionId) ?? 0) + 1,
      );
    }

    const today = getTodayDateString();
    const assignments = await this.db
      .select({
        timetableVersionId: timetableAssignments.timetableVersionId,
        effectiveFrom: timetableAssignments.effectiveFrom,
        effectiveTo: timetableAssignments.effectiveTo,
      })
      .from(timetableAssignments)
      .where(
        and(
          eq(timetableAssignments.institutionId, institutionId),
          eq(timetableAssignments.classId, query.classId),
          eq(timetableAssignments.sectionId, query.sectionId),
          eq(timetableAssignments.status, STATUS.TIMETABLE_ASSIGNMENT.ACTIVE),
          lte(timetableAssignments.effectiveFrom, today),
          or(
            isNull(timetableAssignments.effectiveTo),
            gte(timetableAssignments.effectiveTo, today),
          ),
        ),
      );

    const liveVersionIds = new Set(
      assignments.map((assignment) => assignment.timetableVersionId),
    );
    const assignmentByVersionId = new Map(
      assignments.map((assignment) => [
        assignment.timetableVersionId,
        assignment,
      ]),
    );

    return versions.map((version) =>
      this.mapTimetableVersion(version, {
        entryCount: countByVersionId.get(version.id) ?? 0,
        effectiveFrom:
          assignmentByVersionId.get(version.id)?.effectiveFrom ?? null,
        effectiveTo: assignmentByVersionId.get(version.id)?.effectiveTo ?? null,
        isLive: liveVersionIds.has(version.id),
      }),
    );
  }

  async createTimetableVersion(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateTimetableVersionDto,
  ) {
    const sectionScope = await this.getSectionScope(
      institutionId,
      payload.classId,
      payload.sectionId,
      scopes,
    );

    await this.ensureLegacyVersionForSection(
      institutionId,
      sectionScope,
      authSession.user.id,
    );
    await this.assertVersionNameAvailable(
      institutionId,
      payload.sectionId,
      payload.name,
    );

    let sourceVersion: VersionRecord | null = null;
    if (payload.duplicateFromVersionId) {
      sourceVersion = await this.getVersionRecord(
        institutionId,
        payload.duplicateFromVersionId,
      );

      if (
        sourceVersion.classId !== payload.classId ||
        sourceVersion.sectionId !== payload.sectionId
      ) {
        throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.VERSION_NOT_FOUND);
      }
    }

    const bellScheduleId =
      payload.bellScheduleId ??
      sourceVersion?.bellScheduleId ??
      (await this.getSuggestedDefaultBellScheduleId(
        institutionId,
        sectionScope.campusId,
      ));

    if (!bellScheduleId) {
      throw new ConflictException(
        ERROR_MESSAGES.BELL_SCHEDULES.DEFAULT_SCHEDULE_REQUIRED,
      );
    }

    await this.assertBellScheduleUsable(
      institutionId,
      sectionScope.campusId,
      bellScheduleId,
    );

    const academicYearId = await this.getCurrentAcademicYearId(institutionId);
    const versionId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(timetableVersions).values({
        id: versionId,
        institutionId,
        campusId: sectionScope.campusId,
        classId: payload.classId,
        sectionId: payload.sectionId,
        academicYearId,
        bellScheduleId,
        name: payload.name.trim(),
        status: STATUS.TIMETABLE_VERSION.DRAFT,
        createdByUserId: authSession.user.id,
        updatedByUserId: authSession.user.id,
      });

      if (!sourceVersion) {
        return;
      }

      const sourceEntries = await this.fetchVersionEntries(
        institutionId,
        sourceVersion.id,
      );

      if (sourceEntries.length === 0) {
        return;
      }

      await tx.insert(timetableEntries).values(
        sourceEntries.map((entry) => ({
          id: randomUUID(),
          institutionId,
          campusId: sectionScope.campusId,
          classId: payload.classId,
          sectionId: payload.sectionId,
          timetableVersionId: versionId,
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

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.TIMETABLE,
        entityId: versionId,
        entityLabel: payload.name,
        summary: `Created timetable version ${payload.name}.`,
      })
      .catch(() => {});

    return this.getTimetableVersionById(institutionId, versionId);
  }

  async updateTimetableVersion(
    institutionId: string,
    versionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateTimetableVersionDto,
  ) {
    const version = await this.getVersionRecord(institutionId, versionId);
    await this.assertVersionScopeAccessible(institutionId, version, scopes);

    if (version.status === STATUS.TIMETABLE_VERSION.ARCHIVED) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.VERSION_ARCHIVED);
    }

    if (payload.name && payload.name !== version.name) {
      await this.assertVersionNameAvailable(
        institutionId,
        version.sectionId,
        payload.name,
        versionId,
      );
    }

    if (payload.bellScheduleId) {
      await this.assertBellScheduleUsable(
        institutionId,
        version.campusId,
        payload.bellScheduleId,
      );
    }

    await this.db
      .update(timetableVersions)
      .set({
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(payload.bellScheduleId
          ? { bellScheduleId: payload.bellScheduleId }
          : {}),
        ...(payload.notes !== undefined
          ? { notes: payload.notes || null }
          : {}),
        updatedByUserId: authSession.user.id,
      })
      .where(eq(timetableVersions.id, versionId));

    return this.getTimetableVersionById(institutionId, versionId);
  }

  async publishTimetableVersion(
    institutionId: string,
    versionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: PublishTimetableVersionDto,
  ) {
    const version = await this.getVersionRecord(institutionId, versionId);
    await this.assertVersionScopeAccessible(institutionId, version, scopes);

    if (version.status === STATUS.TIMETABLE_VERSION.ARCHIVED) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.VERSION_ARCHIVED);
    }

    const overlappingAssignments = await this.listOverlappingAssignments(
      institutionId,
      version.classId,
      version.sectionId,
      payload.effectiveFrom,
      payload.effectiveTo ?? null,
      versionId,
    );

    const truncatableAssignments = overlappingAssignments.filter(
      (assignment) => assignment.effectiveFrom < payload.effectiveFrom,
    );
    const blockingAssignments = overlappingAssignments.filter(
      (assignment) => assignment.effectiveFrom >= payload.effectiveFrom,
    );

    if (blockingAssignments.length > 0) {
      throw new ConflictException(
        ERROR_MESSAGES.TIMETABLE.ASSIGNMENT_DATE_RANGE_INVALID,
      );
    }

    await this.db.transaction(async (tx) => {
      for (const assignment of truncatableAssignments) {
        await tx
          .update(timetableAssignments)
          .set({
            effectiveTo: getPreviousDateString(payload.effectiveFrom),
          })
          .where(eq(timetableAssignments.id, assignment.id));
      }

      await tx
        .update(timetableVersions)
        .set({
          status: STATUS.TIMETABLE_VERSION.PUBLISHED,
          publishedAt: new Date(),
          updatedByUserId: authSession.user.id,
        })
        .where(eq(timetableVersions.id, versionId));

      await tx.insert(timetableAssignments).values({
        id: randomUUID(),
        institutionId,
        campusId: version.campusId,
        classId: version.classId,
        sectionId: version.sectionId,
        timetableVersionId: versionId,
        effectiveFrom: payload.effectiveFrom,
        effectiveTo: payload.effectiveTo ?? null,
        status: STATUS.TIMETABLE_ASSIGNMENT.ACTIVE,
      });
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.EXECUTE,
        entityType: AUDIT_ENTITY_TYPES.TIMETABLE,
        entityId: versionId,
        entityLabel: version.name,
        summary: `Published timetable version ${version.name}.`,
      })
      .catch(() => {});

    return this.getTimetableVersionById(institutionId, versionId);
  }

  async setTimetableVersionStatus(
    institutionId: string,
    versionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetTimetableVersionStatusDto,
  ) {
    const version = await this.getVersionRecord(institutionId, versionId);
    await this.assertVersionScopeAccessible(institutionId, version, scopes);

    if (payload.status === STATUS.TIMETABLE_VERSION.PUBLISHED) {
      throw new ConflictException(
        ERROR_MESSAGES.TIMETABLE.VERSION_PUBLISHED_ONLY,
      );
    }

    await this.db
      .update(timetableVersions)
      .set({
        status: payload.status,
        updatedByUserId: authSession.user.id,
      })
      .where(eq(timetableVersions.id, versionId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.TIMETABLE,
        entityId: versionId,
        entityLabel: version.name,
        summary: `Set timetable version ${version.name} status to ${payload.status}.`,
      })
      .catch(() => {});

    return this.getTimetableVersionById(institutionId, versionId);
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

    const staffMember = await this.getStaffMember(
      institutionId,
      campusId,
      query.staffId,
    );
    const resolutionDate = query.date ?? getTodayDateString();

    const versionRows = await this.db
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
      .from(timetableAssignments)
      .innerJoin(
        timetableVersions,
        eq(timetableAssignments.timetableVersionId, timetableVersions.id),
      )
      .innerJoin(
        timetableEntries,
        eq(timetableEntries.timetableVersionId, timetableVersions.id),
      )
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(schoolClasses, eq(timetableEntries.classId, schoolClasses.id))
      .innerJoin(
        classSections,
        eq(timetableEntries.sectionId, classSections.id),
      )
      .leftJoin(member, eq(timetableEntries.staffId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(timetableAssignments.institutionId, institutionId),
          eq(timetableAssignments.campusId, campusId),
          eq(timetableAssignments.status, STATUS.TIMETABLE_ASSIGNMENT.ACTIVE),
          lte(timetableAssignments.effectiveFrom, resolutionDate),
          or(
            isNull(timetableAssignments.effectiveTo),
            gte(timetableAssignments.effectiveTo, resolutionDate),
          ),
          eq(timetableVersions.status, STATUS.TIMETABLE_VERSION.PUBLISHED),
          eq(timetableEntries.staffId, query.staffId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.periodIndex),
      );

    const versionSectionIds = [
      ...new Set(versionRows.map((row) => row.sectionId)),
    ];
    const legacyConditions: SQL[] = [
      eq(timetableEntries.institutionId, institutionId),
      eq(timetableEntries.campusId, campusId),
      eq(timetableEntries.staffId, query.staffId),
      isNull(timetableEntries.timetableVersionId),
      ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
    ];

    if (versionSectionIds.length > 0) {
      legacyConditions.push(
        ne(timetableEntries.sectionId, versionSectionIds[0]),
      );
      for (const sectionId of versionSectionIds.slice(1)) {
        legacyConditions.push(ne(timetableEntries.sectionId, sectionId));
      }
    }

    const legacyRows = await this.db
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
      .innerJoin(
        classSections,
        eq(timetableEntries.sectionId, classSections.id),
      )
      .leftJoin(member, eq(timetableEntries.staffId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .where(and(...legacyConditions))
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.periodIndex),
      );

    return {
      staffId: staffMember.id,
      staffName: staffMember.name,
      resolutionDate,
      entries: [...versionRows, ...legacyRows],
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
    const version = await this.getVersionRecord(
      institutionId,
      payload.versionId,
    );
    await this.assertVersionScopeAccessible(institutionId, version, scopes);

    if (
      version.classId !== payload.classId ||
      version.sectionId !== sectionId ||
      version.status !== STATUS.TIMETABLE_VERSION.DRAFT
    ) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.VERSION_ARCHIVED);
    }

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
            eq(timetableEntries.timetableVersionId, payload.versionId),
            ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          ),
        );

      if (payload.entries.length === 0) {
        return;
      }

      await tx
        .insert(timetableEntries)
        .values(
          payload.entries.map((entry) =>
            this.buildTimetableEntryRow(
              institutionId,
              sectionScope.campusId,
              payload.classId,
              sectionId,
              payload.versionId,
              entry,
            ),
          ),
        );
    });

    return this.getSectionTimetableSnapshot(
      institutionId,
      sectionScope.campusId,
      payload.classId,
      sectionId,
      { versionId: payload.versionId },
    );
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
      targetScope.sectionId === sourceScope.sectionId &&
      payload.versionId === payload.sourceVersionId
    ) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.COPY_SAME_SECTION);
    }

    if (targetScope.campusId !== sourceScope.campusId) {
      throw new NotFoundException(
        ERROR_MESSAGES.TIMETABLE.COPY_SOURCE_NOT_FOUND,
      );
    }

    const targetVersion = await this.getVersionRecord(
      institutionId,
      payload.versionId,
    );
    await this.assertVersionScopeAccessible(
      institutionId,
      targetVersion,
      scopes,
    );

    if (targetVersion.status !== STATUS.TIMETABLE_VERSION.DRAFT) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.VERSION_ARCHIVED);
    }

    let sourceEntries = payload.sourceVersionId
      ? await this.fetchVersionEntries(institutionId, payload.sourceVersionId)
      : [];

    if (!payload.sourceVersionId) {
      const sourceSnapshot = await this.getSectionTimetableSnapshot(
        institutionId,
        sourceScope.campusId,
        sourceScope.classId,
        sourceScope.sectionId,
      );

      sourceEntries =
        sourceSnapshot?.entries.map((entry) => ({
          ...entry,
          subjectId: entry.subjectId,
        })) ?? [];
    }

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
            eq(timetableEntries.timetableVersionId, payload.versionId),
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
          timetableVersionId: payload.versionId,
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

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.EXECUTE,
        entityType: AUDIT_ENTITY_TYPES.TIMETABLE,
        entityId: payload.versionId,
        entityLabel: targetVersion.name,
        summary: `Copied timetable from ${sourceScope.className} ${sourceScope.sectionName} to ${targetScope.className} ${targetScope.sectionName}.`,
      })
      .catch(() => {});

    return this.getSectionTimetableSnapshot(
      institutionId,
      targetScope.campusId,
      targetScope.classId,
      targetScope.sectionId,
      { versionId: payload.versionId },
    );
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
    options?: { date?: string; versionId?: string },
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

    if (options?.versionId) {
      const version = await this.getVersionRecord(
        institutionId,
        options.versionId,
      );
      const entries = await this.fetchVersionEntries(institutionId, version.id);

      return {
        ...scope,
        versionId: version.id,
        versionName: version.name,
        versionStatus: version.status,
        bellScheduleId: version.bellScheduleId,
        bellScheduleName: version.bellScheduleName,
        resolutionDate: options.date ?? getTodayDateString(),
        entries,
      };
    }

    const resolutionDate = options?.date ?? getTodayDateString();
    const resolvedVersion = await this.resolveActiveVersionForSection(
      institutionId,
      scope,
      resolutionDate,
    );

    if (!resolvedVersion) {
      const legacyEntries = await this.fetchLegacySectionEntries(
        institutionId,
        campusId,
        classId,
        sectionId,
      );

      return {
        ...scope,
        versionId: null,
        versionName: null,
        versionStatus: null,
        bellScheduleId: null,
        bellScheduleName: null,
        resolutionDate,
        entries: legacyEntries,
      };
    }

    const entries = await this.fetchVersionEntries(
      institutionId,
      resolvedVersion.version.id,
    );

    return {
      ...scope,
      versionId: resolvedVersion.version.id,
      versionName: resolvedVersion.version.name,
      versionStatus: resolvedVersion.version.status,
      bellScheduleId: resolvedVersion.version.bellScheduleId,
      bellScheduleName: resolvedVersion.version.bellScheduleName,
      resolutionDate,
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

  private async fetchVersionEntries(institutionId: string, versionId: string) {
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
          eq(timetableEntries.timetableVersionId, versionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.periodIndex),
      );
  }

  private async fetchLegacySectionEntries(
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
          isNull(timetableEntries.timetableVersionId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.periodIndex),
      );
  }

  private async resolveActiveVersionForSection(
    institutionId: string,
    scope: SectionScope,
    resolutionDate: string,
  ): Promise<ResolvedVersionAssignment | null> {
    let assignment = await this.findActiveVersionAssignment(
      institutionId,
      scope.classId,
      scope.sectionId,
      resolutionDate,
    );

    if (!assignment) {
      await this.ensureLegacyVersionForSection(institutionId, scope);
      assignment = await this.findActiveVersionAssignment(
        institutionId,
        scope.classId,
        scope.sectionId,
        resolutionDate,
      );
    }

    return assignment;
  }

  private async findActiveVersionAssignment(
    institutionId: string,
    classId: string,
    sectionId: string,
    resolutionDate: string,
  ): Promise<ResolvedVersionAssignment | null> {
    const [row] = await this.db
      .select({
        effectiveFrom: timetableAssignments.effectiveFrom,
        effectiveTo: timetableAssignments.effectiveTo,
        id: timetableVersions.id,
        institutionId: timetableVersions.institutionId,
        campusId: timetableVersions.campusId,
        classId: timetableVersions.classId,
        sectionId: timetableVersions.sectionId,
        bellScheduleId: timetableVersions.bellScheduleId,
        bellScheduleName: bellSchedules.name,
        academicYearId: timetableVersions.academicYearId,
        name: timetableVersions.name,
        notes: timetableVersions.notes,
        status: timetableVersions.status,
        publishedAt: timetableVersions.publishedAt,
        createdAt: timetableVersions.createdAt,
        updatedAt: timetableVersions.updatedAt,
      })
      .from(timetableAssignments)
      .innerJoin(
        timetableVersions,
        eq(timetableAssignments.timetableVersionId, timetableVersions.id),
      )
      .innerJoin(
        bellSchedules,
        eq(timetableVersions.bellScheduleId, bellSchedules.id),
      )
      .where(
        and(
          eq(timetableAssignments.institutionId, institutionId),
          eq(timetableAssignments.classId, classId),
          eq(timetableAssignments.sectionId, sectionId),
          eq(timetableAssignments.status, STATUS.TIMETABLE_ASSIGNMENT.ACTIVE),
          eq(timetableVersions.status, STATUS.TIMETABLE_VERSION.PUBLISHED),
          lte(timetableAssignments.effectiveFrom, resolutionDate),
          or(
            isNull(timetableAssignments.effectiveTo),
            gte(timetableAssignments.effectiveTo, resolutionDate),
          ),
        ),
      )
      .orderBy(
        desc(timetableAssignments.effectiveFrom),
        desc(timetableVersions.publishedAt),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      version: {
        id: row.id,
        institutionId: row.institutionId,
        campusId: row.campusId,
        classId: row.classId,
        sectionId: row.sectionId,
        bellScheduleId: row.bellScheduleId,
        bellScheduleName: row.bellScheduleName,
        academicYearId: row.academicYearId,
        name: row.name,
        notes: row.notes,
        status: row.status,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };
  }

  private async ensureLegacyVersionForSection(
    institutionId: string,
    scope: SectionScope,
    actorUserId?: string,
  ) {
    const [existingVersion] = await this.db
      .select({ id: timetableVersions.id })
      .from(timetableVersions)
      .where(
        and(
          eq(timetableVersions.institutionId, institutionId),
          eq(timetableVersions.classId, scope.classId),
          eq(timetableVersions.sectionId, scope.sectionId),
        ),
      )
      .limit(1);

    if (existingVersion) {
      return;
    }

    const legacyEntries = await this.fetchLegacySectionEntries(
      institutionId,
      scope.campusId,
      scope.classId,
      scope.sectionId,
    );

    if (legacyEntries.length === 0) {
      return;
    }

    const inferredBellScheduleId =
      (await this.inferLegacyBellScheduleId(
        legacyEntries
          .map((entry) => entry.bellSchedulePeriodId)
          .filter((value): value is string => Boolean(value)),
      )) ??
      (await this.getSuggestedDefaultBellScheduleId(
        institutionId,
        scope.campusId,
      ));

    if (!inferredBellScheduleId) {
      return;
    }

    const academicYearId = await this.getCurrentAcademicYearId(institutionId);
    const versionId = randomUUID();
    const today = getTodayDateString();

    await this.db.transaction(async (tx) => {
      await tx.insert(timetableVersions).values({
        id: versionId,
        institutionId,
        campusId: scope.campusId,
        classId: scope.classId,
        sectionId: scope.sectionId,
        academicYearId,
        bellScheduleId: inferredBellScheduleId,
        name: IMPORTED_LIVE_TIMETABLE_NAME,
        status: STATUS.TIMETABLE_VERSION.PUBLISHED,
        publishedAt: new Date(),
        createdByUserId: actorUserId ?? null,
        updatedByUserId: actorUserId ?? null,
      });

      await tx
        .update(timetableEntries)
        .set({ timetableVersionId: versionId })
        .where(
          and(
            eq(timetableEntries.institutionId, institutionId),
            eq(timetableEntries.classId, scope.classId),
            eq(timetableEntries.sectionId, scope.sectionId),
            isNull(timetableEntries.timetableVersionId),
            ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
          ),
        );

      await tx.insert(timetableAssignments).values({
        id: randomUUID(),
        institutionId,
        campusId: scope.campusId,
        classId: scope.classId,
        sectionId: scope.sectionId,
        timetableVersionId: versionId,
        effectiveFrom: today,
        effectiveTo: null,
        status: STATUS.TIMETABLE_ASSIGNMENT.ACTIVE,
      });
    });
  }

  private async inferLegacyBellScheduleId(periodIds: string[]) {
    if (periodIds.length === 0) {
      return null;
    }

    const [row] = await this.db
      .select({ bellScheduleId: bellSchedulePeriods.bellScheduleId })
      .from(bellSchedulePeriods)
      .where(inArray(bellSchedulePeriods.id, periodIds))
      .limit(1);

    return row?.bellScheduleId ?? null;
  }

  private async getSuggestedDefaultBellScheduleId(
    institutionId: string,
    campusId: string,
  ) {
    const [row] = await this.db
      .select({ id: bellSchedules.id })
      .from(bellSchedules)
      .where(
        and(
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          eq(bellSchedules.isDefault, true),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      )
      .limit(1);

    return row?.id ?? null;
  }

  private async getCurrentAcademicYearId(institutionId: string) {
    const [row] = await this.db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.institutionId, institutionId),
          eq(academicYears.isCurrent, true),
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
        ),
      )
      .limit(1);

    return row?.id ?? null;
  }

  private async listOverlappingAssignments(
    institutionId: string,
    classId: string,
    sectionId: string,
    effectiveFrom: string,
    effectiveTo: string | null,
    excludedVersionId: string,
  ) {
    const rows = await this.db
      .select({
        id: timetableAssignments.id,
        effectiveFrom: timetableAssignments.effectiveFrom,
        effectiveTo: timetableAssignments.effectiveTo,
      })
      .from(timetableAssignments)
      .where(
        and(
          eq(timetableAssignments.institutionId, institutionId),
          eq(timetableAssignments.classId, classId),
          eq(timetableAssignments.sectionId, sectionId),
          eq(timetableAssignments.status, STATUS.TIMETABLE_ASSIGNMENT.ACTIVE),
          ne(timetableAssignments.timetableVersionId, excludedVersionId),
        ),
      );

    return rows.filter((row) =>
      dateRangesOverlap(
        row.effectiveFrom,
        row.effectiveTo,
        effectiveFrom,
        effectiveTo,
      ),
    );
  }

  private async getTimetableVersionById(
    institutionId: string,
    versionId: string,
  ) {
    const version = await this.getVersionRecord(institutionId, versionId);
    const entries = await this.fetchVersionEntries(institutionId, versionId);
    const [assignment] = await this.db
      .select({
        effectiveFrom: timetableAssignments.effectiveFrom,
        effectiveTo: timetableAssignments.effectiveTo,
      })
      .from(timetableAssignments)
      .where(
        and(
          eq(timetableAssignments.institutionId, institutionId),
          eq(timetableAssignments.timetableVersionId, versionId),
          eq(timetableAssignments.status, STATUS.TIMETABLE_ASSIGNMENT.ACTIVE),
        ),
      )
      .orderBy(desc(timetableAssignments.effectiveFrom))
      .limit(1);

    return this.mapTimetableVersion(version, {
      entryCount: entries.length,
      effectiveFrom: assignment?.effectiveFrom ?? null,
      effectiveTo: assignment?.effectiveTo ?? null,
      isLive:
        Boolean(assignment) &&
        assignment.effectiveFrom <= getTodayDateString() &&
        (!assignment.effectiveTo ||
          assignment.effectiveTo >= getTodayDateString()),
    });
  }

  private mapTimetableVersion(
    version: VersionRecord,
    assignment: {
      entryCount: number;
      effectiveFrom: string | null;
      effectiveTo: string | null;
      isLive: boolean;
    },
  ) {
    return {
      id: version.id,
      classId: version.classId,
      sectionId: version.sectionId,
      bellScheduleId: version.bellScheduleId,
      bellScheduleName: version.bellScheduleName,
      name: version.name,
      status: version.status,
      notes: version.notes,
      academicYearId: version.academicYearId,
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: assignment.effectiveTo,
      publishedAt: version.publishedAt?.toISOString() ?? null,
      entryCount: assignment.entryCount,
      isLive: assignment.isLive,
    };
  }

  private async getVersionRecord(
    institutionId: string,
    versionId: string,
  ): Promise<VersionRecord> {
    const [row] = await this.db
      .select({
        id: timetableVersions.id,
        institutionId: timetableVersions.institutionId,
        campusId: timetableVersions.campusId,
        classId: timetableVersions.classId,
        sectionId: timetableVersions.sectionId,
        bellScheduleId: timetableVersions.bellScheduleId,
        bellScheduleName: bellSchedules.name,
        academicYearId: timetableVersions.academicYearId,
        name: timetableVersions.name,
        notes: timetableVersions.notes,
        status: timetableVersions.status,
        publishedAt: timetableVersions.publishedAt,
        createdAt: timetableVersions.createdAt,
        updatedAt: timetableVersions.updatedAt,
      })
      .from(timetableVersions)
      .innerJoin(
        bellSchedules,
        eq(timetableVersions.bellScheduleId, bellSchedules.id),
      )
      .where(
        and(
          eq(timetableVersions.id, versionId),
          eq(timetableVersions.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.TIMETABLE.VERSION_NOT_FOUND);
    }

    return row;
  }

  private async assertVersionScopeAccessible(
    institutionId: string,
    version: VersionRecord,
    scopes: ResolvedScopes,
  ) {
    await this.getSectionScope(
      institutionId,
      version.classId,
      version.sectionId,
      scopes,
    );
  }

  private async assertBellScheduleUsable(
    institutionId: string,
    campusId: string,
    bellScheduleId: string,
  ) {
    const [row] = await this.db
      .select({ id: bellSchedules.id, status: bellSchedules.status })
      .from(bellSchedules)
      .where(
        and(
          eq(bellSchedules.id, bellScheduleId),
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.ARCHIVED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.BELL_SCHEDULES.SCHEDULE_NOT_FOUND,
      );
    }
  }

  private async assertVersionNameAvailable(
    institutionId: string,
    sectionId: string,
    name: string,
    excludeVersionId?: string,
  ) {
    const conditions: SQL[] = [
      eq(timetableVersions.institutionId, institutionId),
      eq(timetableVersions.sectionId, sectionId),
      eq(timetableVersions.name, name.trim()),
      ne(timetableVersions.status, STATUS.TIMETABLE_VERSION.ARCHIVED),
    ];

    if (excludeVersionId) {
      conditions.push(ne(timetableVersions.id, excludeVersionId));
    }

    const [row] = await this.db
      .select({ id: timetableVersions.id })
      .from(timetableVersions)
      .where(and(...conditions))
      .limit(1);

    if (row) {
      throw new ConflictException(ERROR_MESSAGES.TIMETABLE.VERSION_NAME_EXISTS);
    }
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
    await this.assertNoRoomConflicts(
      institutionId,
      campusId,
      sectionId,
      entries,
    );
  }

  private buildTimetableEntryRow(
    institutionId: string,
    campusId: string,
    classId: string,
    sectionId: string,
    versionId: string,
    entry: TimetableEntryInput,
  ) {
    return {
      id: randomUUID(),
      institutionId,
      campusId,
      classId,
      sectionId,
      timetableVersionId: versionId,
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
    const staffIds = [
      ...new Set(
        entries.flatMap((entry) => (entry.staffId ? [entry.staffId] : [])),
      ),
    ];
    if (staffIds.length === 0) {
      return;
    }

    const slotConditions = this.buildSlotConditions(entries, () =>
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
          eq(
            timetableEntries.dayOfWeek,
            dayOfWeek as TimetableEntryInput["dayOfWeek"],
          ),
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

    const validConditions = conditions.filter((condition): condition is SQL =>
      Boolean(condition),
    );

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

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getPreviousDateString(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function dateRangesOverlap(
  leftStart: string,
  leftEnd: string | null,
  rightStart: string,
  rightEnd: string | null,
) {
  const normalizedLeftEnd = leftEnd ?? "9999-12-31";
  const normalizedRightEnd = rightEnd ?? "9999-12-31";

  return leftStart <= normalizedRightEnd && rightStart <= normalizedLeftEnd;
}
