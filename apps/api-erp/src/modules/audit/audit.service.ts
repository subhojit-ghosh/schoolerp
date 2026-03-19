import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  auditLogs,
  count,
  desc,
  eq,
  ilike,
  or,
  user,
  type AppDatabase,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { SORT_ORDERS } from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type { ListAuditLogsQuery, RecordAuditLogInput } from "./audit.schemas";
import { sortableAuditLogColumns } from "./audit.schemas";

type AuditLogWriter = Pick<AppDatabase, "insert">;

@Injectable()
export class AuditService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listAuditLogs(
    institutionId: string,
    query: ListAuditLogsQuery,
  ): Promise<
    PaginatedResult<{
      id: string;
      institutionId: string;
      action: string;
      entityType: string;
      entityId: string | null;
      entityLabel: string | null;
      summary: string;
      actor: {
        userId: string;
        name: string;
        mobile: string;
        campusId: string | null;
        contextKey: string | null;
      };
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>
  > {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableAuditLogColumns.createdAt;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;
    const conditions: SQL[] = [eq(auditLogs.institutionId, institutionId)];

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }

    if (query.entityType) {
      conditions.push(eq(auditLogs.entityType, query.entityType));
    }

    if (query.actorUserId) {
      conditions.push(eq(auditLogs.actorUserId, query.actorUserId));
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(auditLogs.summary, `%${query.search}%`),
          ilike(auditLogs.entityLabel, `%${query.search}%`),
          ilike(user.name, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(auditLogs)
      .innerJoin(user, eq(auditLogs.actorUserId, user.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);
    const sortableColumns = {
      [sortableAuditLogColumns.createdAt]: auditLogs.createdAt,
      [sortableAuditLogColumns.action]: auditLogs.action,
      [sortableAuditLogColumns.entityType]: auditLogs.entityType,
      [sortableAuditLogColumns.actor]: user.name,
    };

    const rows = await this.db
      .select({
        id: auditLogs.id,
        institutionId: auditLogs.institutionId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityLabel: auditLogs.entityLabel,
        summary: auditLogs.summary,
        actorUserId: auditLogs.actorUserId,
        actorName: user.name,
        actorMobile: user.mobile,
        actorCampusId: auditLogs.actorCampusId,
        actorContextKey: auditLogs.actorContextKey,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .innerJoin(user, eq(auditLogs.actorUserId, user.id))
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        desc(auditLogs.createdAt),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => ({
        id: row.id,
        institutionId: row.institutionId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId ?? null,
        entityLabel: row.entityLabel ?? null,
        summary: row.summary,
        actor: {
          userId: row.actorUserId,
          name: row.actorName,
          mobile: row.actorMobile,
          campusId: row.actorCampusId ?? null,
          contextKey: row.actorContextKey ?? null,
        },
        metadata: row.metadata ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async record(input: RecordAuditLogInput) {
    await this.db.insert(auditLogs).values(this.buildInsertValues(input));
  }

  async recordInTransaction(tx: AuditLogWriter, input: RecordAuditLogInput) {
    await tx.insert(auditLogs).values(this.buildInsertValues(input));
  }

  private buildInsertValues(input: RecordAuditLogInput) {
    return {
      id: randomUUID(),
      institutionId: input.institutionId,
      actorUserId: input.authSession.user.id,
      actorCampusId: input.authSession.activeCampusId,
      actorContextKey: input.authSession.activeContextKey,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      summary: input.summary,
      metadata: input.metadata ?? null,
    };
  }
}
