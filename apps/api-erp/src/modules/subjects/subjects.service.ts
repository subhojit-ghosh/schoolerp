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
  count,
  desc,
  eq,
  ilike,
  ne,
  subjects,
  timetableEntries,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateSubjectDto,
  ListSubjectsQueryDto,
  SetSubjectStatusDto,
  UpdateSubjectDto,
} from "./subjects.schemas";
import {
  normalizeSubjectCode,
  normalizeSubjectName,
  sortableSubjectColumns,
} from "./subjects.schemas";

const sortableColumns = {
  code: subjects.code,
  name: subjects.name,
  status: subjects.status,
} as const;

@Injectable()
export class SubjectsService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listSubjects(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListSubjectsQueryDto = {},
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(scopedCampusId, scopes);
    await this.getCampus(institutionId, scopedCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableSubjectColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;

    const conditions: SQL[] = [
      eq(subjects.institutionId, institutionId),
      ne(subjects.status, STATUS.SUBJECT.DELETED),
    ];

    conditions.push(eq(subjects.campusId, scopedCampusId));

    if (query.search) {
      conditions.push(ilike(subjects.name, `%${query.search}%`));
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(subjects)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: subjects.id,
        institutionId: subjects.institutionId,
        campusId: subjects.campusId,
        campusName: campus.name,
        name: subjects.name,
        code: subjects.code,
        status: subjects.status,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .innerJoin(campus, eq(subjects.campusId, campus.id))
      .where(where)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(subjects.name))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows,
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getSubject(
    institutionId: string,
    subjectId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);

    const [row] = await this.db
      .select({
        id: subjects.id,
        institutionId: subjects.institutionId,
        campusId: subjects.campusId,
        campusName: campus.name,
        name: subjects.name,
        code: subjects.code,
        status: subjects.status,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .innerJoin(campus, eq(subjects.campusId, campus.id))
      .where(
        and(
          eq(subjects.id, subjectId),
          eq(subjects.institutionId, institutionId),
          eq(subjects.campusId, activeCampusId),
          ne(subjects.status, STATUS.SUBJECT.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.SUBJECTS.SUBJECT_NOT_FOUND);
    }

    return row;
  }

  async createSubject(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateSubjectDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getCampus(institutionId, campusId);
    await this.assertSubjectNameAvailable(
      institutionId,
      campusId,
      payload.name,
    );

    const subjectId = randomUUID();

    await this.db.insert(subjects).values({
      id: subjectId,
      institutionId,
      campusId,
      name: normalizeSubjectName(payload.name),
      code: normalizeSubjectCode(payload.code) ?? null,
      status: STATUS.SUBJECT.ACTIVE,
    });

    return this.getSubject(institutionId, subjectId, authSession, scopes);
  }

  async updateSubject(
    institutionId: string,
    subjectId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateSubjectDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getSubjectOrThrow(institutionId, subjectId, campusId);
    await this.assertSubjectNameAvailable(
      institutionId,
      campusId,
      payload.name,
      subjectId,
    );

    await this.db
      .update(subjects)
      .set({
        name: normalizeSubjectName(payload.name),
        code: normalizeSubjectCode(payload.code) ?? null,
      })
      .where(
        and(
          eq(subjects.id, subjectId),
          eq(subjects.institutionId, institutionId),
        ),
      );

    return this.getSubject(institutionId, subjectId, authSession, scopes);
  }

  async setSubjectStatus(
    institutionId: string,
    subjectId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetSubjectStatusDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getSubjectOrThrow(institutionId, subjectId, campusId);

    if (payload.status === STATUS.SUBJECT.INACTIVE) {
      await this.assertSubjectHasNoTimetableEntries(institutionId, subjectId);
    }

    await this.db
      .update(subjects)
      .set({
        status: payload.status,
      })
      .where(
        and(
          eq(subjects.id, subjectId),
          eq(subjects.institutionId, institutionId),
        ),
      );

    return this.getSubject(institutionId, subjectId, authSession, scopes);
  }

  async deleteSubject(
    institutionId: string,
    subjectId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getSubjectOrThrow(institutionId, subjectId, campusId);
    await this.assertSubjectHasNoTimetableEntries(institutionId, subjectId);

    await this.db
      .update(subjects)
      .set({
        status: STATUS.SUBJECT.DELETED,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(subjects.id, subjectId),
          eq(subjects.institutionId, institutionId),
        ),
      );
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [campusRecord] = await this.db
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!campusRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return campusRecord;
  }

  private async getSubjectOrThrow(
    institutionId: string,
    subjectId: string,
    campusId: string,
  ) {
    const [subjectRecord] = await this.db
      .select({
        id: subjects.id,
      })
      .from(subjects)
      .where(
        and(
          eq(subjects.id, subjectId),
          eq(subjects.institutionId, institutionId),
          eq(subjects.campusId, campusId),
          ne(subjects.status, STATUS.SUBJECT.DELETED),
        ),
      )
      .limit(1);

    if (!subjectRecord) {
      throw new NotFoundException(ERROR_MESSAGES.SUBJECTS.SUBJECT_NOT_FOUND);
    }

    return subjectRecord;
  }

  private async assertSubjectNameAvailable(
    institutionId: string,
    campusId: string,
    name: string,
    subjectIdToIgnore?: string,
  ) {
    const [subjectRecord] = await this.db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        and(
          eq(subjects.institutionId, institutionId),
          eq(subjects.campusId, campusId),
          eq(subjects.name, normalizeSubjectName(name)),
          ne(subjects.status, STATUS.SUBJECT.DELETED),
        ),
      )
      .limit(1);

    if (subjectRecord && subjectRecord.id !== subjectIdToIgnore) {
      throw new ConflictException(ERROR_MESSAGES.SUBJECTS.SUBJECT_NAME_EXISTS);
    }
  }

  private async assertSubjectHasNoTimetableEntries(
    institutionId: string,
    subjectId: string,
  ) {
    const [entry] = await this.db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.subjectId, subjectId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .limit(1);

    if (entry) {
      throw new ConflictException(
        ERROR_MESSAGES.SUBJECTS.SUBJECT_HAS_TIMETABLE_ENTRIES,
      );
    }
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
