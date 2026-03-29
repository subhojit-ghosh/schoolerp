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
  or,
  sql,
  salaryComponents,
  salaryTemplates,
  salaryTemplateComponents,
  staffSalaryAssignments,
  payrollRuns,
  payslips,
  payslipLineItems,
  staffProfiles,
  staffAttendanceRecords,
  member,
  user,
  campus,
  leaveApplications,
  leaveTypes,
  type AppDatabase,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  SALARY_COMPONENT_STATUS,
  SALARY_TEMPLATE_STATUS,
  SALARY_ASSIGNMENT_STATUS,
  PAYROLL_RUN_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateSalaryComponentDto,
  UpdateSalaryComponentDto,
  UpdateSalaryComponentStatusDto,
  ListSalaryComponentsQueryDto,
  CreateSalaryTemplateDto,
  UpdateSalaryTemplateDto,
  UpdateSalaryTemplateStatusDto,
  ListSalaryTemplatesQueryDto,
  CreateSalaryAssignmentDto,
  UpdateSalaryAssignmentDto,
  UpdateSalaryAssignmentStatusDto,
  ListSalaryAssignmentsQueryDto,
  CreatePayrollRunDto,
  ListPayrollRunsQueryDto,
  ListPayslipsQueryDto,
  MonthlySummaryQueryDto,
  StaffHistoryQueryDto,
} from "./payroll.schemas";

// ── Sort maps ─────────────────────────────────────────────────────────────

const componentSortColumns = {
  name: salaryComponents.name,
  type: salaryComponents.type,
  sortOrder: salaryComponents.sortOrder,
  createdAt: salaryComponents.createdAt,
} as const;

const templateSortColumns = {
  name: salaryTemplates.name,
  createdAt: salaryTemplates.createdAt,
} as const;

const assignmentSortColumns = {
  staffName: user.name,
  effectiveFrom: staffSalaryAssignments.effectiveFrom,
  ctcInPaise: staffSalaryAssignments.ctcInPaise,
  createdAt: staffSalaryAssignments.createdAt,
} as const;

const runSortColumns = {
  month: payrollRuns.month,
  year: payrollRuns.year,
  status: payrollRuns.status,
  createdAt: payrollRuns.createdAt,
} as const;

const payslipSortColumns = {
  staffName: payslips.staffName,
  netPayInPaise: payslips.netPayInPaise,
  createdAt: payslips.createdAt,
} as const;

