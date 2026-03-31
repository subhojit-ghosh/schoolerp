import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  classSections,
  count,
  desc,
  eq,
  gte,
  homework,
  homeworkSubmissions,
  ilike,
  isNull,
  lte,
  member,
  schoolClasses,
  sql,
  students,
  subjects,
  type AppDatabase,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  HOMEWORK_SUBMISSION_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { AuditService } from "../audit/audit.service";
import type {
  BulkUpsertSubmissionsDto,
  CreateHomeworkDto,
  ListHomeworkQueryDto,
  ListSubmissionsQueryDto,
  UpdateHomeworkDto,
} from "./homework.schemas";
import { user, alias } from "@repo/database";

const sortableColumns = {
  dueDate: homework.dueDate,
  title: homework.title,
  status: homework.status,
  publishedAt: homework.publishedAt,
  createdAt: homework.createdAt,
} as const;

@Injectable()
export class HomeworkService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listHomework(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListHomeworkQueryDto,
  ) {
    const conditions = [
      eq(homework.institutionId, institutionId),
      isNull(homework.deletedAt),
    ];

    const scopeFilter = sectionScopeFilter(homework.sectionId, scopes);
    if (scopeFilter) conditions.push(scopeFilter);

    if (query.campusId)
      conditions.push(eq(schoolClasses.campusId, query.campusId));
    if (query.classId) conditions.push(eq(homework.classId, query.classId));
    if (query.sectionId)
      conditions.push(eq(homework.sectionId, query.sectionId));
    if (query.subjectId)
      conditions.push(eq(homework.subjectId, query.subjectId));
    if (query.status) conditions.push(eq(homework.status, query.status));
    if (query.from) conditions.push(gte(homework.dueDate, query.from));
    if (query.to) conditions.push(lte(homework.dueDate, query.to));
    if (query.q) conditions.push(ilike(homework.title, `%${query.q}%`));

    const where = and(...conditions)!;
    const pageSize = resolveTablePageSize(query.limit);
    const sortCol = sortableColumns[query.sort] ?? sortableColumns.dueDate;
    const sortDir = query.order === SORT_ORDERS.DESC ? desc : asc;

    const createdByUser = alias(user, "created_by_user");
    const createdByMember = alias(member, "created_by_member");

    const countQuery = this.db.select({ count: count() }).from(homework);
    if (query.campusId) {
      countQuery.innerJoin(
        schoolClasses,
        eq(homework.classId, schoolClasses.id),
      );
    }
    const [totalRow] = await countQuery.where(where);
    const total = Number(totalRow?.count ?? 0);
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: homework.id,
        institutionId: homework.institutionId,
        classId: homework.classId,
        className: schoolClasses.name,
        sectionId: homework.sectionId,
        sectionName: classSections.name,
        subjectId: homework.subjectId,
        subjectName: subjects.name,
        createdByMemberId: homework.createdByMemberId,
        createdByName: createdByUser.name,
        title: homework.title,
        description: homework.description,
        attachmentInstructions: homework.attachmentInstructions,
        dueDate: homework.dueDate,
        status: homework.status,
        parentVisible: homework.parentVisible,
        attachmentUrl: homework.attachmentUrl,
        publishedAt: homework.publishedAt,
        createdAt: homework.createdAt,
        updatedAt: homework.updatedAt,
      })
      .from(homework)
      .innerJoin(schoolClasses, eq(homework.classId, schoolClasses.id))
      .innerJoin(classSections, eq(homework.sectionId, classSections.id))
      .innerJoin(subjects, eq(homework.subjectId, subjects.id))
      .innerJoin(
        createdByMember,
        eq(homework.createdByMemberId, createdByMember.id),
      )
      .innerJoin(createdByUser, eq(createdByMember.userId, createdByUser.id))
      .where(where)
      .orderBy(sortDir(sortCol))
      .limit(pageSize)
      .offset((pagination.page - 1) * pageSize);

    return {
      rows: rows.map((r) => this.toDto(r)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getHomework(
    institutionId: string,
    scopes: ResolvedScopes,
    homeworkId: string,
  ) {
    const row = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(row.sectionId, scopes);
    return row;
  }

  async createHomework(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    dto: CreateHomeworkDto,
  ) {
    this.assertScopeAccess(dto.sectionId, scopes);

    const [memberRow] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, authSession.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .limit(1);

    if (!memberRow) {
      throw new ForbiddenException("Staff membership not found.");
    }

    const id = randomUUID();
    await this.db.insert(homework).values({
      id,
      institutionId,
      classId: dto.classId,
      sectionId: dto.sectionId,
      subjectId: dto.subjectId,
      createdByMemberId: memberRow.id,
      title: dto.title,
      description: dto.description ?? null,
      attachmentInstructions: dto.attachmentInstructions ?? null,
      dueDate: dto.dueDate,
      status: "draft",
      parentVisible: dto.parentVisible ?? true,
      attachmentUrl: dto.attachmentUrl ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.HOMEWORK,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created homework "${dto.title}"`,
    });

    return this.fetchHomework(institutionId, id);
  }

  async updateHomework(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    homeworkId: string,
    dto: UpdateHomeworkDto,
  ) {
    const existing = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(existing.sectionId, scopes);
    if (dto.sectionId && dto.sectionId !== existing.sectionId) {
      this.assertScopeAccess(dto.sectionId, scopes);
    }

    await this.db
      .update(homework)
      .set({
        ...(dto.classId !== undefined && { classId: dto.classId }),
        ...(dto.sectionId !== undefined && { sectionId: dto.sectionId }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.attachmentInstructions !== undefined && {
          attachmentInstructions: dto.attachmentInstructions,
        }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.parentVisible !== undefined && {
          parentVisible: dto.parentVisible,
        }),
        ...(dto.attachmentUrl !== undefined && {
          attachmentUrl: dto.attachmentUrl,
        }),
      })
      .where(eq(homework.id, homeworkId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOMEWORK,
      entityId: homeworkId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated homework "${dto.title ?? existing.title}"`,
    });

    return this.fetchHomework(institutionId, homeworkId);
  }

  async publishHomework(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    homeworkId: string,
  ) {
    const existing = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(existing.sectionId, scopes);

    if (existing.status === "published") {
      throw new BadRequestException(ERROR_MESSAGES.HOMEWORK.ALREADY_PUBLISHED);
    }

    const publishedAt = new Date();
    await this.db
      .update(homework)
      .set({ status: "published", publishedAt })
      .where(eq(homework.id, homeworkId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.MARK,
      entityType: AUDIT_ENTITY_TYPES.HOMEWORK,
      entityId: homeworkId,
      entityLabel: existing.title,
      summary: `Published homework "${existing.title}"`,
    });

    return this.fetchHomework(institutionId, homeworkId);
  }

  async deleteHomework(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    homeworkId: string,
  ) {
    const existing = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(existing.sectionId, scopes);

    await this.db
      .update(homework)
      .set({ deletedAt: new Date() })
      .where(eq(homework.id, homeworkId));

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITY_TYPES.HOMEWORK,
      entityId: homeworkId,
      entityLabel: existing.title,
      summary: `Deleted homework "${existing.title}"`,
    });
  }

  // ── Submission tracking ──────────────────────────────────────────────────

  async bulkUpsertSubmissions(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    homeworkId: string,
    dto: BulkUpsertSubmissionsDto,
  ) {
    const hw = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(hw.sectionId, scopes);

    if (hw.status !== "published") {
      throw new BadRequestException(
        ERROR_MESSAGES.HOMEWORK_DEPTH.HOMEWORK_NOT_PUBLISHED,
      );
    }

    const [memberRow] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, authSession.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .limit(1);

    if (!memberRow) {
      throw new ForbiddenException("Staff membership not found.");
    }

    const now = new Date();
    const results: string[] = [];

    for (const entry of dto.submissions) {
      const submissionId = randomUUID();
      const submittedAt =
        entry.status === HOMEWORK_SUBMISSION_STATUS.SUBMITTED ||
        entry.status === HOMEWORK_SUBMISSION_STATUS.LATE
          ? now
          : null;

      await this.db
        .insert(homeworkSubmissions)
        .values({
          id: submissionId,
          institutionId,
          homeworkId,
          studentId: entry.studentId,
          status: entry.status,
          submittedAt,
          remarks: entry.remarks ?? null,
          attachmentUrl: entry.attachmentUrl ?? null,
          markedByMemberId: memberRow.id,
        })
        .onConflictDoUpdate({
          target: [
            homeworkSubmissions.homeworkId,
            homeworkSubmissions.studentId,
          ],
          set: {
            status: sql`excluded.status`,
            submittedAt: sql`excluded.submitted_at`,
            remarks: sql`excluded.remarks`,
            attachmentUrl: sql`excluded.attachment_url`,
            markedByMemberId: sql`excluded.marked_by_member_id`,
          },
        });

      results.push(entry.studentId);
    }

    await this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.HOMEWORK_SUBMISSION,
      entityId: homeworkId,
      entityLabel: hw.title,
      summary: `Marked ${results.length} submission(s) for homework "${hw.title}"`,
    });

    return { updated: results.length };
  }

  async listSubmissions(
    institutionId: string,
    scopes: ResolvedScopes,
    homeworkId: string,
    query: ListSubmissionsQueryDto,
  ) {
    const hw = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(hw.sectionId, scopes);

    const markedByUser = alias(user, "marked_by_user");
    const markedByMember = alias(member, "marked_by_member");

    const conditions = [
      eq(homeworkSubmissions.homeworkId, homeworkId),
      eq(homeworkSubmissions.institutionId, institutionId),
    ];
    const where = and(...conditions)!;

    const pageSize = resolveTablePageSize(query.limit);

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .where(where);
    const total = Number(totalRow?.count ?? 0);
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        studentId: homeworkSubmissions.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        status: homeworkSubmissions.status,
        submittedAt: homeworkSubmissions.submittedAt,
        remarks: homeworkSubmissions.remarks,
        attachmentUrl: homeworkSubmissions.attachmentUrl,
        markedByMemberId: homeworkSubmissions.markedByMemberId,
        markedByName: markedByUser.name,
        createdAt: homeworkSubmissions.createdAt,
        updatedAt: homeworkSubmissions.updatedAt,
      })
      .from(homeworkSubmissions)
      .innerJoin(students, eq(homeworkSubmissions.studentId, students.id))
      .leftJoin(
        markedByMember,
        eq(homeworkSubmissions.markedByMemberId, markedByMember.id),
      )
      .leftJoin(markedByUser, eq(markedByMember.userId, markedByUser.id))
      .where(where)
      .orderBy(asc(students.firstName))
      .limit(pageSize)
      .offset((pagination.page - 1) * pageSize);

    return {
      rows: rows.map((r) => this.toSubmissionDto(r)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getHomeworkAnalytics(
    institutionId: string,
    scopes: ResolvedScopes,
    homeworkId: string,
  ) {
    const hw = await this.fetchHomework(institutionId, homeworkId);
    this.assertScopeAccess(hw.sectionId, scopes);

    // Count students in this section
    const [studentCountRow] = await this.db
      .select({ count: count() })
      .from(students)
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.sectionId, hw.sectionId),
        ),
      );
    const totalStudents = Number(studentCountRow?.count ?? 0);

    // Count submissions by status
    const statusCounts = await this.db
      .select({
        status: homeworkSubmissions.status,
        count: count(),
      })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.homeworkId, homeworkId),
          eq(homeworkSubmissions.institutionId, institutionId),
        ),
      )
      .groupBy(homeworkSubmissions.status);

    let submitted = 0;
    let notSubmitted = 0;
    let late = 0;

    for (const row of statusCounts) {
      const c = Number(row.count);
      if (row.status === HOMEWORK_SUBMISSION_STATUS.SUBMITTED) submitted = c;
      else if (row.status === HOMEWORK_SUBMISSION_STATUS.NOT_SUBMITTED)
        notSubmitted = c;
      else if (row.status === HOMEWORK_SUBMISSION_STATUS.LATE) late = c;
    }

    const submissionRate =
      totalStudents > 0
        ? Math.round(((submitted + late) / totalStudents) * 100)
        : 0;

    return {
      homeworkId,
      totalStudents,
      submitted,
      notSubmitted,
      late,
      submissionRate,
    };
  }

  async getClassAnalytics(
    institutionId: string,
    scopes: ResolvedScopes,
    classId: string,
  ) {
    // Get all sections for this class that the user has scope access to
    const conditions = [
      eq(homework.institutionId, institutionId),
      eq(homework.classId, classId),
      eq(homework.status, "published"),
      isNull(homework.deletedAt),
    ];

    const scopeFilter = sectionScopeFilter(homework.sectionId, scopes);
    if (scopeFilter) conditions.push(scopeFilter);

    const homeworkRows = await this.db
      .select({
        sectionId: homework.sectionId,
        sectionName: classSections.name,
        classId: homework.classId,
        className: schoolClasses.name,
        homeworkId: homework.id,
      })
      .from(homework)
      .innerJoin(schoolClasses, eq(homework.classId, schoolClasses.id))
      .innerJoin(classSections, eq(homework.sectionId, classSections.id))
      .where(and(...conditions));

    if (homeworkRows.length === 0) return [];

    // Group by section
    const sectionMap = new Map<
      string,
      {
        classId: string;
        className: string;
        sectionId: string;
        sectionName: string;
        homeworkIds: string[];
      }
    >();

    for (const row of homeworkRows) {
      const existing = sectionMap.get(row.sectionId);
      if (existing) {
        existing.homeworkIds.push(row.homeworkId);
      } else {
        sectionMap.set(row.sectionId, {
          classId: row.classId,
          className: row.className,
          sectionId: row.sectionId,
          sectionName: row.sectionName,
          homeworkIds: [row.homeworkId],
        });
      }
    }

    const results = [];

    for (const [, section] of sectionMap) {
      // Get total students in this section
      const [studentCountRow] = await this.db
        .select({ count: count() })
        .from(students)
        .where(
          and(
            eq(students.institutionId, institutionId),
            eq(students.sectionId, section.sectionId),
          ),
        );
      const totalStudents = Number(studentCountRow?.count ?? 0);

      if (totalStudents === 0) {
        results.push({
          classId: section.classId,
          className: section.className,
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          totalHomework: section.homeworkIds.length,
          avgSubmissionRate: 0,
        });
        continue;
      }

      // For each homework, compute submission rate
      let totalRate = 0;
      for (const hwId of section.homeworkIds) {
        const [submittedCount] = await this.db
          .select({ count: count() })
          .from(homeworkSubmissions)
          .where(
            and(
              eq(homeworkSubmissions.homeworkId, hwId),
              eq(homeworkSubmissions.institutionId, institutionId),
              sql`${homeworkSubmissions.status} IN ('submitted', 'late')`,
            ),
          );
        const done = Number(submittedCount?.count ?? 0);
        totalRate += (done / totalStudents) * 100;
      }

      const avgSubmissionRate =
        section.homeworkIds.length > 0
          ? Math.round(totalRate / section.homeworkIds.length)
          : 0;

      results.push({
        classId: section.classId,
        className: section.className,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        totalHomework: section.homeworkIds.length,
        avgSubmissionRate,
      });
    }

    return results;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private assertScopeAccess(sectionId: string, scopes: ResolvedScopes) {
    if (scopes.sectionIds === "all") return;
    if (!scopes.sectionIds.includes(sectionId)) {
      throw new ForbiddenException(ERROR_MESSAGES.HOMEWORK.SCOPE_DENIED);
    }
  }

  private async fetchHomework(institutionId: string, homeworkId: string) {
    const createdByUser = alias(user, "created_by_user");
    const createdByMember = alias(member, "created_by_member");

    const [row] = await this.db
      .select({
        id: homework.id,
        institutionId: homework.institutionId,
        classId: homework.classId,
        className: schoolClasses.name,
        sectionId: homework.sectionId,
        sectionName: classSections.name,
        subjectId: homework.subjectId,
        subjectName: subjects.name,
        createdByMemberId: homework.createdByMemberId,
        createdByName: createdByUser.name,
        title: homework.title,
        description: homework.description,
        attachmentInstructions: homework.attachmentInstructions,
        dueDate: homework.dueDate,
        status: homework.status,
        parentVisible: homework.parentVisible,
        attachmentUrl: homework.attachmentUrl,
        publishedAt: homework.publishedAt,
        createdAt: homework.createdAt,
        updatedAt: homework.updatedAt,
      })
      .from(homework)
      .innerJoin(schoolClasses, eq(homework.classId, schoolClasses.id))
      .innerJoin(classSections, eq(homework.sectionId, classSections.id))
      .innerJoin(subjects, eq(homework.subjectId, subjects.id))
      .innerJoin(
        createdByMember,
        eq(homework.createdByMemberId, createdByMember.id),
      )
      .innerJoin(createdByUser, eq(createdByMember.userId, createdByUser.id))
      .where(
        and(
          eq(homework.id, homeworkId),
          eq(homework.institutionId, institutionId),
          isNull(homework.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.HOMEWORK.NOT_FOUND);
    }

    return row;
  }

  private toDto(row: {
    id: string;
    institutionId: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    subjectId: string;
    subjectName: string;
    createdByMemberId: string;
    createdByName: string | null;
    title: string;
    description: string | null;
    attachmentInstructions: string | null;
    dueDate: string;
    status: string;
    parentVisible: boolean;
    attachmentUrl: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      institutionId: row.institutionId,
      classId: row.classId,
      className: row.className,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      createdByMemberId: row.createdByMemberId,
      createdByName: row.createdByName ?? "",
      title: row.title,
      description: row.description,
      attachmentInstructions: row.attachmentInstructions,
      dueDate: row.dueDate,
      status: row.status,
      parentVisible: row.parentVisible,
      attachmentUrl: row.attachmentUrl,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toSubmissionDto(row: {
    id: string;
    homeworkId: string;
    studentId: string;
    studentFirstName: string;
    studentLastName: string | null;
    admissionNumber: string;
    status: string;
    submittedAt: Date | null;
    remarks: string | null;
    attachmentUrl: string | null;
    markedByMemberId: string | null;
    markedByName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const studentName = row.studentLastName
      ? `${row.studentFirstName} ${row.studentLastName}`
      : row.studentFirstName;

    return {
      id: row.id,
      homeworkId: row.homeworkId,
      studentId: row.studentId,
      studentName,
      admissionNumber: row.admissionNumber,
      status: row.status,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      remarks: row.remarks,
      attachmentUrl: row.attachmentUrl,
      markedByMemberId: row.markedByMemberId,
      markedByName: row.markedByName ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
