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
  ilike,
  isNull,
  lte,
  member,
  schoolClasses,
  subjects,
  type AppDatabase,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { AuditService } from "../audit/audit.service";
import type {
  CreateHomeworkDto,
  ListHomeworkQueryDto,
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

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(homework)
      .where(where);
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
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
