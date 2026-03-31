import {
  BadRequestException,
  ConflictException,
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
  ne,
  sql,
  sum,
  expenseCategories,
  expenses,
  member,
  user,
  type AppDatabase,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  EXPENSE_CATEGORY_STATUS,
  EXPENSE_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
  ListCategoriesQueryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  ListExpensesQueryDto,
  RejectExpenseDto,
  MarkPaidDto,
  ExpenseSummaryQueryDto,
} from "./expenses.schemas";

// ── Sort maps ────────────────────────────────────────────────────────────────

const categorySortColumns = {
  name: expenseCategories.name,
  createdAt: expenseCategories.createdAt,
} as const;

const expenseSortColumns = {
  expenseDate: expenses.expenseDate,
  amountInPaise: expenses.amountInPaise,
  createdAt: expenses.createdAt,
} as const;

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Categories ──────────────────────────────────────────────────────────

  async listCategories(institutionId: string, query: ListCategoriesQueryDto) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = categorySortColumns[sort ?? "name"];

    const conditions = [eq(expenseCategories.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(expenseCategories.status, status));
    }
    if (q) {
      conditions.push(ilike(expenseCategories.name, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(expenseCategories)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: expenseCategories.id,
        name: expenseCategories.name,
        description: expenseCategories.description,
        budgetHeadCode: expenseCategories.budgetHeadCode,
        parentCategoryId: expenseCategories.parentCategoryId,
        status: expenseCategories.status,
        createdAt: expenseCategories.createdAt,
      })
      .from(expenseCategories)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async createCategory(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateCategoryDto,
  ) {
    const id = randomUUID();
    await this.db.insert(expenseCategories).values({
      id,
      institutionId,
      name: dto.name,
      description: dto.description ?? null,
      budgetHeadCode: dto.budgetHeadCode ?? null,
      parentCategoryId: dto.parentCategoryId ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE_CATEGORY,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created expense category "${dto.name}"`,
    });

    return { id };
  }

  async updateCategory(
    institutionId: string,
    categoryId: string,
    session: AuthenticatedSession,
    dto: UpdateCategoryDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, categoryId),
          eq(expenseCategories.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.CATEGORY_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.budgetHeadCode !== undefined)
      updates.budgetHeadCode = dto.budgetHeadCode;
    if (dto.parentCategoryId !== undefined)
      updates.parentCategoryId = dto.parentCategoryId;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(expenseCategories)
        .set(updates)
        .where(eq(expenseCategories.id, categoryId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE_CATEGORY,
      entityId: categoryId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated expense category "${dto.name ?? existing.name}"`,
    });

    return { id: categoryId };
  }

  async updateCategoryStatus(
    institutionId: string,
    categoryId: string,
    session: AuthenticatedSession,
    dto: UpdateCategoryStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, categoryId),
          eq(expenseCategories.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.CATEGORY_NOT_FOUND);
    }

    // Check for active expenses when deactivating
    if (dto.status === EXPENSE_CATEGORY_STATUS.INACTIVE) {
      const [expenseCount] = await this.db
        .select({ count: count() })
        .from(expenses)
        .where(
          and(
            eq(expenses.categoryId, categoryId),
            eq(expenses.institutionId, institutionId),
            ne(expenses.status, EXPENSE_STATUS.PAID),
            ne(expenses.status, EXPENSE_STATUS.REJECTED),
          ),
        );

      if (expenseCount && expenseCount.count > 0) {
        throw new ConflictException(
          ERROR_MESSAGES.EXPENSES.CATEGORY_HAS_EXPENSES,
        );
      }
    }

    await this.db
      .update(expenseCategories)
      .set({ status: dto.status })
      .where(eq(expenseCategories.id, categoryId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE_CATEGORY,
      entityId: categoryId,
      entityLabel: existing.name,
      summary: `Changed expense category "${existing.name}" status to ${dto.status}`,
    });

    return { id: categoryId };
  }

  // ── Expenses ────────────────────────────────────────────────────────────

  async listExpenses(institutionId: string, query: ListExpensesQueryDto) {
    const {
      q,
      status,
      categoryId,
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
    const sortCol = expenseSortColumns[sort ?? "createdAt"];

    const conditions = [eq(expenses.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(expenses.status, status));
    }
    if (categoryId) {
      conditions.push(eq(expenses.categoryId, categoryId));
    }
    if (campusId) {
      conditions.push(eq(expenses.campusId, campusId));
    }
    if (dateFrom) {
      conditions.push(gte(expenses.expenseDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(expenses.expenseDate, dateTo));
    }
    if (q) {
      conditions.push(ilike(expenses.title, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(expenses)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: expenses.id,
        campusId: expenses.campusId,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        title: expenses.title,
        description: expenses.description,
        amountInPaise: expenses.amountInPaise,
        expenseDate: expenses.expenseDate,
        departmentName: expenses.departmentName,
        vendorName: expenses.vendorName,
        referenceNumber: expenses.referenceNumber,
        status: expenses.status,
        submittedByMemberId: expenses.submittedByMemberId,
        approvedByMemberId: expenses.approvedByMemberId,
        approvedAt: expenses.approvedAt,
        rejectionReason: expenses.rejectionReason,
        paidAt: expenses.paidAt,
        paymentMethod: expenses.paymentMethod,
        paymentReference: expenses.paymentReference,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .innerJoin(
        expenseCategories,
        eq(expenses.categoryId, expenseCategories.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve member names
    const memberIds = new Set<string>();
    for (const row of rows) {
      memberIds.add(row.submittedByMemberId);
      if (row.approvedByMemberId) memberIds.add(row.approvedByMemberId);
    }
    const memberNames = await this.resolveMemberNames(Array.from(memberIds));

    const mapped = rows.map((r) => ({
      id: r.id,
      campusId: r.campusId,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      title: r.title,
      description: r.description,
      amountInPaise: r.amountInPaise,
      expenseDate: r.expenseDate,
      departmentName: r.departmentName,
      vendorName: r.vendorName,
      referenceNumber: r.referenceNumber,
      status: r.status,
      submittedByMemberId: r.submittedByMemberId,
      submittedByName: memberNames.get(r.submittedByMemberId) ?? "Unknown",
      approvedByMemberId: r.approvedByMemberId,
      approvedByName: r.approvedByMemberId
        ? (memberNames.get(r.approvedByMemberId) ?? null)
        : null,
      approvedAt: r.approvedAt,
      rejectionReason: r.rejectionReason,
      paidAt: r.paidAt,
      paymentMethod: r.paymentMethod,
      paymentReference: r.paymentReference,
      createdAt: r.createdAt,
    }));

    return { rows: mapped, total, page: safePage, pageSize, pageCount };
  }

  async createExpense(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateExpenseDto,
  ) {
    // Validate category exists and is active
    const [category] = await this.db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, dto.categoryId),
          eq(expenseCategories.institutionId, institutionId),
          eq(expenseCategories.status, EXPENSE_CATEGORY_STATUS.ACTIVE),
        ),
      );

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.CATEGORY_NOT_FOUND);
    }

    // Look up the current user's membership
    const submittedByMemberId = await this.resolveCurrentMemberId(
      institutionId,
      session,
    );

    const id = randomUUID();
    await this.db.insert(expenses).values({
      id,
      institutionId,
      campusId: dto.campusId ?? null,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description ?? null,
      amountInPaise: dto.amountInPaise,
      expenseDate: dto.expenseDate,
      departmentName: dto.departmentName ?? null,
      vendorName: dto.vendorName ?? null,
      referenceNumber: dto.referenceNumber ?? null,
      receiptUploadId: dto.receiptUploadId ?? null,
      status: EXPENSE_STATUS.DRAFT,
      submittedByMemberId,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created expense "${dto.title}" for ${dto.amountInPaise} paise`,
    });

    return { id };
  }

  async getExpense(institutionId: string, expenseId: string) {
    const rows = await this.db
      .select({
        id: expenses.id,
        campusId: expenses.campusId,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        title: expenses.title,
        description: expenses.description,
        amountInPaise: expenses.amountInPaise,
        expenseDate: expenses.expenseDate,
        departmentName: expenses.departmentName,
        vendorName: expenses.vendorName,
        referenceNumber: expenses.referenceNumber,
        receiptUploadId: expenses.receiptUploadId,
        status: expenses.status,
        submittedByMemberId: expenses.submittedByMemberId,
        approvedByMemberId: expenses.approvedByMemberId,
        approvedAt: expenses.approvedAt,
        rejectionReason: expenses.rejectionReason,
        paidAt: expenses.paidAt,
        paymentMethod: expenses.paymentMethod,
        paymentReference: expenses.paymentReference,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .innerJoin(
        expenseCategories,
        eq(expenses.categoryId, expenseCategories.id),
      )
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    const r = rows[0];
    if (!r) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    // Resolve member names
    const memberIds = [r.submittedByMemberId];
    if (r.approvedByMemberId) memberIds.push(r.approvedByMemberId);
    const memberNames = await this.resolveMemberNames(memberIds);

    return {
      ...r,
      submittedByName: memberNames.get(r.submittedByMemberId) ?? "Unknown",
      approvedByName: r.approvedByMemberId
        ? (memberNames.get(r.approvedByMemberId) ?? null)
        : null,
    };
  }

  async updateExpense(
    institutionId: string,
    expenseId: string,
    session: AuthenticatedSession,
    dto: UpdateExpenseDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    if (existing.status !== EXPENSE_STATUS.DRAFT) {
      throw new BadRequestException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_DRAFT);
    }

    const updates: Record<string, unknown> = {};
    if (dto.campusId !== undefined) updates.campusId = dto.campusId;
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId;
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.amountInPaise !== undefined)
      updates.amountInPaise = dto.amountInPaise;
    if (dto.expenseDate !== undefined) updates.expenseDate = dto.expenseDate;
    if (dto.departmentName !== undefined)
      updates.departmentName = dto.departmentName;
    if (dto.vendorName !== undefined) updates.vendorName = dto.vendorName;
    if (dto.referenceNumber !== undefined)
      updates.referenceNumber = dto.referenceNumber;
    if (dto.receiptUploadId !== undefined)
      updates.receiptUploadId = dto.receiptUploadId;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(expenses)
        .set(updates)
        .where(eq(expenses.id, expenseId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated expense "${dto.title ?? existing.title}"`,
    });

    return { id: expenseId };
  }

  // ── Workflow ────────────────────────────────────────────────────────────

  async submitExpense(
    institutionId: string,
    expenseId: string,
    session: AuthenticatedSession,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    if (existing.status !== EXPENSE_STATUS.DRAFT) {
      throw new BadRequestException(ERROR_MESSAGES.EXPENSES.ALREADY_SUBMITTED);
    }

    await this.db
      .update(expenses)
      .set({ status: EXPENSE_STATUS.SUBMITTED })
      .where(eq(expenses.id, expenseId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
      entityLabel: existing.title,
      summary: `Submitted expense "${existing.title}" for approval`,
    });

    return { id: expenseId };
  }

  async approveExpense(
    institutionId: string,
    expenseId: string,
    session: AuthenticatedSession,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    if (existing.status !== EXPENSE_STATUS.SUBMITTED) {
      throw new BadRequestException(
        ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_SUBMITTED,
      );
    }

    const approvedByMemberId = await this.resolveCurrentMemberId(
      institutionId,
      session,
    );

    await this.db
      .update(expenses)
      .set({
        status: EXPENSE_STATUS.APPROVED,
        approvedByMemberId,
        approvedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
      entityLabel: existing.title,
      summary: `Approved expense "${existing.title}"`,
    });

    return { id: expenseId };
  }

  async rejectExpense(
    institutionId: string,
    expenseId: string,
    session: AuthenticatedSession,
    dto: RejectExpenseDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    if (existing.status !== EXPENSE_STATUS.SUBMITTED) {
      throw new BadRequestException(
        ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_SUBMITTED,
      );
    }

    await this.db
      .update(expenses)
      .set({
        status: EXPENSE_STATUS.REJECTED,
        rejectionReason: dto.rejectionReason,
      })
      .where(eq(expenses.id, expenseId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
      entityLabel: existing.title,
      summary: `Rejected expense "${existing.title}": ${dto.rejectionReason}`,
    });

    return { id: expenseId };
  }

  async markPaid(
    institutionId: string,
    expenseId: string,
    session: AuthenticatedSession,
    dto: MarkPaidDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_FOUND);
    }

    if (existing.status !== EXPENSE_STATUS.APPROVED) {
      throw new BadRequestException(
        ERROR_MESSAGES.EXPENSES.EXPENSE_NOT_APPROVED,
      );
    }

    await this.db
      .update(expenses)
      .set({
        status: EXPENSE_STATUS.PAID,
        paidAt: new Date(),
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference ?? null,
      })
      .where(eq(expenses.id, expenseId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EXPENSE,
      entityId: expenseId,
      entityLabel: existing.title,
      summary: `Marked expense "${existing.title}" as paid via ${dto.paymentMethod}`,
    });

    return { id: expenseId };
  }

  // ── Reports ─────────────────────────────────────────────────────────────

  async expenseSummary(institutionId: string, query: ExpenseSummaryQueryDto) {
    const { campusId, dateFrom, dateTo } = query;

    const conditions = [eq(expenses.institutionId, institutionId)];
    if (campusId) {
      conditions.push(eq(expenses.campusId, campusId));
    }
    if (dateFrom) {
      conditions.push(gte(expenses.expenseDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(expenses.expenseDate, dateTo));
    }
    // Only count approved/paid for summary
    conditions.push(sql`${expenses.status} IN ('approved', 'paid')`);

    const where = and(...conditions);

    // By category
    const byCategory = await this.db
      .select({
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        totalAmountInPaise: sum(expenses.amountInPaise),
        count: count(),
      })
      .from(expenses)
      .innerJoin(
        expenseCategories,
        eq(expenses.categoryId, expenseCategories.id),
      )
      .where(where)
      .groupBy(expenses.categoryId, expenseCategories.name);

    // By month
    const byMonth = await this.db
      .select({
        month: sql<string>`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`,
        totalAmountInPaise: sum(expenses.amountInPaise),
        count: count(),
      })
      .from(expenses)
      .where(where)
      .groupBy(sql`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`);

    // By department
    const byDepartment = await this.db
      .select({
        departmentName: sql<string>`coalesce(${expenses.departmentName}, 'Unspecified')`,
        totalAmountInPaise: sum(expenses.amountInPaise),
        count: count(),
      })
      .from(expenses)
      .where(where)
      .groupBy(sql`coalesce(${expenses.departmentName}, 'Unspecified')`);

    // Totals
    const [totals] = await this.db
      .select({
        totalAmountInPaise: sum(expenses.amountInPaise),
        totalCount: count(),
      })
      .from(expenses)
      .where(where);

    return {
      byCategory: byCategory.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        totalAmountInPaise: Number(r.totalAmountInPaise ?? 0),
        count: r.count,
      })),
      byMonth: byMonth.map((r) => ({
        month: r.month,
        totalAmountInPaise: Number(r.totalAmountInPaise ?? 0),
        count: r.count,
      })),
      byDepartment: byDepartment.map((r) => ({
        departmentName: r.departmentName,
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