@Injectable()
export class PayrollService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Salary Components ───────────────────────────────────────────────────

  async listSalaryComponents(
    institutionId: string,
    query: ListSalaryComponentsQueryDto,
  ) {
    const { q, status, type, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = componentSortColumns[sort ?? "sortOrder"];

    const conditions = [eq(salaryComponents.institutionId, institutionId)];
    if (status) conditions.push(eq(salaryComponents.status, status));
    if (type) conditions.push(eq(salaryComponents.type, type));
    if (q) conditions.push(ilike(salaryComponents.name, `%${q}%`));

    if (!status) {
      conditions.push(
        ne(salaryComponents.status, SALARY_COMPONENT_STATUS.DELETED),
      );
    }

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(salaryComponents)
        .where(whereClause)
        .orderBy(orderFn(sortCol)),
      this.db
        .select({ count: count() })
        .from(salaryComponents)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        calculationType: r.calculationType,
        isTaxable: r.isTaxable,
        isStatutory: r.isStatutory,
        sortOrder: r.sortOrder,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createSalaryComponent(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateSalaryComponentDto,
  ) {
    const id = randomUUID();

    await this.db.insert(salaryComponents).values({
      id,
      institutionId,
      name: dto.name,
      type: dto.type,
      calculationType: dto.calculationType,
      isTaxable: dto.isTaxable,
      isStatutory: dto.isStatutory,
      sortOrder: dto.sortOrder,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_COMPONENT,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created salary component "${dto.name}"`,
    });

    return { id };
  }

  async updateSalaryComponent(
    institutionId: string,
    componentId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryComponentDto,
  ) {
    const existing = await this.findComponent(institutionId, componentId);

    const updatedName = dto.name ?? existing.name;

    await this.db
      .update(salaryComponents)
      .set({
        name: updatedName,
        type: dto.type ?? existing.type,
        calculationType: dto.calculationType ?? existing.calculationType,
        isTaxable: dto.isTaxable ?? existing.isTaxable,
        isStatutory: dto.isStatutory ?? existing.isStatutory,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
      })
      .where(eq(salaryComponents.id, componentId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_COMPONENT,
      entityId: componentId,
      entityLabel: updatedName,
      summary: `Updated salary component "${updatedName}"`,
    });

    return { id: componentId };
  }

  async updateSalaryComponentStatus(
    institutionId: string,
    componentId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryComponentStatusDto,
  ) {
    const existing = await this.findComponent(institutionId, componentId);

    await this.db
      .update(salaryComponents)
      .set({ status: dto.status })
      .where(eq(salaryComponents.id, componentId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_COMPONENT,
      entityId: componentId,
      entityLabel: existing.name,
      summary: `Changed salary component "${existing.name}" status to ${dto.status}`,
    });

    return { id: componentId };
  }

  // ── Salary Templates ────────────────────────────────────────────────────

  async listSalaryTemplates(
    institutionId: string,
    query: ListSalaryTemplatesQueryDto,
  ) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = templateSortColumns[sort ?? "name"];

    const conditions = [eq(salaryTemplates.institutionId, institutionId)];
    if (status) conditions.push(eq(salaryTemplates.status, status));
    if (q) conditions.push(ilike(salaryTemplates.name, `%${q}%`));

    if (!status) {
      conditions.push(
        ne(salaryTemplates.status, SALARY_TEMPLATE_STATUS.DELETED),
      );
    }

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(salaryTemplates)
        .where(whereClause)
        .orderBy(orderFn(sortCol)),
      this.db
        .select({ count: count() })
        .from(salaryTemplates)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getSalaryTemplate(institutionId: string, templateId: string) {
    const template = await this.findTemplate(institutionId, templateId);

    const components = await this.db
      .select({
        id: salaryTemplateComponents.id,
        salaryComponentId: salaryTemplateComponents.salaryComponentId,
        componentName: salaryComponents.name,
        componentType: salaryComponents.type,
        calculationType: salaryComponents.calculationType,
        amountInPaise: salaryTemplateComponents.amountInPaise,
        percentage: salaryTemplateComponents.percentage,
        sortOrder: salaryTemplateComponents.sortOrder,
      })
      .from(salaryTemplateComponents)
      .innerJoin(
        salaryComponents,
        eq(salaryTemplateComponents.salaryComponentId, salaryComponents.id),
      )
      .where(eq(salaryTemplateComponents.salaryTemplateId, templateId))
      .orderBy(asc(salaryTemplateComponents.sortOrder));

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      status: template.status,
      createdAt: template.createdAt.toISOString(),
      components,
    };
  }

  async createSalaryTemplate(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateSalaryTemplateDto,
  ) {
    const id = randomUUID();

    await this.db.insert(salaryTemplates).values({
      id,
      institutionId,
      name: dto.name,
      description: dto.description ?? null,
    });

    if (dto.components.length > 0) {
      await this.db.insert(salaryTemplateComponents).values(
        dto.components.map((c) => ({
          id: randomUUID(),
          salaryTemplateId: id,
          salaryComponentId: c.salaryComponentId,
          amountInPaise: c.amountInPaise ?? null,
          percentage: c.percentage ?? null,
          sortOrder: c.sortOrder,
        })),
      );
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_TEMPLATE,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created salary template "${dto.name}" with ${dto.components.length} components`,
    });

    return { id };
  }

  async updateSalaryTemplate(
    institutionId: string,
    templateId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryTemplateDto,
  ) {
    const existing = await this.findTemplate(institutionId, templateId);
    const updatedName = dto.name ?? existing.name;

    await this.db
      .update(salaryTemplates)
      .set({
        name: updatedName,
        description:
          dto.description !== undefined
            ? dto.description
            : existing.description,
      })
      .where(eq(salaryTemplates.id, templateId));

    if (dto.components) {
      // Replace all components
      await this.db
        .delete(salaryTemplateComponents)
        .where(eq(salaryTemplateComponents.salaryTemplateId, templateId));

      if (dto.components.length > 0) {
        await this.db.insert(salaryTemplateComponents).values(
          dto.components.map((c) => ({
            id: randomUUID(),
            salaryTemplateId: templateId,
            salaryComponentId: c.salaryComponentId,
            amountInPaise: c.amountInPaise ?? null,
            percentage: c.percentage ?? null,
            sortOrder: c.sortOrder,
          })),
        );
      }
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_TEMPLATE,
      entityId: templateId,
      entityLabel: updatedName,
      summary: `Updated salary template "${updatedName}"`,
    });

    return { id: templateId };
  }

  async updateSalaryTemplateStatus(
    institutionId: string,
    templateId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryTemplateStatusDto,
  ) {
    const existing = await this.findTemplate(institutionId, templateId);

    await this.db
      .update(salaryTemplates)
      .set({ status: dto.status })
      .where(eq(salaryTemplates.id, templateId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_TEMPLATE,
      entityId: templateId,
      entityLabel: existing.name,
      summary: `Changed salary template "${existing.name}" status to ${dto.status}`,
    });

    return { id: templateId };
  }

  // ── Salary Assignments ──────────────────────────────────────────────────

  async listSalaryAssignments(
    institutionId: string,
    query: ListSalaryAssignmentsQueryDto,
  ) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = assignmentSortColumns[sort ?? "createdAt"];

    const conditions = [
      eq(staffSalaryAssignments.institutionId, institutionId),
    ];
    if (status) conditions.push(eq(staffSalaryAssignments.status, status));
    if (q)
      conditions.push(
        or(ilike(user.name, `%${q}%`), ilike(salaryTemplates.name, `%${q}%`))!,
      );

    if (!status) {
      conditions.push(
        ne(staffSalaryAssignments.status, SALARY_ASSIGNMENT_STATUS.DELETED),
      );
    }

    const whereClause = and(...conditions);

    const baseQuery = this.db
      .select({
        id: staffSalaryAssignments.id,
        staffProfileId: staffSalaryAssignments.staffProfileId,
        staffName: user.name,
        staffEmployeeId: staffProfiles.employeeId,
        staffDesignation: staffProfiles.designation,
        salaryTemplateId: staffSalaryAssignments.salaryTemplateId,
        salaryTemplateName: salaryTemplates.name,
        effectiveFrom: staffSalaryAssignments.effectiveFrom,
        ctcInPaise: staffSalaryAssignments.ctcInPaise,
        overrides: staffSalaryAssignments.overrides,
        status: staffSalaryAssignments.status,
        createdAt: staffSalaryAssignments.createdAt,
      })
      .from(staffSalaryAssignments)
      .innerJoin(
        staffProfiles,
        eq(staffSalaryAssignments.staffProfileId, staffProfiles.id),
      )
      .innerJoin(member, eq(staffProfiles.membershipId, member.id))
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(
        salaryTemplates,
        eq(staffSalaryAssignments.salaryTemplateId, salaryTemplates.id),
      )
      .where(whereClause);

    const [allRows, totalResult] = await Promise.all([
      baseQuery.orderBy(orderFn(sortCol)),
      this.db
        .select({ count: count() })
        .from(staffSalaryAssignments)
        .innerJoin(
          staffProfiles,
          eq(staffSalaryAssignments.staffProfileId, staffProfiles.id),
        )
        .innerJoin(member, eq(staffProfiles.membershipId, member.id))
        .innerJoin(user, eq(member.userId, user.id))
        .innerJoin(
          salaryTemplates,
          eq(staffSalaryAssignments.salaryTemplateId, salaryTemplates.id),
        )
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        ...r,
        staffEmployeeId: r.staffEmployeeId ?? null,
        staffDesignation: r.staffDesignation ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getSalaryAssignment(institutionId: string, assignmentId: string) {
    const rows = await this.db
      .select({
        id: staffSalaryAssignments.id,
        staffProfileId: staffSalaryAssignments.staffProfileId,
        staffName: user.name,
        staffEmployeeId: staffProfiles.employeeId,
        staffDesignation: staffProfiles.designation,
        salaryTemplateId: staffSalaryAssignments.salaryTemplateId,
        salaryTemplateName: salaryTemplates.name,
        effectiveFrom: staffSalaryAssignments.effectiveFrom,
        ctcInPaise: staffSalaryAssignments.ctcInPaise,
        overrides: staffSalaryAssignments.overrides,
        status: staffSalaryAssignments.status,
        createdAt: staffSalaryAssignments.createdAt,
      })
      .from(staffSalaryAssignments)
      .innerJoin(
        staffProfiles,
        eq(staffSalaryAssignments.staffProfileId, staffProfiles.id),
      )
      .innerJoin(member, eq(staffProfiles.membershipId, member.id))
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(
        salaryTemplates,
        eq(staffSalaryAssignments.salaryTemplateId, salaryTemplates.id),
      )
      .where(
        and(
          eq(staffSalaryAssignments.id, assignmentId),
          eq(staffSalaryAssignments.institutionId, institutionId),
        ),
      );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.ASSIGNMENT_NOT_FOUND);
    }

    return {
      ...row,
      staffEmployeeId: row.staffEmployeeId ?? null,
      staffDesignation: row.staffDesignation ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createSalaryAssignment(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateSalaryAssignmentDto,
  ) {
    // Verify staff profile exists
    const profile = await this.db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(
        and(
          eq(staffProfiles.id, dto.staffProfileId),
          eq(staffProfiles.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!profile) {
      throw new NotFoundException("Staff profile not found.");
    }

    // Verify template exists
    await this.findTemplate(institutionId, dto.salaryTemplateId);

    // Calculate CTC from template components + overrides
    const ctcInPaise = await this.calculateCtc(
      dto.salaryTemplateId,
      dto.overrides ?? undefined,
    );

    const id = randomUUID();

    await this.db.insert(staffSalaryAssignments).values({
      id,
      institutionId,
      staffProfileId: dto.staffProfileId,
      salaryTemplateId: dto.salaryTemplateId,
      effectiveFrom: dto.effectiveFrom,
      ctcInPaise,
      overrides: dto.overrides ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.STAFF_SALARY_ASSIGNMENT,
      entityId: id,
      summary: `Assigned salary template to staff (CTC: ${ctcInPaise} paise)`,
    });

    return { id };
  }

  async updateSalaryAssignment(
    institutionId: string,
    assignmentId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryAssignmentDto,
  ) {
    const existing = await this.db
      .select()
      .from(staffSalaryAssignments)
      .where(
        and(
          eq(staffSalaryAssignments.id, assignmentId),
          eq(staffSalaryAssignments.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.ASSIGNMENT_NOT_FOUND);
    }

    const overrides =
      dto.overrides !== undefined ? dto.overrides : existing.overrides;
    const ctcInPaise = await this.calculateCtc(
      existing.salaryTemplateId,
      (overrides as Record<
        string,
        { amountInPaise?: number | null; percentage?: number | null }
      >) ?? undefined,
    );

    await this.db
      .update(staffSalaryAssignments)
      .set({
        effectiveFrom: dto.effectiveFrom ?? existing.effectiveFrom,
        overrides: overrides ?? null,
        ctcInPaise,
      })
      .where(eq(staffSalaryAssignments.id, assignmentId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.STAFF_SALARY_ASSIGNMENT,
      entityId: assignmentId,
      summary: `Updated salary assignment (CTC: ${ctcInPaise} paise)`,
    });

    return { id: assignmentId };
  }

  async updateSalaryAssignmentStatus(
    institutionId: string,
    assignmentId: string,
    session: AuthenticatedSession,
    dto: UpdateSalaryAssignmentStatusDto,
  ) {
    const existing = await this.db
      .select()
      .from(staffSalaryAssignments)
      .where(
        and(
          eq(staffSalaryAssignments.id, assignmentId),
          eq(staffSalaryAssignments.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.ASSIGNMENT_NOT_FOUND);
    }

    await this.db
      .update(staffSalaryAssignments)
      .set({ status: dto.status })
      .where(eq(staffSalaryAssignments.id, assignmentId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.STAFF_SALARY_ASSIGNMENT,
      entityId: assignmentId,
      summary: `Changed salary assignment status to ${dto.status}`,
    });

    return { id: assignmentId };
  }

  // ── Payroll Runs ────────────────────────────────────────────────────────

  async listPayrollRuns(institutionId: string, query: ListPayrollRunsQueryDto) {
    const { year, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = runSortColumns[sort ?? "createdAt"];

    const conditions = [eq(payrollRuns.institutionId, institutionId)];
    if (year) conditions.push(eq(payrollRuns.year, year));
    if (status) conditions.push(eq(payrollRuns.status, status));

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select({
          id: payrollRuns.id,
          month: payrollRuns.month,
          year: payrollRuns.year,
          campusId: payrollRuns.campusId,
          campusName: campus.name,
          status: payrollRuns.status,
          totalEarningsInPaise: payrollRuns.totalEarningsInPaise,
          totalDeductionsInPaise: payrollRuns.totalDeductionsInPaise,
          totalNetPayInPaise: payrollRuns.totalNetPayInPaise,
          staffCount: payrollRuns.staffCount,
          workingDays: payrollRuns.workingDays,
          processedAt: payrollRuns.processedAt,
          approvedAt: payrollRuns.approvedAt,
          paidAt: payrollRuns.paidAt,
          createdAt: payrollRuns.createdAt,
        })
        .from(payrollRuns)
        .leftJoin(campus, eq(payrollRuns.campusId, campus.id))
        .where(whereClause)
        .orderBy(orderFn(sortCol)),
      this.db.select({ count: count() }).from(payrollRuns).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        ...r,
        campusId: r.campusId ?? null,
        campusName: r.campusName ?? null,
        processedAt: r.processedAt?.toISOString() ?? null,
        approvedAt: r.approvedAt?.toISOString() ?? null,
        paidAt: r.paidAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getPayrollRun(institutionId: string, runId: string) {
    const rows = await this.db
      .select({
        id: payrollRuns.id,
        month: payrollRuns.month,
        year: payrollRuns.year,
        campusId: payrollRuns.campusId,
        campusName: campus.name,
        status: payrollRuns.status,
        totalEarningsInPaise: payrollRuns.totalEarningsInPaise,
        totalDeductionsInPaise: payrollRuns.totalDeductionsInPaise,
        totalNetPayInPaise: payrollRuns.totalNetPayInPaise,
        staffCount: payrollRuns.staffCount,
        workingDays: payrollRuns.workingDays,
        processedAt: payrollRuns.processedAt,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(campus, eq(payrollRuns.campusId, campus.id))
      .where(
        and(
          eq(payrollRuns.id, runId),
          eq(payrollRuns.institutionId, institutionId),
        ),
      );

    const row = rows[0];
    if (!row) throw new NotFoundException(ERROR_MESSAGES.PAYROLL.RUN_NOT_FOUND);

    return {
      ...row,
      campusId: row.campusId ?? null,
      campusName: row.campusName ?? null,
      processedAt: row.processedAt?.toISOString() ?? null,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createPayrollRun(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreatePayrollRunDto,
  ) {
    // Check for existing run for same month/year/campus
    const existing = await this.db
      .select({ id: payrollRuns.id })
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.institutionId, institutionId),
          eq(payrollRuns.month, dto.month),
          eq(payrollRuns.year, dto.year),
          dto.campusId
            ? eq(payrollRuns.campusId, dto.campusId)
            : sql`${payrollRuns.campusId} IS NULL`,
        ),
      )
      .then((rows) => rows[0]);

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.PAYROLL.RUN_ALREADY_EXISTS);
    }

    const id = randomUUID();

    await this.db.insert(payrollRuns).values({
      id,
      institutionId,
      month: dto.month,
      year: dto.year,
      campusId: dto.campusId ?? null,
      workingDays: dto.workingDays,
      status: PAYROLL_RUN_STATUS.DRAFT,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.PAYROLL_RUN,
      entityId: id,
      summary: `Created payroll run for ${dto.month}/${dto.year}`,
    });

    return { id };
  }

  async processPayrollRun(
    institutionId: string,
    runId: string,
    session: AuthenticatedSession,
  ) {
    const run = await this.db
      .select()
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.id, runId),
          eq(payrollRuns.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!run) throw new NotFoundException(ERROR_MESSAGES.PAYROLL.RUN_NOT_FOUND);
    if (run.status !== PAYROLL_RUN_STATUS.DRAFT) {
      throw new BadRequestException(ERROR_MESSAGES.PAYROLL.RUN_NOT_DRAFT);
    }

    // Get all staff with active salary assignments
    const assignmentConditions = [
      eq(staffSalaryAssignments.institutionId, institutionId),
      eq(staffSalaryAssignments.status, SALARY_ASSIGNMENT_STATUS.ACTIVE),
    ];

    if (run.campusId) {
      assignmentConditions.push(eq(member.primaryCampusId, run.campusId));
    }

    const staffAssignments = await this.db
      .select({
        assignmentId: staffSalaryAssignments.id,
        staffProfileId: staffSalaryAssignments.staffProfileId,
        salaryTemplateId: staffSalaryAssignments.salaryTemplateId,
        overrides: staffSalaryAssignments.overrides,
        staffName: user.name,
        staffEmployeeId: staffProfiles.employeeId,
        staffDesignation: staffProfiles.designation,
        staffDepartment: staffProfiles.department,
        membershipId: staffProfiles.membershipId,
      })
      .from(staffSalaryAssignments)
      .innerJoin(
        staffProfiles,
        eq(staffSalaryAssignments.staffProfileId, staffProfiles.id),
      )
      .innerJoin(member, eq(staffProfiles.membershipId, member.id))
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(...assignmentConditions));

    if (staffAssignments.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.PAYROLL.NO_STAFF_TO_PROCESS);
    }

    // Calculate month boundaries for leave lookup
    const monthStart = `${run.year}-${String(run.month).padStart(2, "0")}-01`;
    const lastDay = new Date(run.year, run.month, 0).getDate();
    const monthEnd = `${run.year}-${String(run.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    let runTotalEarnings = 0;
    let runTotalDeductions = 0;
    let runTotalNet = 0;

    // Delete any existing payslips for this run (re-processing)
    const existingPayslipIds = await this.db
      .select({ id: payslips.id })
      .from(payslips)
      .where(eq(payslips.payrollRunId, runId));

    for (const ps of existingPayslipIds) {
      await this.db
        .delete(payslipLineItems)
        .where(eq(payslipLineItems.payslipId, ps.id));
    }
    await this.db.delete(payslips).where(eq(payslips.payrollRunId, runId));

    for (const sa of staffAssignments) {
      // Get approved leaves for this staff in this month
      const approvedLeaves = await this.db
        .select({
          daysCount: leaveApplications.daysCount,
          isPaid: leaveTypes.isPaid,
        })
        .from(leaveApplications)
        .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
        .where(
          and(
            eq(leaveApplications.institutionId, institutionId),
            eq(leaveApplications.staffMemberId, sa.membershipId),
            eq(leaveApplications.status, "approved"),
            lte(leaveApplications.fromDate, monthEnd),
            gte(leaveApplications.toDate, monthStart),
          ),
        );

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      for (const leave of approvedLeaves) {
        if (leave.isPaid) {
          paidLeaveDays += leave.daysCount;
        } else {
          unpaidLeaveDays += leave.daysCount;
        }
      }

      // Also check staff attendance for absent days not covered by leave
      const attendanceAbsent = await this.db
        .select({ count: count() })
        .from(staffAttendanceRecords)
        .where(
          and(
            eq(staffAttendanceRecords.institutionId, institutionId),
            eq(staffAttendanceRecords.staffMembershipId, sa.membershipId),
            gte(staffAttendanceRecords.attendanceDate, monthStart),
            lte(staffAttendanceRecords.attendanceDate, monthEnd),
            eq(staffAttendanceRecords.status, "absent"),
          ),
        );
      const absentDays = attendanceAbsent[0]?.count ?? 0;

      // Half-day attendance counts as 0.5 absent
      const attendanceHalfDay = await this.db
        .select({ count: count() })
        .from(staffAttendanceRecords)
        .where(
          and(
            eq(staffAttendanceRecords.institutionId, institutionId),
            eq(staffAttendanceRecords.staffMembershipId, sa.membershipId),
            gte(staffAttendanceRecords.attendanceDate, monthStart),
            lte(staffAttendanceRecords.attendanceDate, monthEnd),
            eq(staffAttendanceRecords.status, "half_day"),
          ),
        );
      const halfDayCount = attendanceHalfDay[0]?.count ?? 0;

      // Total LOP = unpaid leave days + attendance absences + half(half-day attendance)
      const totalLopDays =
        unpaidLeaveDays + absentDays + Math.ceil(halfDayCount * 0.5);

      const workingDays = run.workingDays;
      const presentDays = Math.max(
        0,
        workingDays - paidLeaveDays - totalLopDays,
      );
      const effectiveDays = presentDays + paidLeaveDays;

      // Get template components
      const templateComps = await this.db
        .select({
          componentId: salaryTemplateComponents.salaryComponentId,
          amountInPaise: salaryTemplateComponents.amountInPaise,
          percentage: salaryTemplateComponents.percentage,
          componentName: salaryComponents.name,
          componentType: salaryComponents.type,
          calculationType: salaryComponents.calculationType,
        })
        .from(salaryTemplateComponents)
        .innerJoin(
          salaryComponents,
          eq(salaryTemplateComponents.salaryComponentId, salaryComponents.id),
        )
        .where(
          eq(salaryTemplateComponents.salaryTemplateId, sa.salaryTemplateId),
        )
        .orderBy(asc(salaryTemplateComponents.sortOrder));

      const overrides = (sa.overrides ?? {}) as Record<
        string,
        { amountInPaise?: number | null; percentage?: number | null }
      >;

      // First pass: find basic salary (first earning with fixed type)
      let basicMonthly = 0;
      for (const tc of templateComps) {
        if (tc.componentType === "earning" && tc.calculationType === "fixed") {
          const override = overrides[tc.componentId];
          const amt = override?.amountInPaise ?? tc.amountInPaise ?? 0;
          basicMonthly = amt;
          break;
        }
      }

      // Pro-rate basic based on effective days
      const proRatedBasic =
        workingDays > 0
          ? Math.round((basicMonthly * effectiveDays) / workingDays)
          : 0;

      // Second pass: calculate all line items
      const lineItems: {
        componentId: string;
        componentName: string;
        componentType: string;
        amountInPaise: number;
      }[] = [];

      let totalEarnings = 0;
      let totalDeductions = 0;

      for (const tc of templateComps) {
        const override = overrides[tc.componentId];
        let amount: number;

        if (tc.calculationType === "fixed") {
          const fullAmount = override?.amountInPaise ?? tc.amountInPaise ?? 0;
          amount =
            workingDays > 0
              ? Math.round((fullAmount * effectiveDays) / workingDays)
              : 0;
        } else {
          // Percentage-based: calculate on pro-rated basic
          const pct = override?.percentage ?? tc.percentage ?? 0;
          amount = Math.round((proRatedBasic * pct) / 10000); // basis points
        }

        lineItems.push({
          componentId: tc.componentId,
          componentName: tc.componentName,
          componentType: tc.componentType,
          amountInPaise: amount,
        });

        if (tc.componentType === "earning") {
          totalEarnings += amount;
        } else {
          totalDeductions += amount;
        }
      }

      const netPay = totalEarnings - totalDeductions;

      const payslipId = randomUUID();
      await this.db.insert(payslips).values({
        id: payslipId,
        institutionId,
        payrollRunId: runId,
        staffProfileId: sa.staffProfileId,
        salaryAssignmentId: sa.assignmentId,
        staffName: sa.staffName,
        staffEmployeeId: sa.staffEmployeeId ?? null,
        staffDesignation: sa.staffDesignation ?? null,
        staffDepartment: sa.staffDepartment ?? null,
        workingDays,
        presentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        totalEarningsInPaise: totalEarnings,
        totalDeductionsInPaise: totalDeductions,
        netPayInPaise: netPay,
      });

      if (lineItems.length > 0) {
        await this.db.insert(payslipLineItems).values(
          lineItems.map((li) => ({
            id: randomUUID(),
            payslipId,
            salaryComponentId: li.componentId,
            componentName: li.componentName,
            componentType: li.componentType as "earning" | "deduction",
            amountInPaise: li.amountInPaise,
          })),
        );
      }

      runTotalEarnings += totalEarnings;
      runTotalDeductions += totalDeductions;
      runTotalNet += netPay;
    }

    // Update payroll run with totals
    const memberRow = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    await this.db
      .update(payrollRuns)
      .set({
        status: PAYROLL_RUN_STATUS.PROCESSED,
        totalEarningsInPaise: runTotalEarnings,
        totalDeductionsInPaise: runTotalDeductions,
        totalNetPayInPaise: runTotalNet,
        staffCount: staffAssignments.length,
        processedByMemberId: memberRow?.id ?? null,
        processedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.EXECUTE,
      entityType: AUDIT_ENTITY_TYPES.PAYROLL_RUN,
      entityId: runId,
      summary: `Processed payroll run for ${run.month}/${run.year} — ${staffAssignments.length} staff`,
    });

    return { id: runId };
  }

  async approvePayrollRun(
    institutionId: string,
    runId: string,
    session: AuthenticatedSession,
  ) {
    const run = await this.db
      .select()
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.id, runId),
          eq(payrollRuns.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!run) throw new NotFoundException(ERROR_MESSAGES.PAYROLL.RUN_NOT_FOUND);
    if (run.status !== PAYROLL_RUN_STATUS.PROCESSED) {
      throw new BadRequestException(ERROR_MESSAGES.PAYROLL.RUN_NOT_PROCESSED);
    }

    const memberRow = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    await this.db
      .update(payrollRuns)
      .set({
        status: PAYROLL_RUN_STATUS.APPROVED,
        approvedByMemberId: memberRow?.id ?? null,
        approvedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.PAYROLL_RUN,
      entityId: runId,
      summary: `Approved payroll run for ${run.month}/${run.year}`,
    });

    return { id: runId };
  }

  async markPayrollRunPaid(
    institutionId: string,
    runId: string,
    session: AuthenticatedSession,
  ) {
    const run = await this.db
      .select()
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.id, runId),
          eq(payrollRuns.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!run) throw new NotFoundException(ERROR_MESSAGES.PAYROLL.RUN_NOT_FOUND);
    if (run.status !== PAYROLL_RUN_STATUS.APPROVED) {
      throw new BadRequestException(ERROR_MESSAGES.PAYROLL.RUN_NOT_APPROVED);
    }

    await this.db
      .update(payrollRuns)
      .set({
        status: PAYROLL_RUN_STATUS.PAID,
        paidAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.PAYROLL_RUN,
      entityId: runId,
      summary: `Marked payroll run for ${run.month}/${run.year} as paid`,
    });

    return { id: runId };
  }

  // ── Payslips ────────────────────────────────────────────────────────────

  async listPayslips(
    institutionId: string,
    runId: string,
    query: ListPayslipsQueryDto,
  ) {
    const { q, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = payslipSortColumns[sort ?? "staffName"];

    const conditions = [
      eq(payslips.institutionId, institutionId),
      eq(payslips.payrollRunId, runId),
    ];
    if (q) {
      conditions.push(
        or(
          ilike(payslips.staffName, `%${q}%`),
          ilike(payslips.staffEmployeeId, `%${q}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(payslips)
        .where(whereClause)
        .orderBy(orderFn(sortCol)),
      this.db.select({ count: count() }).from(payslips).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        payrollRunId: r.payrollRunId,
        staffProfileId: r.staffProfileId,
        staffName: r.staffName,
        staffEmployeeId: r.staffEmployeeId,
        staffDesignation: r.staffDesignation,
        staffDepartment: r.staffDepartment,
        workingDays: r.workingDays,
        presentDays: r.presentDays,
        paidLeaveDays: r.paidLeaveDays,
        unpaidLeaveDays: r.unpaidLeaveDays,
        totalEarningsInPaise: r.totalEarningsInPaise,
        totalDeductionsInPaise: r.totalDeductionsInPaise,
        netPayInPaise: r.netPayInPaise,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getPayslip(institutionId: string, payslipId: string) {
    const row = await this.db
      .select({
        id: payslips.id,
        payrollRunId: payslips.payrollRunId,
        staffProfileId: payslips.staffProfileId,
        staffName: payslips.staffName,
        staffEmployeeId: payslips.staffEmployeeId,
        staffDesignation: payslips.staffDesignation,
        staffDepartment: payslips.staffDepartment,
        workingDays: payslips.workingDays,
        presentDays: payslips.presentDays,
        paidLeaveDays: payslips.paidLeaveDays,
        unpaidLeaveDays: payslips.unpaidLeaveDays,
        totalEarningsInPaise: payslips.totalEarningsInPaise,
        totalDeductionsInPaise: payslips.totalDeductionsInPaise,
        netPayInPaise: payslips.netPayInPaise,
        createdAt: payslips.createdAt,
        month: payrollRuns.month,
        year: payrollRuns.year,
      })
      .from(payslips)
      .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
      .where(
        and(
          eq(payslips.id, payslipId),
          eq(payslips.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!row)
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.PAYSLIP_NOT_FOUND);

    const lineItems = await this.db
      .select()
      .from(payslipLineItems)
      .where(eq(payslipLineItems.payslipId, payslipId));

    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      lineItems: lineItems.map((li) => ({
        id: li.id,
        salaryComponentId: li.salaryComponentId,
        componentName: li.componentName,
        componentType: li.componentType,
        amountInPaise: li.amountInPaise,
      })),
    };
  }

  // ── Reports ─────────────────────────────────────────────────────────────

  async getMonthlySummary(
    institutionId: string,
    query: MonthlySummaryQueryDto,
  ) {
    const runs = await this.db
      .select({
        id: payrollRuns.id,
        campusId: payrollRuns.campusId,
        campusName: campus.name,
        status: payrollRuns.status,
        totalEarningsInPaise: payrollRuns.totalEarningsInPaise,
        totalDeductionsInPaise: payrollRuns.totalDeductionsInPaise,
        totalNetPayInPaise: payrollRuns.totalNetPayInPaise,
        staffCount: payrollRuns.staffCount,
      })
      .from(payrollRuns)
      .leftJoin(campus, eq(payrollRuns.campusId, campus.id))
      .where(
        and(
          eq(payrollRuns.institutionId, institutionId),
          eq(payrollRuns.month, query.month),
          eq(payrollRuns.year, query.year),
        ),
      );

    return { month: query.month, year: query.year, runs };
  }

  async getStaffHistory(
    institutionId: string,
    staffProfileId: string,
    query: StaffHistoryQueryDto,
  ) {
    const pageSize = resolveTablePageSize(query.limit);

    const conditions = [
      eq(payslips.institutionId, institutionId),
      eq(payslips.staffProfileId, staffProfileId),
    ];

    const whereClause = and(...conditions);

    const [allRows, totalResult] = await Promise.all([
      this.db
        .select({
          id: payslips.id,
          month: payrollRuns.month,
          year: payrollRuns.year,
          workingDays: payslips.workingDays,
          presentDays: payslips.presentDays,
          paidLeaveDays: payslips.paidLeaveDays,
          unpaidLeaveDays: payslips.unpaidLeaveDays,
          totalEarningsInPaise: payslips.totalEarningsInPaise,
          totalDeductionsInPaise: payslips.totalDeductionsInPaise,
          netPayInPaise: payslips.netPayInPaise,
          createdAt: payslips.createdAt,
        })
        .from(payslips)
        .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
        .where(whereClause)
        .orderBy(desc(payrollRuns.year), desc(payrollRuns.month)),
      this.db.select({ count: count() }).from(payslips).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);
    const rows = allRows.slice(pagination.offset, pagination.offset + pageSize);

    return {
      rows: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  // ── Bank File Export ────────────────────────────────────────────────────

  async generateBankFile(
    institutionId: string,
    runId: string,
  ): Promise<{ fileName: string; content: string }> {
    const run = await this.db
      .select()
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.id, runId),
          eq(payrollRuns.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!run) throw new NotFoundException(ERROR_MESSAGES.PAYROLL.RUN_NOT_FOUND);
    if (run.status === PAYROLL_RUN_STATUS.DRAFT) {
      throw new BadRequestException(
        "Payroll run must be processed before exporting bank file.",
      );
    }

    const slips = await this.db
      .select({
        staffName: payslips.staffName,
        staffEmployeeId: payslips.staffEmployeeId,
        netPayInPaise: payslips.netPayInPaise,
      })
      .from(payslips)
      .where(
        and(
          eq(payslips.payrollRunId, runId),
          eq(payslips.institutionId, institutionId),
        ),
      )
      .orderBy(asc(payslips.staffName));

    // Generate CSV for bank transfer (NEFT/RTGS compatible)
    const header = [
      "Sr No",
      "Employee Name",
      "Employee ID",
      "Net Pay (INR)",
      "Payment Mode",
    ].join(",");

    const rows: string[] = slips.map((slip, i) => {
      const netPayRupees = (slip.netPayInPaise / 100).toFixed(2);
      return [
        i + 1,
        `"${slip.staffName}"`,
        slip.staffEmployeeId ?? "",
        netPayRupees,
        "NEFT",
      ].join(",");
    });

    const totalNet = slips.reduce((sum, s) => sum + s.netPayInPaise, 0);
    rows.push("");
    rows.push(`,,Total,${(totalNet / 100).toFixed(2)},`);

    const content = [header, ...rows].join("\n");
    const fileName = `bank-transfer-${run.year}-${String(run.month).padStart(2, "0")}.csv`;

    return { fileName, content };
  }

  // ── Statutory Template Seeding ────────────────────────────────────────

  async seedStatutoryComponents(
    institutionId: string,
    session: AuthenticatedSession,
  ) {
    const STATUTORY_COMPONENTS = [
      {
        name: "Basic Salary",
        type: "earning" as const,
        calculationType: "fixed" as const,
        isTaxable: true,
        isStatutory: false,
        sortOrder: 1,
      },
      {
        name: "House Rent Allowance (HRA)",
        type: "earning" as const,
        calculationType: "percentage" as const,
        isTaxable: true,
        isStatutory: false,
        sortOrder: 2,
      },
      {
        name: "Dearness Allowance (DA)",
        type: "earning" as const,
        calculationType: "percentage" as const,
        isTaxable: true,
        isStatutory: false,
        sortOrder: 3,
      },
      {
        name: "Conveyance Allowance",
        type: "earning" as const,
        calculationType: "fixed" as const,
        isTaxable: false,
        isStatutory: false,
        sortOrder: 4,
      },
      {
        name: "Provident Fund (PF) - Employee",
        type: "deduction" as const,
        calculationType: "percentage" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 10,
      },
      {
        name: "Provident Fund (PF) - Employer",
        type: "deduction" as const,
        calculationType: "percentage" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 11,
      },
      {
        name: "ESI - Employee",
        type: "deduction" as const,
        calculationType: "percentage" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 12,
      },
      {
        name: "ESI - Employer",
        type: "deduction" as const,
        calculationType: "percentage" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 13,
      },
      {
        name: "Professional Tax",
        type: "deduction" as const,
        calculationType: "fixed" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 14,
      },
      {
        name: "TDS (Income Tax)",
        type: "deduction" as const,
        calculationType: "fixed" as const,
        isTaxable: false,
        isStatutory: true,
        sortOrder: 15,
      },
    ];

    let created = 0;

    for (const comp of STATUTORY_COMPONENTS) {
      // Check if component with same name already exists
      const existing = await this.db
        .select({ id: salaryComponents.id })
        .from(salaryComponents)
        .where(
          and(
            eq(salaryComponents.institutionId, institutionId),
            eq(salaryComponents.name, comp.name),
            ne(salaryComponents.status, SALARY_COMPONENT_STATUS.DELETED),
          ),
        )
        .then((rows) => rows[0]);

      if (existing) continue;

      await this.db.insert(salaryComponents).values({
        id: randomUUID(),
        institutionId,
        ...comp,
      });
      created++;
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SALARY_COMPONENT,
      entityId: institutionId,
      summary: `Seeded ${created} statutory salary components`,
    });

    return { created };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private async findComponent(institutionId: string, componentId: string) {
    const row = await this.db
      .select()
      .from(salaryComponents)
      .where(
        and(
          eq(salaryComponents.id, componentId),
          eq(salaryComponents.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.COMPONENT_NOT_FOUND);
    }
    return row;
  }

  private async findTemplate(institutionId: string, templateId: string) {
    const row = await this.db
      .select()
      .from(salaryTemplates)
      .where(
        and(
          eq(salaryTemplates.id, templateId),
          eq(salaryTemplates.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.PAYROLL.TEMPLATE_NOT_FOUND);
    }
    return row;
  }

  private async calculateCtc(
    templateId: string,
    overrides?: Record<
      string,
      { amountInPaise?: number | null; percentage?: number | null }
    >,
  ): Promise<number> {
    const components = await this.db
      .select({
        componentId: salaryTemplateComponents.salaryComponentId,
        amountInPaise: salaryTemplateComponents.amountInPaise,
        percentage: salaryTemplateComponents.percentage,
        componentType: salaryComponents.type,
        calculationType: salaryComponents.calculationType,
      })
      .from(salaryTemplateComponents)
      .innerJoin(
        salaryComponents,
        eq(salaryTemplateComponents.salaryComponentId, salaryComponents.id),
      )
      .where(eq(salaryTemplateComponents.salaryTemplateId, templateId));

    // Find basic first (first fixed earning)
    let basic = 0;
    for (const c of components) {
      if (c.componentType === "earning" && c.calculationType === "fixed") {
        const override = overrides?.[c.componentId];
        basic = override?.amountInPaise ?? c.amountInPaise ?? 0;
        break;
      }
    }

    let totalEarnings = 0;
    let totalDeductions = 0;

    for (const c of components) {
      const override = overrides?.[c.componentId];
      let amount: number;

      if (c.calculationType === "fixed") {
        amount = override?.amountInPaise ?? c.amountInPaise ?? 0;
      } else {
        const pct = override?.percentage ?? c.percentage ?? 0;
        amount = Math.round((basic * pct) / 10000);
      }

      if (c.componentType === "earning") {
        totalEarnings += amount;
      } else {
        totalDeductions += amount;
      }
    }

    return totalEarnings - totalDeductions;
  }
}
