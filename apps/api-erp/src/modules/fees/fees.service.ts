import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  FEE_ASSIGNMENT_STATUSES,
  FEE_STRUCTURE_SCOPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
} from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  campus,
  classSections,
  count,
  desc,
  eq,
  feeAssignmentAdjustments,
  feeAssignments,
  feePayments,
  feePaymentReversals,
  feeStructureInstallments,
  feeStructures,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  member,
  ne,
  or,
  schoolClasses,
  sql,
  students,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import { NotificationFactory } from "../communications/notification.factory";
import { FeeReminderService } from "./fee-reminder.service";
import { campusScopeFilter } from "../auth/scope-filter";
import type {
  BulkFeeAssignmentDto,
  CreateFeeAssignmentDto,
  CreateFeePaymentDto,
  CreateFeeStructureDto,
  ListFeeAssignmentsQueryDto,
  CollectionSummaryQueryDto,
  CreateFeeAdjustmentDto,
  ListFeeDuesQueryDto,
  ListFeeStructuresQueryDto,
  ReverseFeePaymentDto,
  SetFeeStructureStatusDto,
  UpdateFeeAssignmentDto,
  UpdateFeeStructureDto,
} from "./fees.schemas";
import {
  sortableFeeAssignmentColumns,
  sortableFeeStructureColumns,
  type FeeDefaulterQueryInput,
} from "./fees.schemas";

type PaymentSummary = {
  totalPaidAmountInPaise: number;
  paymentCount: number;
  totalAdjustmentAmountInPaise?: number;
};

type AdjustmentSummary = {
  totalAdjustmentAmountInPaise: number;
  adjustmentCount: number;
};

type AssignmentRow = {
  id: string;
  institutionId: string;
  feeStructureId: string;
  feeStructureName: string;
  installmentId: string | null;
  installmentLabel: string | null;
  installmentSortOrder: number | null;
  studentId: string;
  studentAdmissionNumber: string;
  studentFirstName: string;
  studentLastName: string | null;
  campusId: string | null;
  campusName: string | null;
  assignedAmountInPaise: number;
  dueDate: string;
  status: string;
  notes: string | null;
  createdAt: Date;
};

const FEE_STRUCTURE_VERSION_SUFFIX_PATTERN = /\s\(v(\d+)\)$/i;
const FEE_STRUCTURE_NEXT_VERSION_START = 2;

