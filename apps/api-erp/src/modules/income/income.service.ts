import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
  sum,
  incomeRecords,
  member,
  user,
  type AppDatabase,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateRecordDto,
  UpdateRecordDto,
  ListRecordsQueryDto,
  IncomeSummaryQueryDto,
} from "./income.schemas";

// ── Sort maps ────────────────────────────────────────────────────────────────

const recordSortColumns = {
  incomeDate: incomeRecords.incomeDate,
  amountInPaise: incomeRecords.amountInPaise,
  createdAt: incomeRecords.createdAt,
} as const;

@Injectable()
export class IncomeService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Records ─────────────────────────────────────────────────────────────

  async listRecords(institutionId: string, query: ListRecordsQueryDto) {
    const {
      q,
      category,
      campusId,
      dateFrom,
      dateTo,
      page,
      limit,
      sort,
      order,
    } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = recordSortColumns[sort ?? "createdAt"];

    const conditions = [eq(incomeRecords.institutionId, institutionId)];
    if (category) {
      conditions.push(eq(incomeRecords.category, category));
    }
    if (campusId) {
      conditions.push(eq(incomeRecords.campusId, campusId));
    }
    if (dateFrom) {
      conditions.push(gte(incomeRecords.incomeDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(incomeRecords.incomeDate, dateTo));
    }
    if (q) {
      conditions.push(ilike(incomeRecords.title, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(incomeRecords)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: incomeRecords.id,
        campusId: incomeRecords.campusId,
        category: incomeRecords.category,
        title: incomeRecords.title,
        description: incomeRecords.description,
        amountInPaise: incomeRecords.amountInPaise,
        incomeDate: incomeRecords.incomeDate,
        sourceEntity: incomeRecords.sourceEntity,
        referenceNumber: incomeRecords.referenceNumber,
        recordedByMemberId: incomeRecords.recordedByMemberId,
        createdAt: incomeRecords.createdAt,
      })
      .from(incomeRecords)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve member names
    const memberIds = rows.map((r) => r.recordedByMemberId);
    const memberNames = await this.resolveMemberNames(memberIds);

    const mapped = rows.map((r) => ({
      id: r.id,
      campusId: r.campusId,
      category: r.category,
      title: r.title,
      description: r.description,
      amountInPaise: r.amountInPaise,
      incomeDate: r.incomeDate,
      sourceEntity: r.sourceEntity,
      referenceNumber: r.referenceNumber,
      recordedByMemberId: r.recordedByMemberId,
      recordedByName: memberNames.get(r.recordedByMemberId) ?? "Unknown",
      createdAt: r.createdAt,
    }));

    return { rows: mapped, total, page: safePage, pageSize, pageCount };
  }

  async createRecord(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateRecordDto,
  ) {
    const recordedByMemberId = await this.resolveCurrentMemberId(
      institutionId,
      session,
    );

    const id = randomUUID();
    await this.db.insert(incomeRecords).values({
      id,
      institutionId,
      campusId: dto.campusId ?? null,
      category: dto.category,
      title: dto.title,
      description: dto.description ?? null,
      amountInPaise: dto.amountInPaise,
      incomeDate: dto.incomeDate,
      sourceEntity: dto.sourceEntity ?? null,
      referenceNumber: dto.referenceNumber ?? null,
      receiptUploadId: dto.receiptUploadId ?? null,
      recordedByMemberId,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.INCOME_RECORD,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created income record "${dto.title}" (${dto.category}) for ${dto.amountInPaise} paise`,
    });

    return { id };
  }

  async getRecord(institutionId: string, recordId: string) {
    const rows = await this.db
      .select({
        id: incomeRecords.id,
        campusId: incomeRecords.campusId,
        category: incomeRecords.category,
        title: incomeRecords.title,
        description: incomeRecords.description,
        amountInPaise: incomeRecords.amountInPaise,
        incomeDate: incomeRecords.incomeDate,
        sourceEntity: incomeRecords.sourceEntity,
        referenceNumber: incomeRecords.referenceNumber,
        receiptUploadId: incomeRecords.receiptUploadId,
        recordedByMemberId: incomeRecords.recordedByMemberId,
        createdAt: incomeRecords.createdAt,
        updatedAt: incomeRecords.updatedAt,
      })
      .from(incomeRecords)
      .where(
        and(
          eq(incomeRecords.id, recordId),
          eq(incomeRecords.institutionId, institutionId),
        ),
      );

    const r = rows[0];
    if (!r) {
      throw new NotFoundException(ERROR_MESSAGES.INCOME.RECORD_NOT_FOUND);
    }

    const memberNames = await this.resolveMemberNames([r.recordedByMemberId]);

    return {
      ...r,
      recordedByName: memberNames.get(r.recordedByMemberId) ?? "Unknown",
    };
  }

  async updateRecord(
    institutionId: string,
    recordId: string,
    session: AuthenticatedSession,
    dto: UpdateRecordDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(incomeRecords)
      .where(
        and(
          eq(incomeRecords.id, recordId),
          eq(incomeRecords.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INCOME.RECORD_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.campusId !== undefined) updates.campusId = dto.campusId;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.amountInPaise !== undefined)
      updates.amountInPaise = dto.amountInPaise;
    if (dto.incomeDate !== undefined) updates.incomeDate = dto.incomeDate;
    if (dto.sourceEntity !== undefined) updates.sourceEntity = dto.sourceEntity;
    if (dto.referenceNumber !== undefined)
      updates.referenceNumber = dto.referenceNumber;
    if (dto.receiptUploadId !== undefined)
      updates.receiptUploadId = dto.receiptUploadId;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(incomeRecords)
        .set(updates)
        .where(eq(incomeRecords.id, recordId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.INCOME_RECORD,
      entityId: recordId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated income record "${dto.title ?? existing.title}"`,
    });

    return { id: recordId };
  }

  async deleteRecord(
    institutionId: string,
    recordId: string,
    session: AuthenticatedSession,
  ) {
    const [existing] = await this.db
      .select()
      .from(incomeRecords)
      .where(
        and(
          eq(incomeRecords.id, recordId),
          eq(incomeRecords.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INCOME.RECORD_NOT_FOUND);
    }

    await this.db.delete(incomeRecords).where(eq(incomeRecords.id, recordId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITY_TYPES.INCOME_RECORD,
      entityId: recordId,
      entityLabel: existing.title,
      summary: `Deleted income record "${existing.title}"`,
    });

    return { id: recordId };
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  async getSummary(institutionId: string, query: IncomeSummaryQueryDto) {
    const { campusId, dateFrom, dateTo } = query;

    const conditions = [eq(incomeRecords.institutionId, institutionId)];
    if (campusId) {
      conditions.push(eq(incomeRecords.campusId, campusId));
    }
    if (dateFrom) {
      conditions.push(gte(incomeRecords.incomeDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(incomeRecords.incomeDate, dateTo));
    }

    const where = and(...conditions);

    // By category
    const byCategory = await this.db
      .select({
        category: incomeRecords.category,
        totalAmountInPaise: sum(incomeRecords.amountInPaise),
        count: count(),
      })
      .from(incomeRecords)
      .where(where)
      .groupBy(incomeRecords.category);

    // By month
    const byMonth = await this.db
      .select({
        month: sql<string>`to_char(${incomeRecords.incomeDate}::date, 'YYYY-MM')`,
        totalAmountInPaise: sum(incomeRecords.amountInPaise),
        count: count(),
      })
      .from(incomeRecords)
      .where(where)
      .groupBy(sql`to_char(${incomeRecords.incomeDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${incomeRecords.incomeDate}::date, 'YYYY-MM')`);

    // Totals
    const [totals] = await this.db
      .select({
        totalAmountInPaise: sum(incomeRecords.amountInPaise),
        totalCount: count(),
      })
      .from(incomeRecords)
      .where(where);

    return {
      byCategory: byCategory.map((r) => ({
        category: r.category,
        totalAmountInPaise: Number(r.totalAmountInPaise ?? 0),
        count: r.count,
      })),
      byMonth: byMonth.map((r) => ({
        month: r.month,
        totalAmountInPaise: Number(r.totalAmountInPaise ?? 0),
        count: r.count,
      })),
      totalAmountInPaise: Number(totals?.totalAmountInPaise ?? 0),
      totalCount: totals?.totalCount ?? 0,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private async resolveCurrentMemberId(
    institutionId: string,
    session: AuthenticatedSession,
  ): Promise<string> {
    const [currentMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!currentMember) {
      throw new BadRequestException("Active membership is required.");
    }

    return currentMember.id;
  }

  private async resolveMemberNames(
    memberIds: string[],
  ): Promise<Map<string, string>> {
    if (memberIds.length === 0) return new Map();

    const results = await this.db
      .select({
        memberId: member.id,
        userName: user.name,
      })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        sql`${member.id} IN (${sql.join(
          memberIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    const map = new Map<string, string>();
    for (const r of results) {
      map.set(r.memberId, r.userName ?? "Unknown");
    }
    return map;
  }
}