@Injectable()
export class FeesService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly auditService: AuditService,
    private readonly notificationFactory: NotificationFactory,
    private readonly feeReminderService: FeeReminderService,
  ) {}

  // ── Fee Structures ────────────────────────────────────────────────────────

  async listFeeStructures(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListFeeStructuresQueryDto = {},
  ): Promise<PaginatedResult<ReturnType<typeof this.formatFeeStructureRow>>> {
    const scopedCampusId = authSession.activeCampusId ?? undefined;

    if (scopedCampusId) {
      await this.getCampusOrThrow(institutionId, scopedCampusId);
    }

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableFeeStructureColumns.academicYear;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(feeStructures.institutionId, institutionId),
      ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
    ];

    if (scopedCampusId) {
      conditions.push(
        or(
          isNull(feeStructures.campusId),
          eq(feeStructures.campusId, scopedCampusId),
        )!,
      );
    } else {
      const scopeFilter = campusScopeFilter(feeStructures.campusId, scopes);
      if (scopeFilter) {
        conditions.push(or(isNull(feeStructures.campusId), scopeFilter)!);
      }
    }
    if (query.academicYearId)
      conditions.push(eq(feeStructures.academicYearId, query.academicYearId));
    if (query.status) conditions.push(eq(feeStructures.status, query.status));
    if (query.search)
      conditions.push(ilike(feeStructures.name, `%${query.search}%`));

    const where = and(...conditions)!;

    const sortableColumns = {
      [sortableFeeStructureColumns.name]: feeStructures.name,
      [sortableFeeStructureColumns.dueDate]: feeStructures.dueDate,
      [sortableFeeStructureColumns.amount]: feeStructures.amountInPaise,
      [sortableFeeStructureColumns.academicYear]: academicYears.startDate,
    };

    const [totalRow] = await this.database
      .select({ count: count() })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.database
      .select({
        id: feeStructures.id,
        institutionId: feeStructures.institutionId,
        academicYearId: feeStructures.academicYearId,
        academicYearName: academicYears.name,
        campusId: feeStructures.campusId,
        campusName: campus.name,
        name: feeStructures.name,
        description: feeStructures.description,
        scope: feeStructures.scope,
        status: feeStructures.status,
        amountInPaise: feeStructures.amountInPaise,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .where(where)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(feeStructures.name))
      .limit(pageSize)
      .offset(pagination.offset);

    // Load installments for the current page of structures
    const structureIds = rows.map((r) => r.id);
    const allInstallments =
      structureIds.length > 0
        ? await this.database
            .select({
              id: feeStructureInstallments.id,
              feeStructureId: feeStructureInstallments.feeStructureId,
              sortOrder: feeStructureInstallments.sortOrder,
              label: feeStructureInstallments.label,
              amountInPaise: feeStructureInstallments.amountInPaise,
              dueDate: feeStructureInstallments.dueDate,
            })
            .from(feeStructureInstallments)
            .where(
              inArray(feeStructureInstallments.feeStructureId, structureIds),
            )
            .orderBy(asc(feeStructureInstallments.sortOrder))
        : [];

    const installmentsByStructure = new Map<
      string,
      Array<{
        id: string;
        sortOrder: number;
        label: string;
        amountInPaise: number;
        dueDate: string;
      }>
    >();
    for (const inst of allInstallments) {
      const list = installmentsByStructure.get(inst.feeStructureId) ?? [];
      list.push(inst);
      installmentsByStructure.set(inst.feeStructureId, list);
    }

    return {
      rows: rows.map((row) =>
        this.formatFeeStructureRow(
          row,
          installmentsByStructure.get(row.id) ?? [],
        ),
      ),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
  ) {
    const structure = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(structure.campusId, scopes);
    this.assertActiveCampusMatch(structure.campusId, authSession);

    const [summary] = await this.database
      .select({
        assignmentCount: count(feeAssignments.id),
        totalAssignedInPaise: sql<number>`coalesce(sum(${feeAssignments.assignedAmountInPaise}), 0)`,
      })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.feeStructureId, feeStructureId),
          eq(feeAssignments.institutionId, institutionId),
        ),
      );

    const assignmentIds = await this.database
      .select({ id: feeAssignments.id })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.feeStructureId, feeStructureId),
          eq(feeAssignments.institutionId, institutionId),
        ),
      );

    const paymentSummary = await this.getPaymentSummaryByAssignmentIds(
      assignmentIds.map((row) => row.id),
    );
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds(
      assignmentIds.map((row) => row.id),
    );

    const totalPaidInPaise = [...paymentSummary.values()].reduce(
      (acc, ps) => acc + ps.totalPaidAmountInPaise,
      0,
    );
    const totalAdjustedInPaise = [...adjustmentSummary.values()].reduce(
      (acc, summary) => acc + summary.totalAdjustmentAmountInPaise,
      0,
    );

    const assignmentCount = summary?.assignmentCount ?? 0;
    const totalAssignedInPaise = Number(summary?.totalAssignedInPaise ?? 0);
    const isInstallmentLocked = assignmentCount > 0;

    return {
      ...structure,
      assignmentCount,
      totalAssignedInPaise,
      totalPaidInPaise,
      totalOutstandingInPaise:
        totalAssignedInPaise - totalPaidInPaise - totalAdjustedInPaise,
      isInstallmentLocked,
      lockReason: isInstallmentLocked
        ? ERROR_MESSAGES.FEES.FEE_INSTALLMENTS_LOCKED
        : null,
    };
  }

  async createFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateFeeStructureDto,
  ) {
    const academicYear = await this.getAcademicYearOrThrow(
      institutionId,
      payload.academicYearId,
      { requireActive: true },
    );
    const selectedCampus =
      payload.scope === FEE_STRUCTURE_SCOPES.CAMPUS
        ? await this.getCampusOrThrow(
            institutionId,
            this.requireActiveCampusId(authSession),
          )
        : null;

    const normalizedCampusId =
      payload.scope === FEE_STRUCTURE_SCOPES.CAMPUS && selectedCampus
        ? selectedCampus.id
        : null;

    this.assertCampusScopeAccess(normalizedCampusId, scopes);

    await this.assertFeeStructureNameAvailable(
      institutionId,
      payload.academicYearId,
      normalizedCampusId,
      payload.name.trim(),
    );

    const createdId = randomUUID();
    const installments = payload.installments;
    const totalAmountInPaise = installments.reduce(
      (acc, i) =>
        acc +
        this.toPaise(
          i.amount,
          ERROR_MESSAGES.FEES.FEE_STRUCTURE_AMOUNT_INVALID,
        ),
      0,
    );
    const earliestDueDate = installments.map((i) => i.dueDate).sort()[0];

    await this.database.transaction(async (tx) => {
      await tx.insert(feeStructures).values({
        id: createdId,
        institutionId,
        academicYearId: academicYear.id,
        campusId: normalizedCampusId,
        name: payload.name.trim(),
        description: payload.description ?? null,
        scope: payload.scope,
        status: STATUS.FEE_STRUCTURE.ACTIVE,
        amountInPaise: totalAmountInPaise,
        dueDate: earliestDueDate,
      });

      await tx.insert(feeStructureInstallments).values(
        installments.map((installment, idx) => ({
          id: randomUUID(),
          feeStructureId: createdId,
          sortOrder: idx + 1,
          label: installment.label.trim(),
          amountInPaise: this.toPaise(
            installment.amount,
            ERROR_MESSAGES.FEES.FEE_STRUCTURE_AMOUNT_INVALID,
          ),
          dueDate: installment.dueDate,
        })),
      );
    });

    return this.getFeeStructureById(createdId, institutionId);
  }

  async duplicateFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
  ) {
    const source = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(source.campusId, scopes);
    this.assertActiveCampusMatch(source.campusId, authSession);
    await this.getAcademicYearOrThrow(institutionId, source.academicYearId, {
      requireActive: true,
    });
    const sourceInstallments = await this.database
      .select()
      .from(feeStructureInstallments)
      .where(eq(feeStructureInstallments.feeStructureId, feeStructureId))
      .orderBy(asc(feeStructureInstallments.sortOrder));

    const newId = randomUUID();
    const copyName = await this.generateFeeStructureCopyName(
      institutionId,
      source.academicYearId,
      source.campusId,
      source.name,
    );

    await this.database.transaction(async (tx) => {
      await tx.insert(feeStructures).values({
        id: newId,
        institutionId,
        academicYearId: source.academicYearId,
        campusId: source.campusId ?? null,
        name: copyName,
        description: source.description ?? null,
        scope: source.scope as typeof feeStructures.$inferInsert.scope,
        status: STATUS.FEE_STRUCTURE.ACTIVE,
        amountInPaise: source.amountInPaise,
        dueDate: source.dueDate,
      });

      if (sourceInstallments.length > 0) {
        await tx.insert(feeStructureInstallments).values(
          sourceInstallments.map((inst) => ({
            id: randomUUID(),
            feeStructureId: newId,
            sortOrder: inst.sortOrder,
            label: inst.label,
            amountInPaise: inst.amountInPaise,
            dueDate: inst.dueDate,
          })),
        );
      }
    });

    return this.getFeeStructure(institutionId, authSession, scopes, newId);
  }

  async createNextFeeStructureVersion(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
  ) {
    const source = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(source.campusId, scopes);
    this.assertActiveCampusMatch(source.campusId, authSession);
    await this.getAcademicYearOrThrow(institutionId, source.academicYearId, {
      requireActive: true,
    });
    const sourceInstallments = await this.database
      .select()
      .from(feeStructureInstallments)
      .where(eq(feeStructureInstallments.feeStructureId, feeStructureId))
      .orderBy(asc(feeStructureInstallments.sortOrder));

    const newId = randomUUID();
    const nextVersionName = await this.generateFeeStructureNextVersionName(
      institutionId,
      source.academicYearId,
      source.campusId,
      source.name,
    );

    await this.database.transaction(async (tx) => {
      await tx.insert(feeStructures).values({
        id: newId,
        institutionId,
        academicYearId: source.academicYearId,
        campusId: source.campusId ?? null,
        name: nextVersionName,
        description: source.description ?? null,
        scope: source.scope as typeof feeStructures.$inferInsert.scope,
        status: STATUS.FEE_STRUCTURE.ACTIVE,
        amountInPaise: source.amountInPaise,
        dueDate: source.dueDate,
      });

      if (sourceInstallments.length > 0) {
        await tx.insert(feeStructureInstallments).values(
          sourceInstallments.map((inst) => ({
            id: randomUUID(),
            feeStructureId: newId,
            sortOrder: inst.sortOrder,
            label: inst.label,
            amountInPaise: inst.amountInPaise,
            dueDate: inst.dueDate,
          })),
        );
      }
    });

    return this.getFeeStructure(institutionId, authSession, scopes, newId);
  }

  async updateFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
    payload: UpdateFeeStructureDto,
  ) {
    const structure = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(structure.campusId, scopes);
    this.assertActiveCampusMatch(structure.campusId, authSession);

    if (payload.name !== undefined) {
      const trimmedName = payload.name.trim();
      if (trimmedName !== structure.name) {
        await this.assertFeeStructureNameAvailable(
          institutionId,
          structure.academicYearId,
          structure.campusId,
          trimmedName,
        );
      }
    }

    if (payload.installments !== undefined) {
      const [assignmentUsageSummary] = await this.database
        .select({
          blockingAssignmentCount: count(),
          historicalAssignmentCount: sql<number>`count(*) filter (where ${feeAssignments.deletedAt} is not null)`,
        })
        .from(feeAssignments)
        .where(
          and(
            eq(feeAssignments.feeStructureId, feeStructureId),
            eq(feeAssignments.institutionId, institutionId),
            isNotNull(feeAssignments.installmentId),
          ),
        )
        .limit(1);

      const blockingAssignmentCount = Number(
        assignmentUsageSummary?.blockingAssignmentCount ?? 0,
      );

      if (blockingAssignmentCount > 0) {
        const historicalAssignmentCount = Number(
          assignmentUsageSummary?.historicalAssignmentCount ?? 0,
        );
        const lockMessage =
          historicalAssignmentCount > 0
            ? `${ERROR_MESSAGES.FEES.FEE_INSTALLMENTS_LOCKED} (${blockingAssignmentCount} assignments found; ${historicalAssignmentCount} historical soft-deleted.)`
            : `${ERROR_MESSAGES.FEES.FEE_INSTALLMENTS_LOCKED} (${blockingAssignmentCount} assignments found.)`;

        throw new ConflictException(lockMessage);
      }
    }

    await this.database.transaction(async (tx) => {
      const structureUpdates: Partial<{
        name: string;
        description: string | null;
        amountInPaise: number;
        dueDate: string;
      }> = {};

      if (payload.name !== undefined)
        structureUpdates.name = payload.name.trim();
      if (payload.description !== undefined)
        structureUpdates.description = payload.description ?? null;

      if (payload.installments !== undefined) {
        const totalAmountInPaise = payload.installments.reduce(
          (acc, i) =>
            acc +
            this.toPaise(
              i.amount,
              ERROR_MESSAGES.FEES.FEE_STRUCTURE_AMOUNT_INVALID,
            ),
          0,
        );
        structureUpdates.amountInPaise = totalAmountInPaise;
        structureUpdates.dueDate = payload.installments
          .map((i) => i.dueDate)
          .sort()[0]!;

        await tx
          .delete(feeStructureInstallments)
          .where(eq(feeStructureInstallments.feeStructureId, feeStructureId));

        await tx.insert(feeStructureInstallments).values(
          payload.installments.map((installment, idx) => ({
            id: randomUUID(),
            feeStructureId,
            sortOrder: idx + 1,
            label: installment.label.trim(),
            amountInPaise: this.toPaise(
              installment.amount,
              ERROR_MESSAGES.FEES.FEE_STRUCTURE_AMOUNT_INVALID,
            ),
            dueDate: installment.dueDate,
          })),
        );
      }

      if (Object.keys(structureUpdates).length > 0) {
        await tx
          .update(feeStructures)
          .set(structureUpdates)
          .where(
            and(
              eq(feeStructures.id, feeStructureId),
              eq(feeStructures.institutionId, institutionId),
            ),
          );
      }
    });

    return this.getFeeStructureById(feeStructureId, institutionId);
  }

  async setFeeStructureStatus(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
    payload: SetFeeStructureStatusDto,
  ) {
    const structure = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(structure.campusId, scopes);
    this.assertActiveCampusMatch(structure.campusId, authSession);

    await this.database
      .update(feeStructures)
      .set({
        status: payload.status,
        deletedAt: null,
      })
      .where(
        and(
          eq(feeStructures.id, feeStructureId),
          eq(feeStructures.institutionId, institutionId),
        ),
      );

    return this.getFeeStructureById(feeStructureId, institutionId);
  }

  async deleteFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeStructureId: string,
  ) {
    const structure = await this.getFeeStructureById(
      feeStructureId,
      institutionId,
    );
    this.assertOptionalCampusScopeAccess(structure.campusId, scopes);
    this.assertActiveCampusMatch(structure.campusId, authSession);

    const [existingAssignment] = await this.database
      .select({ id: feeAssignments.id })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.feeStructureId, feeStructureId),
          eq(feeAssignments.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (existingAssignment) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_HAS_ASSIGNMENTS,
      );
    }

    await this.database
      .update(feeStructures)
      .set({
        status: STATUS.FEE_STRUCTURE.DELETED,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(feeStructures.id, feeStructureId),
          eq(feeStructures.institutionId, institutionId),
        ),
      );
  }

  // ── Fee Assignments ───────────────────────────────────────────────────────

  async listFeeAssignments(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListFeeAssignmentsQueryDto = {},
  ): Promise<PaginatedResult<ReturnType<typeof this.buildAssignmentResult>>> {
    return this.queryFeeAssignmentsPaginated(
      institutionId,
      authSession,
      scopes,
      query,
    );
  }

  async getFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeAssignmentId: string,
  ) {
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);
    const paymentSummary = await this.getPaymentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);
    const ps = paymentSummary.get(feeAssignmentId) ?? {
      totalPaidAmountInPaise: 0,
      paymentCount: 0,
    };
    const adjustment = adjustmentSummary.get(feeAssignmentId) ?? {
      totalAdjustmentAmountInPaise: 0,
      adjustmentCount: 0,
    };

    const payments = await this.database
      .select({
        id: feePayments.id,
        institutionId: feePayments.institutionId,
        feeAssignmentId: feePayments.feeAssignmentId,
        amountInPaise: feePayments.amountInPaise,
        paymentDate: feePayments.paymentDate,
        paymentMethod: feePayments.paymentMethod,
        referenceNumber: feePayments.referenceNumber,
        notes: feePayments.notes,
        reversedAt: feePaymentReversals.createdAt,
        reversalReason: feePaymentReversals.reason,
        createdAt: feePayments.createdAt,
      })
      .from(feePayments)
      .leftJoin(
        feePaymentReversals,
        eq(feePaymentReversals.feePaymentId, feePayments.id),
      )
      .where(
        and(
          eq(feePayments.feeAssignmentId, feeAssignmentId),
          eq(feePayments.institutionId, institutionId),
          isNull(feePayments.deletedAt),
        ),
      )
      .orderBy(asc(feePayments.paymentDate), asc(feePayments.createdAt));

    const adjustments = await this.database
      .select({
        id: feeAssignmentAdjustments.id,
        feeAssignmentId: feeAssignmentAdjustments.feeAssignmentId,
        adjustmentType: feeAssignmentAdjustments.adjustmentType,
        amountInPaise: feeAssignmentAdjustments.amountInPaise,
        reason: feeAssignmentAdjustments.reason,
        createdAt: feeAssignmentAdjustments.createdAt,
      })
      .from(feeAssignmentAdjustments)
      .where(eq(feeAssignmentAdjustments.feeAssignmentId, feeAssignmentId))
      .orderBy(desc(feeAssignmentAdjustments.createdAt));

    return {
      ...this.buildAssignmentResult(assignment, {
        ...ps,
        totalAdjustmentAmountInPaise: adjustment.totalAdjustmentAmountInPaise,
      }),
      payments: payments.map((p) => ({
        ...p,
        referenceNumber: p.referenceNumber ?? null,
        notes: p.notes ?? null,
        reversedAt: p.reversedAt?.toISOString() ?? null,
        reversalReason: p.reversalReason ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      adjustments: adjustments.map((adjustmentRow) => ({
        ...adjustmentRow,
        reason: adjustmentRow.reason ?? null,
        createdAt: adjustmentRow.createdAt.toISOString(),
      })),
    };
  }

  async createFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateFeeAssignmentDto,
  ) {
    const feeStructure = await this.getFeeStructureOrThrow(
      institutionId,
      payload.feeStructureId,
      { requireActive: true },
    );
    const student = await this.getStudentOrThrow(
      institutionId,
      payload.studentId,
    );

    this.assertCampusScopeAccess(student.campusId, scopes);
    this.assertActiveCampusMatch(student.campusId, authSession);
    this.assertActiveCampusMatch(feeStructure.campusId, authSession);

    if (
      feeStructure.scope === FEE_STRUCTURE_SCOPES.CAMPUS &&
      feeStructure.campusId !== student.campusId
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_CAMPUS_MISMATCH,
      );
    }

    const installments = await this.database
      .select({
        id: feeStructureInstallments.id,
        amountInPaise: feeStructureInstallments.amountInPaise,
        dueDate: feeStructureInstallments.dueDate,
      })
      .from(feeStructureInstallments)
      .where(eq(feeStructureInstallments.feeStructureId, feeStructure.id))
      .orderBy(asc(feeStructureInstallments.sortOrder));

    if (installments.length === 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_INSTALLMENTS_REQUIRED,
      );
    }

    // Check no installment already assigned to this student
    const existingAssignments = await this.database
      .select({ installmentId: feeAssignments.installmentId })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          eq(feeAssignments.studentId, student.id),
          eq(feeAssignments.feeStructureId, feeStructure.id),
        ),
      );

    if (existingAssignments.length > 0) {
      throw new ConflictException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_EXISTS);
    }

    const createdIds = installments.map(() => randomUUID());

    await this.database.insert(feeAssignments).values(
      installments.map((installment, idx) => ({
        id: createdIds[idx],
        institutionId,
        feeStructureId: feeStructure.id,
        installmentId: installment.id,
        studentId: student.id,
        assignedAmountInPaise: installment.amountInPaise,
        dueDate: installment.dueDate,
        status: FEE_ASSIGNMENT_STATUSES.PENDING,
        notes: payload.notes ?? null,
      })),
    );

    const createdAssignments = await this.listAssignmentsByIds(
      institutionId,
      createdIds,
    );

    return {
      assignments: createdAssignments.map((assignment) =>
        this.buildAssignmentResult(assignment, {
          totalPaidAmountInPaise: 0,
          paymentCount: 0,
        }),
      ),
    };
  }

  async updateFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeAssignmentId: string,
    payload: UpdateFeeAssignmentDto,
  ) {
    const assignmentRow = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignmentRow.campusId, scopes);
    this.assertActiveCampusMatch(assignmentRow.campusId, authSession);
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);
    const currentAdjustedAmountInPaise =
      adjustmentSummary.get(feeAssignmentId)?.totalAdjustmentAmountInPaise ?? 0;

    if (payload.amount !== undefined) {
      const [existingPayment] = await this.database
        .select({ id: feePayments.id })
        .from(feePayments)
        .where(
          and(
            eq(feePayments.feeAssignmentId, feeAssignmentId),
            isNull(feePayments.deletedAt),
          ),
        )
        .limit(1);

      if (existingPayment) {
        throw new ConflictException(
          ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_AMOUNT_LOCKED,
        );
      }
    }

    const updates: Partial<{
      assignedAmountInPaise: number;
      dueDate: string;
      notes: string | null;
    }> = {};

    if (payload.amount !== undefined) {
      const nextAssignedAmountInPaise = this.toPaise(
        payload.amount,
        ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_AMOUNT_INVALID,
      );

      if (nextAssignedAmountInPaise < currentAdjustedAmountInPaise) {
        throw new BadRequestException(
          ERROR_MESSAGES.FEES.FEE_ADJUSTMENT_EXCEEDS_DUE,
        );
      }

      updates.assignedAmountInPaise = nextAssignedAmountInPaise;
    }
    if (payload.dueDate !== undefined) updates.dueDate = payload.dueDate;
    if (payload.notes !== undefined) updates.notes = payload.notes ?? null;

    if (Object.keys(updates).length > 0) {
      await this.database
        .update(feeAssignments)
        .set(updates)
        .where(
          and(
            eq(feeAssignments.id, feeAssignmentId),
            eq(feeAssignments.institutionId, institutionId),
          ),
        );
    }

    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    const paymentSummary = await this.getPaymentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);
    const ps = paymentSummary.get(feeAssignmentId) ?? {
      totalPaidAmountInPaise: 0,
      paymentCount: 0,
    };
    const adjustment = adjustmentSummary.get(feeAssignmentId) ?? {
      totalAdjustmentAmountInPaise: 0,
      adjustmentCount: 0,
    };

    return this.buildAssignmentResult(assignment, {
      ...ps,
      totalAdjustmentAmountInPaise: adjustment.totalAdjustmentAmountInPaise,
    });
  }

  async deleteFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeAssignmentId: string,
  ) {
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);

    const [existingPayment] = await this.database
      .select({ id: feePayments.id })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.feeAssignmentId, feeAssignmentId),
          isNull(feePayments.deletedAt),
        ),
      )
      .limit(1);

    if (existingPayment) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_HAS_PAYMENTS,
      );
    }

    const [existingAdjustment] = await this.database
      .select({ id: feeAssignmentAdjustments.id })
      .from(feeAssignmentAdjustments)
      .where(
        and(
          eq(feeAssignmentAdjustments.feeAssignmentId, feeAssignmentId),
          eq(feeAssignmentAdjustments.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (existingAdjustment) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_HAS_ADJUSTMENTS,
      );
    }

    await this.database
      .delete(feeAssignments)
      .where(
        and(
          eq(feeAssignments.id, feeAssignmentId),
          eq(feeAssignments.institutionId, institutionId),
        ),
      );
  }

  async createFeeAdjustment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeAssignmentId: string,
    payload: CreateFeeAdjustmentDto,
  ) {
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);
    const paymentSummary = await this.getPaymentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds([
      feeAssignmentId,
    ]);

    const currentPaidAmountInPaise =
      paymentSummary.get(feeAssignmentId)?.totalPaidAmountInPaise ?? 0;
    const currentAdjustedAmountInPaise =
      adjustmentSummary.get(feeAssignmentId)?.totalAdjustmentAmountInPaise ?? 0;
    const outstandingAmountInPaise =
      assignment.assignedAmountInPaise -
      currentPaidAmountInPaise -
      currentAdjustedAmountInPaise;

    const adjustmentAmountInPaise = this.toPaise(
      payload.amount,
      ERROR_MESSAGES.FEES.FEE_ADJUSTMENT_AMOUNT_INVALID,
    );

    if (adjustmentAmountInPaise > outstandingAmountInPaise) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_ADJUSTMENT_EXCEEDS_DUE,
      );
    }

    const adjustmentId = randomUUID();
    const nextAdjustedAmountInPaise =
      currentAdjustedAmountInPaise + adjustmentAmountInPaise;
    const nextOutstandingAmountInPaise =
      assignment.assignedAmountInPaise -
      currentPaidAmountInPaise -
      nextAdjustedAmountInPaise;

    await this.database.transaction(async (tx) => {
      await tx.insert(feeAssignmentAdjustments).values({
        id: adjustmentId,
        institutionId,
        feeAssignmentId,
        adjustmentType: payload.adjustmentType,
        amountInPaise: adjustmentAmountInPaise,
        reason: payload.reason ?? null,
      });

      await tx
        .update(feeAssignments)
        .set({
          status: this.resolveAssignmentStatus(
            currentPaidAmountInPaise + nextAdjustedAmountInPaise,
            nextOutstandingAmountInPaise,
          ),
        })
        .where(eq(feeAssignments.id, feeAssignmentId));
    });

    return this.getFeeAdjustmentById(adjustmentId, institutionId);
  }

  async createBulkFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: BulkFeeAssignmentDto,
  ) {
    const feeStructure = await this.getFeeStructureOrThrow(
      institutionId,
      payload.feeStructureId,
      { requireActive: true },
    );
    this.assertActiveCampusMatch(feeStructure.campusId, authSession);

    return this.database.transaction(async (tx) => {
      const studentsInClass = await tx
        .select({
          id: students.id,
          campusId: member.primaryCampusId,
        })
        .from(students)
        .innerJoin(member, eq(students.membershipId, member.id))
        .where(
          and(
            eq(students.institutionId, institutionId),
            eq(students.classId, payload.classId),
            eq(member.status, STATUS.MEMBER.ACTIVE),
          ),
        );

      if (studentsInClass.length === 0) {
        return { created: 0, skipped: 0 };
      }

      for (const student of studentsInClass) {
        this.assertCampusScopeAccess(student.campusId, scopes);
        this.assertActiveCampusMatch(student.campusId, authSession);
      }

      if (feeStructure.scope === FEE_STRUCTURE_SCOPES.CAMPUS) {
        const mismatchedStudent = studentsInClass.find(
          (student) => student.campusId !== feeStructure.campusId,
        );

        if (mismatchedStudent) {
          throw new BadRequestException(
            ERROR_MESSAGES.FEES.FEE_STRUCTURE_CAMPUS_MISMATCH,
          );
        }
      }

      const installments = await tx
        .select({
          id: feeStructureInstallments.id,
          amountInPaise: feeStructureInstallments.amountInPaise,
          dueDate: feeStructureInstallments.dueDate,
        })
        .from(feeStructureInstallments)
        .where(eq(feeStructureInstallments.feeStructureId, feeStructure.id))
        .orderBy(asc(feeStructureInstallments.sortOrder));

      if (installments.length === 0) {
        throw new BadRequestException(
          ERROR_MESSAGES.FEES.FEE_INSTALLMENTS_REQUIRED,
        );
      }

      const studentIds = studentsInClass.map((student) => student.id);
      const existingAssignments = await tx
        .select({ studentId: feeAssignments.studentId })
        .from(feeAssignments)
        .where(
          and(
            eq(feeAssignments.institutionId, institutionId),
            eq(feeAssignments.feeStructureId, payload.feeStructureId),
            inArray(feeAssignments.studentId, studentIds),
          ),
        );

      const alreadyAssignedStudentIds = new Set(
        existingAssignments.map((assignment) => assignment.studentId),
      );
      const toCreate = studentsInClass.filter(
        (student) => !alreadyAssignedStudentIds.has(student.id),
      );

      if (toCreate.length > 0) {
        await tx.insert(feeAssignments).values(
          toCreate.flatMap((student) =>
            installments.map((installment) => ({
              id: randomUUID(),
              institutionId,
              feeStructureId: feeStructure.id,
              installmentId: installment.id,
              studentId: student.id,
              assignedAmountInPaise: installment.amountInPaise,
              dueDate: installment.dueDate,
              status: FEE_ASSIGNMENT_STATUSES.PENDING,
              notes: payload.notes ?? null,
            })),
          ),
        );
      }

      return {
        created: toCreate.length,
        skipped: alreadyAssignedStudentIds.size,
      };
    });
  }

  // ── Fee Payments ──────────────────────────────────────────────────────────

  async createFeePayment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateFeePaymentDto,
  ) {
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      payload.feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);

    const paymentSummary = await this.getPaymentSummaryByAssignmentIds([
      payload.feeAssignmentId,
    ]);
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds([
      payload.feeAssignmentId,
    ]);
    const ps = paymentSummary.get(payload.feeAssignmentId) ?? {
      totalPaidAmountInPaise: 0,
      paymentCount: 0,
    };
    const adjustment = adjustmentSummary.get(payload.feeAssignmentId) ?? {
      totalAdjustmentAmountInPaise: 0,
      adjustmentCount: 0,
    };

    const outstandingAmountInPaise =
      assignment.assignedAmountInPaise -
      ps.totalPaidAmountInPaise -
      adjustment.totalAdjustmentAmountInPaise;

    const paymentAmountInPaise = this.toPaise(
      payload.amount,
      ERROR_MESSAGES.FEES.FEE_PAYMENT_AMOUNT_INVALID,
    );

    if (paymentAmountInPaise > outstandingAmountInPaise) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_PAYMENT_EXCEEDS_DUE,
      );
    }

    const paymentId = randomUUID();
    const nextPaidAmountInPaise =
      ps.totalPaidAmountInPaise + paymentAmountInPaise;
    const nextOutstandingAmountInPaise =
      assignment.assignedAmountInPaise - nextPaidAmountInPaise;

    await this.database.transaction(async (tx) => {
      await tx.insert(feePayments).values({
        id: paymentId,
        institutionId,
        feeAssignmentId: assignment.id,
        amountInPaise: paymentAmountInPaise,
        paymentDate: payload.paymentDate,
        paymentMethod: payload.paymentMethod,
        referenceNumber: payload.referenceNumber ?? null,
        notes: payload.notes ?? null,
      });

      await tx
        .update(feeAssignments)
        .set({
          status: this.resolveAssignmentStatus(
            nextPaidAmountInPaise + adjustment.totalAdjustmentAmountInPaise,
            nextOutstandingAmountInPaise,
          ),
        })
        .where(eq(feeAssignments.id, assignment.id));
    });

    // Fire notification (non-blocking — failure should not affect payment)
    this.notificationFactory
      .notify({
        institutionId,
        campusId: assignment.campusId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.FEE_PAYMENT_RECEIVED,
        channel: NOTIFICATION_CHANNELS.FINANCE,
        tone: NOTIFICATION_TONES.POSITIVE,
        audience: "guardians",
        title: "Fee payment received",
        message: `Payment of ₹${(paymentAmountInPaise / 100).toFixed(2)} recorded for ${assignment.studentFirstName} ${assignment.studentLastName ?? ""}.`.trim(),
        senderLabel: authSession.user.name,
      })
      .catch(() => {});

    return this.getFeePaymentById(paymentId, institutionId);
  }

  async reverseFeePayment(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feePaymentId: string,
    payload: ReverseFeePaymentDto,
  ) {
    const payment = await this.getActivePaymentRowOrThrow(
      feePaymentId,
      institutionId,
    );

    const [existingReversal] = await this.database
      .select({ id: feePaymentReversals.id })
      .from(feePaymentReversals)
      .where(eq(feePaymentReversals.feePaymentId, feePaymentId))
      .limit(1);

    if (existingReversal) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_PAYMENT_ALREADY_REVERSED,
      );
    }

    const paymentSummary = await this.getPaymentSummaryByAssignmentIds([
      payment.feeAssignmentId,
    ]);
    const adjustmentSummary = await this.getAdjustmentSummaryByAssignmentIds([
      payment.feeAssignmentId,
    ]);

    const currentPaidAmountInPaise =
      paymentSummary.get(payment.feeAssignmentId)?.totalPaidAmountInPaise ?? 0;
    const currentAdjustedAmountInPaise =
      adjustmentSummary.get(payment.feeAssignmentId)
        ?.totalAdjustmentAmountInPaise ?? 0;
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      payment.feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);
    const studentFullName = this.buildStudentFullName(
      assignment.studentFirstName,
      assignment.studentLastName,
    );

    const nextPaidAmountInPaise =
      currentPaidAmountInPaise - payment.amountInPaise;
    const nextOutstandingAmountInPaise =
      assignment.assignedAmountInPaise -
      nextPaidAmountInPaise -
      currentAdjustedAmountInPaise;

    const reversalId = randomUUID();

    await this.database.transaction(async (tx) => {
      await tx.insert(feePaymentReversals).values({
        id: reversalId,
        institutionId,
        feePaymentId,
        reason: payload.reason ?? null,
      });

      await tx
        .update(feeAssignments)
        .set({
          status: this.resolveAssignmentStatus(
            nextPaidAmountInPaise + currentAdjustedAmountInPaise,
            nextOutstandingAmountInPaise,
          ),
        })
        .where(eq(feeAssignments.id, payment.feeAssignmentId));

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.REVERSE,
        entityType: AUDIT_ENTITY_TYPES.FEE_PAYMENT,
        entityId: feePaymentId,
        entityLabel: studentFullName,
        summary: `Reversed fee payment for ${studentFullName}.`,
        metadata: {
          feeAssignmentId: payment.feeAssignmentId,
          amountInPaise: payment.amountInPaise,
          reversalReason: payload.reason ?? null,
          paymentId: feePaymentId,
        },
      });
    });

    this.notificationFactory
      .notify({
        institutionId,
        campusId: assignment.campusId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.FEE_PAYMENT_REVERSED,
        channel: NOTIFICATION_CHANNELS.FINANCE,
        tone: NOTIFICATION_TONES.WARNING,
        audience: "guardians",
        title: "Fee payment reversed",
        message: `Payment of ₹${(payment.amountInPaise / 100).toFixed(2)} for ${studentFullName} has been reversed.${payload.reason ? ` Reason: ${payload.reason}` : ""}`,
        senderLabel: authSession.user.name,
      })
      .catch(() => {});

    return this.getFeePaymentById(feePaymentId, institutionId);
  }

  async sendFeeReminder(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    feeAssignmentId: string,
  ) {
    const assignment = await this.getAssignmentRowOrThrow(
      institutionId,
      feeAssignmentId,
    );
    this.assertCampusScopeAccess(assignment.campusId, scopes);
    this.assertActiveCampusMatch(assignment.campusId, authSession);

    return this.feeReminderService.sendReminder(
      institutionId,
      feeAssignmentId,
      authSession.user.id,
      { skipCooldown: true },
    );
  }

  // ── Dues ──────────────────────────────────────────────────────────────────

  async listFeeDues(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListFeeDuesQueryDto = {},
  ): Promise<PaginatedResult<ReturnType<typeof this.buildAssignmentResult>>> {
    const today = new Date().toISOString().split("T")[0];
    const assignmentQuery: ListFeeAssignmentsQueryDto = {
      limit: query.limit,
      order: query.order,
      page: query.page,
      search: query.search,
      sort: query.sort as ListFeeAssignmentsQueryDto["sort"],
    };

    return this.queryFeeAssignmentsPaginated(
      institutionId,
      authSession,
      scopes,
      assignmentQuery,
      {
        outstandingOnly: true,
        overdueOnly: query.overdue === true ? today : undefined,
      },
    );
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getCollectionSummary(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: CollectionSummaryQueryDto = {},
  ) {
    const today = new Date().toISOString().split("T")[0];
    const scopedCampusId = authSession.activeCampusId ?? undefined;
    const structureCampusFilter = campusScopeFilter(
      feeStructures.campusId,
      scopes,
    );
    const assignmentCampusFilter = campusScopeFilter(
      member.primaryCampusId,
      scopes,
    );
    const paymentSummaryByAssignment = this.buildPaymentSummarySubquery();
    const adjustmentSummaryByAssignment = this.buildAdjustmentSummarySubquery();
    const scopedAssignments = this.database
      .select({
        id: feeAssignments.id,
        feeStructureId: feeAssignments.feeStructureId,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
      })
      .from(feeAssignments)
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          ne(member.status, STATUS.MEMBER.DELETED),
          scopedCampusId
            ? eq(member.primaryCampusId, scopedCampusId)
            : assignmentCampusFilter,
        ),
      )
      .as("scoped_fee_assignments");
    const conditions: SQL[] = [
      eq(feeStructures.institutionId, institutionId),
      ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
    ];

    if (scopedCampusId) {
      await this.getCampusOrThrow(institutionId, scopedCampusId);
      conditions.push(
        or(
          isNull(feeStructures.campusId),
          eq(feeStructures.campusId, scopedCampusId),
        )!,
      );
    } else if (structureCampusFilter) {
      conditions.push(
        or(isNull(feeStructures.campusId), structureCampusFilter)!,
      );
    }
    if (query.academicYearId) {
      conditions.push(eq(feeStructures.academicYearId, query.academicYearId));
    }

    const where = and(...conditions)!;

    const byStructureRows = await this.database
      .select({
        feeStructureId: feeStructures.id,
        feeStructureName: feeStructures.name,
        academicYearName: academicYears.name,
        campusName: campus.name,
        assignmentCount: sql<number>`count(${scopedAssignments.id})`,
        totalAssignedInPaise: sql<number>`coalesce(sum(${scopedAssignments.assignedAmountInPaise}), 0)`,
        totalPaidInPaise: sql<number>`coalesce(sum(coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0)), 0)`,
        totalAdjustedInPaise: sql<number>`coalesce(sum(coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)), 0)`,
      })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .leftJoin(
        scopedAssignments,
        eq(scopedAssignments.feeStructureId, feeStructures.id),
      )
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, scopedAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, scopedAssignments.id),
      )
      .where(where)
      .groupBy(
        feeStructures.id,
        feeStructures.name,
        academicYears.name,
        academicYears.startDate,
        campus.name,
      )
      .orderBy(asc(academicYears.startDate), asc(feeStructures.name));

    const [overdueRow] = await this.database
      .select({
        overdueCount: sql<number>`count(${feeAssignments.id})`,
      })
      .from(feeAssignments)
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .where(
        and(
          eq(feeStructures.institutionId, institutionId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
          ne(member.status, STATUS.MEMBER.DELETED),
          lt(feeAssignments.dueDate, today),
          sql`${feeAssignments.assignedAmountInPaise} > coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0) + coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)`,
          query.academicYearId
            ? eq(feeStructures.academicYearId, query.academicYearId)
            : undefined,
          scopedCampusId
            ? eq(member.primaryCampusId, scopedCampusId)
            : assignmentCampusFilter,
          scopedCampusId
            ? or(
                isNull(feeStructures.campusId),
                eq(feeStructures.campusId, scopedCampusId),
              )
            : structureCampusFilter
              ? or(isNull(feeStructures.campusId), structureCampusFilter)
              : undefined,
        ),
      );

    const byStructure = byStructureRows.map((row) => ({
      feeStructureId: row.feeStructureId,
      feeStructureName: row.feeStructureName,
      academicYearName: row.academicYearName,
      campusName: row.campusName ?? null,
      assignmentCount: Number(row.assignmentCount ?? 0),
      totalAssignedInPaise: Number(row.totalAssignedInPaise ?? 0),
      totalPaidInPaise: Number(row.totalPaidInPaise ?? 0),
      totalOutstandingInPaise:
        Number(row.totalAssignedInPaise ?? 0) -
        Number(row.totalPaidInPaise ?? 0) -
        Number(row.totalAdjustedInPaise ?? 0),
    }));

    const totalAssignedInPaise = byStructure.reduce(
      (sum, row) => sum + row.totalAssignedInPaise,
      0,
    );
    const totalPaidInPaise = byStructure.reduce(
      (sum, row) => sum + row.totalPaidInPaise,
      0,
    );
    const totalOutstandingInPaise = byStructure.reduce(
      (sum, row) => sum + row.totalOutstandingInPaise,
      0,
    );

    return {
      totalAssignedInPaise,
      totalPaidInPaise,
      totalOutstandingInPaise,
      overdueCount: Number(overdueRow?.overdueCount ?? 0),
      byStructure,
    };
  }

  // ── Fee Defaulters ──────────────────────────────────────────────────────────

  async getFeeDefaulters(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: FeeDefaulterQueryInput,
  ) {
    const today = new Date().toISOString().split("T")[0];
    const scopedCampusId = authSession.activeCampusId ?? undefined;
    const campusFilter = campusScopeFilter(member.primaryCampusId, scopes);
    const paymentSummaryByAssignment = this.buildPaymentSummarySubquery();
    const adjustmentSummaryByAssignment = this.buildAdjustmentSummarySubquery();

    const conditions: SQL[] = [
      eq(feeAssignments.institutionId, institutionId),
      ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
      ne(member.status, STATUS.MEMBER.DELETED),
      lt(feeAssignments.dueDate, today),
    ];

    if (query.academicYearId) {
      conditions.push(eq(feeStructures.academicYearId, query.academicYearId));
    }
    if (query.campusId) {
      conditions.push(eq(member.primaryCampusId, query.campusId));
    } else if (scopedCampusId) {
      conditions.push(eq(member.primaryCampusId, scopedCampusId));
    } else if (campusFilter) {
      conditions.push(campusFilter);
    }
    if (query.classId) {
      conditions.push(eq(students.classId, query.classId));
    }

    // CTE-style: build the student-aggregated defaulter subquery
    const outstandingExpr = sql<number>`
      ${feeAssignments.assignedAmountInPaise}
      - coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0)
      - coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)
    `;

    // Condition: outstanding > 0
    conditions.push(gt(outstandingExpr, 0));

    const where = and(...conditions)!;

    // First, get the total count of defaulter students
    const [countRow] = await this.database
      .selectDistinctOn([students.id], {
        studentId: students.id,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .where(where);

    // Use a different approach: group by student to get summary
    const defaulterAggQuery = this.database
      .select({
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        classId: students.classId,
        className: schoolClasses.name,
        sectionName: classSections.name,
        campusName: campus.name,
        totalAssignedInPaise:
          sql<number>`coalesce(sum(${feeAssignments.assignedAmountInPaise}), 0)`.as(
            "total_assigned",
          ),
        totalPaidInPaise:
          sql<number>`coalesce(sum(coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0)), 0)`.as(
            "total_paid",
          ),
        totalAdjustedInPaise:
          sql<number>`coalesce(sum(coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)), 0)`.as(
            "total_adjusted",
          ),
        oldestDueDate: sql<string>`min(${feeAssignments.dueDate})`.as(
          "oldest_due_date",
        ),
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .where(where)
      .groupBy(
        students.id,
        students.firstName,
        students.lastName,
        students.admissionNumber,
        students.classId,
        schoolClasses.name,
        schoolClasses.displayOrder,
        classSections.name,
        campus.name,
      )
      .having(
        gt(
          sql<number>`sum(${feeAssignments.assignedAmountInPaise}) - coalesce(sum(coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0)), 0) - coalesce(sum(coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)), 0)`,
          0,
        ),
      )
      .orderBy(
        desc(
          sql`sum(${feeAssignments.assignedAmountInPaise}) - coalesce(sum(coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0)), 0) - coalesce(sum(coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)), 0)`,
        ),
      );

    // Get total count using a wrapping approach
    const allDefaulterRows = await defaulterAggQuery;
    const total = allDefaulterRows.length;
    const pageSize = resolveTablePageSize(query.limit);
    const { page, pageCount, offset } = resolvePagination(
      total,
      query.page,
      pageSize,
    );
    const paginatedRows = allDefaulterRows.slice(offset, offset + pageSize);

    const summaryTotalOutstandingInPaise = allDefaulterRows.reduce(
      (sum, row) =>
        sum +
        Number(row.totalAssignedInPaise) -
        Number(row.totalPaidInPaise) -
        Number(row.totalAdjustedInPaise),
      0,
    );

    const rows = paginatedRows.map((row) => {
      const totalAssigned = Number(row.totalAssignedInPaise);
      const totalPaid = Number(row.totalPaidInPaise);
      const totalAdjusted = Number(row.totalAdjustedInPaise);
      const outstanding = totalAssigned - totalPaid - totalAdjusted;
      const oldestDueDate = String(row.oldestDueDate);
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${oldestDueDate}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      const fullName = row.studentLastName
        ? `${row.studentFirstName} ${row.studentLastName}`
        : row.studentFirstName;

      return {
        studentId: row.studentId,
        studentName: fullName,
        admissionNumber: row.admissionNumber,
        className: row.className,
        sectionName: row.sectionName,
        campusName: row.campusName ?? null,
        totalAssignedInPaise: totalAssigned,
        totalPaidInPaise: totalPaid,
        totalOutstandingInPaise: outstanding,
        oldestDueDate,
        daysPastDue: daysOverdue,
      };
    });

    return {
      rows,
      total,
      page,
      pageSize,
      pageCount,
      summaryTotalOutstandingInPaise,
      summaryDefaulterCount: total,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async queryFeeAssignmentsPaginated(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListFeeAssignmentsQueryDto,
    filters: { outstandingOnly?: boolean; overdueOnly?: string } = {},
  ): Promise<PaginatedResult<ReturnType<typeof this.buildAssignmentResult>>> {
    const scopedCampusId = authSession.activeCampusId ?? undefined;

    if (scopedCampusId) {
      await this.getCampusOrThrow(institutionId, scopedCampusId);
    }

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableFeeAssignmentColumns.dueDate;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const campusFilter = campusScopeFilter(member.primaryCampusId, scopes);
    const paymentSummaryByAssignment = this.buildPaymentSummarySubquery();
    const adjustmentSummaryByAssignment = this.buildAdjustmentSummarySubquery();

    const sortableColumns = {
      [sortableFeeAssignmentColumns.studentName]: students.firstName,
      [sortableFeeAssignmentColumns.dueDate]: feeAssignments.dueDate,
      [sortableFeeAssignmentColumns.status]: feeAssignments.status,
      [sortableFeeAssignmentColumns.amount]:
        feeAssignments.assignedAmountInPaise,
    };

    const conditions: SQL[] = [
      eq(feeAssignments.institutionId, institutionId),
      ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
      ne(member.status, STATUS.MEMBER.DELETED),
    ];

    if (scopedCampusId) {
      conditions.push(eq(member.primaryCampusId, scopedCampusId));
    } else if (campusFilter) {
      conditions.push(campusFilter);
    }
    if (query.feeStructureId) {
      conditions.push(eq(feeAssignments.feeStructureId, query.feeStructureId));
    }
    if (query.status) {
      conditions.push(eq(feeAssignments.status, query.status));
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(students.firstName, `%${query.search}%`),
          ilike(students.lastName, `%${query.search}%`),
          ilike(students.admissionNumber, `%${query.search}%`),
          ilike(feeStructures.name, `%${query.search}%`),
        )!,
      );
    }
    if (filters.overdueOnly) {
      conditions.push(lt(feeAssignments.dueDate, filters.overdueOnly));
    }
    if (filters.outstandingOnly) {
      conditions.push(
        sql`${feeAssignments.assignedAmountInPaise} > coalesce(${paymentSummaryByAssignment.totalPaidAmountInPaise}, 0) + coalesce(${adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise}, 0)`,
      );
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.database
      .select({ count: count() })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        feeStructureInstallments,
        eq(feeAssignments.installmentId, feeStructureInstallments.id),
      )
      .where(where);

    const rawTotal = totalRow?.count ?? 0;
    const pagination = resolvePagination(rawTotal, query.page, pageSize);

    const rows = await this.database
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
        feeStructureId: feeAssignments.feeStructureId,
        feeStructureName: feeStructures.name,
        installmentId: feeAssignments.installmentId,
        installmentLabel: feeStructureInstallments.label,
        installmentSortOrder: feeStructureInstallments.sortOrder,
        studentId: feeAssignments.studentId,
        studentAdmissionNumber: students.admissionNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        campusId: member.primaryCampusId,
        campusName: campus.name,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
        status: feeAssignments.status,
        notes: feeAssignments.notes,
        createdAt: feeAssignments.createdAt,
        totalPaidAmountInPaise:
          paymentSummaryByAssignment.totalPaidAmountInPaise,
        paymentCount: paymentSummaryByAssignment.paymentCount,
        totalAdjustmentAmountInPaise:
          adjustmentSummaryByAssignment.totalAdjustmentAmountInPaise,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(
        paymentSummaryByAssignment,
        eq(paymentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        adjustmentSummaryByAssignment,
        eq(adjustmentSummaryByAssignment.feeAssignmentId, feeAssignments.id),
      )
      .leftJoin(
        feeStructureInstallments,
        eq(feeAssignments.installmentId, feeStructureInstallments.id),
      )
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        asc(students.admissionNumber),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) =>
        this.buildAssignmentResult(row, {
          totalPaidAmountInPaise: Number(row.totalPaidAmountInPaise ?? 0),
          paymentCount: Number(row.paymentCount ?? 0),
          totalAdjustmentAmountInPaise: Number(
            row.totalAdjustmentAmountInPaise ?? 0,
          ),
        }),
      ),
      total: rawTotal,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  private buildAssignmentResult(row: AssignmentRow, ps: PaymentSummary) {
    const adjustedAmountInPaise = ps.totalAdjustmentAmountInPaise ?? 0;
    const outstandingAmountInPaise =
      row.assignedAmountInPaise -
      ps.totalPaidAmountInPaise -
      adjustedAmountInPaise;

    return {
      id: row.id,
      institutionId: row.institutionId,
      feeStructureId: row.feeStructureId,
      feeStructureName: row.feeStructureName,
      installmentId: row.installmentId ?? null,
      installmentLabel: row.installmentLabel ?? null,
      installmentSortOrder: row.installmentSortOrder ?? 1,
      studentId: row.studentId,
      studentAdmissionNumber: row.studentAdmissionNumber,
      studentFullName: [row.studentFirstName, row.studentLastName]
        .filter(Boolean)
        .join(" "),
      campusName: row.campusName ?? null,
      assignedAmountInPaise: row.assignedAmountInPaise,
      adjustedAmountInPaise,
      paidAmountInPaise: ps.totalPaidAmountInPaise,
      outstandingAmountInPaise,
      paymentCount: ps.paymentCount,
      dueDate: row.dueDate,
      status: row.status,
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private formatFeeStructureRow(
    row: {
      id: string;
      institutionId: string;
      academicYearId: string;
      academicYearName: string;
      campusId: string | null;
      campusName: string | null;
      name: string;
      description: string | null;
      scope: string;
      status: string;
      amountInPaise: number;
      dueDate: string;
      createdAt: Date;
    },
    installments: Array<{
      id: string;
      sortOrder: number;
      label: string;
      amountInPaise: number;
      dueDate: string;
    }> = [],
  ) {
    return {
      ...row,
      campusName: row.campusName ?? null,
      description: row.description ?? null,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      installmentCount: installments.length,
      installments,
    };
  }

  private async getPaymentSummaryByAssignmentIds(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return new Map<string, PaymentSummary>();
    }

    const rows = await this.database
      .select({
        feeAssignmentId: feePayments.feeAssignmentId,
        totalPaidAmountInPaise:
          sql<number>`coalesce(sum(${feePayments.amountInPaise}), 0)`.as(
            "total_paid_amount_in_paise",
          ),
        paymentCount: sql<number>`count(${feePayments.id})`.as("payment_count"),
      })
      .from(feePayments)
      .leftJoin(
        feePaymentReversals,
        eq(feePaymentReversals.feePaymentId, feePayments.id),
      )
      .where(
        and(
          inArray(feePayments.feeAssignmentId, assignmentIds),
          isNull(feePayments.deletedAt),
          isNull(feePaymentReversals.id),
        ),
      )
      .groupBy(feePayments.feeAssignmentId);

    return new Map(
      rows.map((row) => [
        row.feeAssignmentId,
        {
          totalPaidAmountInPaise: Number(row.totalPaidAmountInPaise),
          paymentCount: Number(row.paymentCount),
        },
      ]),
    );
  }

  private buildPaymentSummarySubquery() {
    return this.database
      .select({
        feeAssignmentId: feePayments.feeAssignmentId,
        totalPaidAmountInPaise:
          sql<number>`coalesce(sum(${feePayments.amountInPaise}), 0)`.as(
            "total_paid_amount_in_paise",
          ),
        paymentCount: sql<number>`count(${feePayments.id})`.as("payment_count"),
      })
      .from(feePayments)
      .leftJoin(
        feePaymentReversals,
        eq(feePaymentReversals.feePaymentId, feePayments.id),
      )
      .where(and(isNull(feePayments.deletedAt), isNull(feePaymentReversals.id)))
      .groupBy(feePayments.feeAssignmentId)
      .as("fee_assignment_payment_summary");
  }

  private async getAdjustmentSummaryByAssignmentIds(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return new Map<string, AdjustmentSummary>();
    }

    const rows = await this.database
      .select({
        feeAssignmentId: feeAssignmentAdjustments.feeAssignmentId,
        totalAdjustmentAmountInPaise:
          sql<number>`coalesce(sum(${feeAssignmentAdjustments.amountInPaise}), 0)`.as(
            "total_adjustment_amount_in_paise",
          ),
        adjustmentCount: sql<number>`count(${feeAssignmentAdjustments.id})`.as(
          "adjustment_count",
        ),
      })
      .from(feeAssignmentAdjustments)
      .where(inArray(feeAssignmentAdjustments.feeAssignmentId, assignmentIds))
      .groupBy(feeAssignmentAdjustments.feeAssignmentId);

    return new Map(
      rows.map((row) => [
        row.feeAssignmentId,
        {
          totalAdjustmentAmountInPaise: Number(
            row.totalAdjustmentAmountInPaise,
          ),
          adjustmentCount: Number(row.adjustmentCount),
        },
      ]),
    );
  }

  private buildAdjustmentSummarySubquery() {
    return this.database
      .select({
        feeAssignmentId: feeAssignmentAdjustments.feeAssignmentId,
        totalAdjustmentAmountInPaise:
          sql<number>`coalesce(sum(${feeAssignmentAdjustments.amountInPaise}), 0)`.as(
            "total_adjustment_amount_in_paise",
          ),
        adjustmentCount: sql<number>`count(${feeAssignmentAdjustments.id})`.as(
          "adjustment_count",
        ),
      })
      .from(feeAssignmentAdjustments)
      .groupBy(feeAssignmentAdjustments.feeAssignmentId)
      .as("fee_assignment_adjustment_summary");
  }

  private async getFeeStructureById(id: string, institutionId: string) {
    const [matched] = await this.database
      .select({
        id: feeStructures.id,
        institutionId: feeStructures.institutionId,
        academicYearId: feeStructures.academicYearId,
        academicYearName: academicYears.name,
        campusId: feeStructures.campusId,
        campusName: campus.name,
        name: feeStructures.name,
        description: feeStructures.description,
        scope: feeStructures.scope,
        status: feeStructures.status,
        amountInPaise: feeStructures.amountInPaise,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .where(
        and(
          eq(feeStructures.id, id),
          eq(feeStructures.institutionId, institutionId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
        ),
      )
      .limit(1);

    if (!matched) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_STRUCTURE_NOT_FOUND);
    }

    const installments = await this.database
      .select({
        id: feeStructureInstallments.id,
        sortOrder: feeStructureInstallments.sortOrder,
        label: feeStructureInstallments.label,
        amountInPaise: feeStructureInstallments.amountInPaise,
        dueDate: feeStructureInstallments.dueDate,
      })
      .from(feeStructureInstallments)
      .where(eq(feeStructureInstallments.feeStructureId, id))
      .orderBy(asc(feeStructureInstallments.sortOrder));

    return this.formatFeeStructureRow(matched, installments);
  }

  private async getAssignmentRowOrThrow(
    institutionId: string,
    feeAssignmentId: string,
  ): Promise<AssignmentRow> {
    const [row] = await this.database
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
        feeStructureId: feeAssignments.feeStructureId,
        feeStructureName: feeStructures.name,
        installmentId: feeAssignments.installmentId,
        installmentLabel: feeStructureInstallments.label,
        installmentSortOrder: feeStructureInstallments.sortOrder,
        studentId: feeAssignments.studentId,
        studentAdmissionNumber: students.admissionNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        campusId: member.primaryCampusId,
        campusName: campus.name,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
        status: feeAssignments.status,
        notes: feeAssignments.notes,
        createdAt: feeAssignments.createdAt,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(
        feeStructureInstallments,
        eq(feeAssignments.installmentId, feeStructureInstallments.id),
      )
      .where(
        and(
          eq(feeAssignments.id, feeAssignmentId),
          eq(feeAssignments.institutionId, institutionId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_NOT_FOUND);
    }

    return row;
  }

  private async listAssignmentsByIds(
    institutionId: string,
    assignmentIds: string[],
  ): Promise<AssignmentRow[]> {
    if (assignmentIds.length === 0) {
      return [];
    }

    const rows = await this.database
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
        feeStructureId: feeAssignments.feeStructureId,
        feeStructureName: feeStructures.name,
        installmentId: feeAssignments.installmentId,
        installmentLabel: feeStructureInstallments.label,
        installmentSortOrder: feeStructureInstallments.sortOrder,
        studentId: feeAssignments.studentId,
        studentAdmissionNumber: students.admissionNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        campusId: member.primaryCampusId,
        campusName: campus.name,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
        status: feeAssignments.status,
        notes: feeAssignments.notes,
        createdAt: feeAssignments.createdAt,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(
        feeStructureInstallments,
        eq(feeAssignments.installmentId, feeStructureInstallments.id),
      )
      .where(
        and(
          inArray(feeAssignments.id, assignmentIds),
          eq(feeAssignments.institutionId, institutionId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      );

    const byId = new Map(rows.map((row) => [row.id, row]));
    return assignmentIds.flatMap((assignmentId) => {
      const row = byId.get(assignmentId);
      return row ? [{ ...row, status: row.status as string }] : [];
    });
  }

  private async getActivePaymentRowOrThrow(
    feePaymentId: string,
    institutionId: string,
  ) {
    const [payment] = await this.database
      .select({
        id: feePayments.id,
        feeAssignmentId: feePayments.feeAssignmentId,
        amountInPaise: feePayments.amountInPaise,
      })
      .from(feePayments)
      .leftJoin(
        feePaymentReversals,
        eq(feePaymentReversals.feePaymentId, feePayments.id),
      )
      .where(
        and(
          eq(feePayments.id, feePaymentId),
          eq(feePayments.institutionId, institutionId),
          isNull(feePayments.deletedAt),
          isNull(feePaymentReversals.id),
        ),
      )
      .limit(1);

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_PAYMENT_NOT_FOUND);
    }

    return payment;
  }

  private async getFeePaymentById(id: string, institutionId: string) {
    const [payment] = await this.database
      .select({
        id: feePayments.id,
        institutionId: feePayments.institutionId,
        feeAssignmentId: feePayments.feeAssignmentId,
        amountInPaise: feePayments.amountInPaise,
        paymentDate: feePayments.paymentDate,
        paymentMethod: feePayments.paymentMethod,
        referenceNumber: feePayments.referenceNumber,
        notes: feePayments.notes,
        reversedAt: feePaymentReversals.createdAt,
        reversalReason: feePaymentReversals.reason,
        createdAt: feePayments.createdAt,
      })
      .from(feePayments)
      .leftJoin(
        feePaymentReversals,
        eq(feePaymentReversals.feePaymentId, feePayments.id),
      )
      .where(
        and(
          eq(feePayments.id, id),
          eq(feePayments.institutionId, institutionId),
          isNull(feePayments.deletedAt),
        ),
      )
      .limit(1);

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_PAYMENT_NOT_FOUND);
    }

    return {
      ...payment,
      referenceNumber: payment.referenceNumber ?? null,
      notes: payment.notes ?? null,
      reversedAt: payment.reversedAt?.toISOString() ?? null,
      reversalReason: payment.reversalReason ?? null,
      createdAt: payment.createdAt.toISOString(),
    };
  }

  private async getFeeAdjustmentById(id: string, institutionId: string) {
    const [adjustment] = await this.database
      .select({
        id: feeAssignmentAdjustments.id,
        feeAssignmentId: feeAssignmentAdjustments.feeAssignmentId,
        adjustmentType: feeAssignmentAdjustments.adjustmentType,
        amountInPaise: feeAssignmentAdjustments.amountInPaise,
        reason: feeAssignmentAdjustments.reason,
        createdAt: feeAssignmentAdjustments.createdAt,
      })
      .from(feeAssignmentAdjustments)
      .where(
        and(
          eq(feeAssignmentAdjustments.id, id),
          eq(feeAssignmentAdjustments.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!adjustment) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_ADJUSTMENT_NOT_FOUND);
    }

    return {
      ...adjustment,
      reason: adjustment.reason ?? null,
      createdAt: adjustment.createdAt.toISOString(),
    };
  }

  private async getAcademicYearOrThrow(
    institutionId: string,
    academicYearId: string,
    options: { requireActive?: boolean } = {},
  ) {
    const conditions: SQL[] = [
      eq(academicYears.id, academicYearId),
      eq(academicYears.institutionId, institutionId),
      ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
    ];

    if (options.requireActive) {
      conditions.push(eq(academicYears.status, STATUS.ACADEMIC_YEAR.ACTIVE));
    }

    const [academicYear] = await this.database
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(and(...conditions))
      .limit(1);

    if (!academicYear) {
      if (options.requireActive) {
        throw new ConflictException(ERROR_MESSAGES.FEES.ACADEMIC_YEAR_ARCHIVED);
      }
      throw new NotFoundException(ERROR_MESSAGES.FEES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
  }

  private async getCampusOrThrow(
    institutionId: string,
    campusId: string | undefined,
  ) {
    if (!campusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_SCOPE_INVALID,
      );
    }

    const [matchedCampus] = await this.database
      .select({ id: campus.id, name: campus.name })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private async getStudentOrThrow(institutionId: string, studentId: string) {
    const [student] = await this.database
      .select({ id: students.id, campusId: member.primaryCampusId })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.id, studentId),
          eq(students.institutionId, institutionId),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!student) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return student;
  }

  private assertCampusScopeAccess(
    campusId: string | null | undefined,
    scopes: ResolvedScopes,
  ) {
    if (scopes.campusIds === "all") {
      return;
    }

    if (!campusId || !scopes.campusIds.includes(campusId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }

  private assertOptionalCampusScopeAccess(
    campusId: string | null | undefined,
    scopes: ResolvedScopes,
  ) {
    if (!campusId) {
      return;
    }

    this.assertCampusScopeAccess(campusId, scopes);
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private assertActiveCampusMatch(
    campusId: string | null | undefined,
    authSession: AuthenticatedSession,
  ) {
    if (!campusId) {
      return;
    }

    const activeCampusId = this.requireActiveCampusId(authSession);

    if (campusId !== activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }

  private async getFeeStructureOrThrow(
    institutionId: string,
    feeStructureId: string,
    options: { requireActive?: boolean } = {},
  ) {
    const conditions: SQL[] = [
      eq(feeStructures.id, feeStructureId),
      eq(feeStructures.institutionId, institutionId),
      ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
    ];

    if (options.requireActive) {
      conditions.push(eq(feeStructures.status, STATUS.FEE_STRUCTURE.ACTIVE));
    }

    const [feeStructure] = await this.database
      .select({
        id: feeStructures.id,
        campusId: feeStructures.campusId,
        scope: feeStructures.scope,
      })
      .from(feeStructures)
      .where(and(...conditions))
      .limit(1);

    if (!feeStructure) {
      if (options.requireActive) {
        throw new ConflictException(ERROR_MESSAGES.FEES.FEE_STRUCTURE_INACTIVE);
      }
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_STRUCTURE_NOT_FOUND);
    }

    return feeStructure;
  }

  private async assertFeeStructureNameAvailable(
    institutionId: string,
    academicYearId: string,
    campusId: string | null,
    name: string,
  ) {
    const existingStructure = await this.findFeeStructureIdByName(
      institutionId,
      academicYearId,
      campusId,
      name,
    );

    if (existingStructure) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_NAME_EXISTS,
      );
    }
  }

  private async generateFeeStructureCopyName(
    institutionId: string,
    academicYearId: string,
    campusId: string | null,
    sourceName: string,
  ) {
    const baseCopyName = `Copy of ${sourceName}`;
    let candidateName = baseCopyName;
    let suffix = 2;

    while (
      await this.findFeeStructureIdByName(
        institutionId,
        academicYearId,
        campusId,
        candidateName,
      )
    ) {
      candidateName = `${baseCopyName} (${suffix})`;
      suffix += 1;
    }

    return candidateName;
  }

  private async generateFeeStructureNextVersionName(
    institutionId: string,
    academicYearId: string,
    campusId: string | null,
    sourceName: string,
  ) {
    const normalizedSourceName = sourceName.trim();
    const match =
      FEE_STRUCTURE_VERSION_SUFFIX_PATTERN.exec(normalizedSourceName);
    const baseName = (
      match
        ? normalizedSourceName.replace(FEE_STRUCTURE_VERSION_SUFFIX_PATTERN, "")
        : normalizedSourceName
    ).trim();
    let nextVersion = match
      ? Number(match[1]) + 1
      : FEE_STRUCTURE_NEXT_VERSION_START;
    let candidateName = `${baseName} (v${nextVersion})`;

    while (
      await this.findFeeStructureIdByName(
        institutionId,
        academicYearId,
        campusId,
        candidateName,
      )
    ) {
      nextVersion += 1;
      candidateName = `${baseName} (v${nextVersion})`;
    }

    return candidateName;
  }

  private async findFeeStructureIdByName(
    institutionId: string,
    academicYearId: string,
    campusId: string | null,
    name: string,
  ) {
    const [existingStructure] = await this.database
      .select({ id: feeStructures.id })
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.institutionId, institutionId),
          eq(feeStructures.academicYearId, academicYearId),
          campusId
            ? eq(feeStructures.campusId, campusId)
            : isNull(feeStructures.campusId),
          eq(feeStructures.name, name),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
        ),
      )
      .limit(1);

    return existingStructure?.id ?? null;
  }

  private resolveAssignmentStatus(
    paidAmountInPaise: number,
    outstandingAmountInPaise: number,
  ) {
    if (outstandingAmountInPaise <= 0) {
      return FEE_ASSIGNMENT_STATUSES.PAID;
    }

    if (paidAmountInPaise > 0) {
      return FEE_ASSIGNMENT_STATUSES.PARTIAL;
    }

    return FEE_ASSIGNMENT_STATUSES.PENDING;
  }

  private buildStudentFullName(firstName: string, lastName: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  private toPaise(amount: number, errorMessage: string) {
    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise <= 0) {
      throw new BadRequestException(errorMessage);
    }

    return amountInPaise;
  }
}
