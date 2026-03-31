import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  FEE_ADJUSTMENT_TYPES,
  SCHOLARSHIP_APPLICATION_STATUS,
  SCHOLARSHIP_STATUS,
} from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  count,
  desc,
  eq,
  feeAssignmentAdjustments,
  feeAssignments,
  ilike,
  lte,
  member,
  ne,
  or,
  scholarshipApplications,
  scholarships,
  sql,
  students,
  user,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateApplicationDto,
  CreateScholarshipDto,
  ListApplicationsQueryDto,
  ListExpiringApplicationsQueryDto,
  ListScholarshipsQueryDto,
  ReviewApplicationDto,
  UpdateDbtStatusDto,
  UpdateScholarshipDto,
  UpdateScholarshipStatusDto,
} from "./scholarships.schemas";

// ── Sort maps ────────────────────────────────────────────────────────────────

const scholarshipSortColumns = {
  name: scholarships.name,
  createdAt: scholarships.createdAt,
} as const;

const applicationSortColumns = {
  createdAt: scholarshipApplications.createdAt,
} as const;

@Injectable()
export class ScholarshipsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Scholarship CRUD ───────────────────────────────────────────────────

  async listScholarships(
    institutionId: string,
    query: ListScholarshipsQueryDto,
  ) {
    const {
      q,
      scholarshipType,
      status,
      academicYearId,
      page,
      limit,
      sort,
      order,
    } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = scholarshipSortColumns[sort ?? "name"];

    const conditions = [
      eq(scholarships.institutionId, institutionId),
      ne(scholarships.status, SCHOLARSHIP_STATUS.DELETED),
    ];
    if (q) {
      conditions.push(ilike(scholarships.name, `%${q}%`));
    }
    if (scholarshipType) {
      conditions.push(eq(scholarships.scholarshipType, scholarshipType));
    }
    if (status) {
      conditions.push(eq(scholarships.status, status));
    }
    if (academicYearId) {
      conditions.push(eq(scholarships.academicYearId, academicYearId));
    }

    const where = and(...conditions)!;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(scholarships)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: scholarships.id,
        institutionId: scholarships.institutionId,
        name: scholarships.name,
        description: scholarships.description,
        scholarshipType: scholarships.scholarshipType,
        amountInPaise: scholarships.amountInPaise,
        percentageDiscount: scholarships.percentageDiscount,
        eligibilityCriteria: scholarships.eligibilityCriteria,
        maxRecipients: scholarships.maxRecipients,
        academicYearId: scholarships.academicYearId,
        academicYearName: academicYears.name,
        renewalRequired: scholarships.renewalRequired,
        renewalPeriodMonths: scholarships.renewalPeriodMonths,
        status: scholarships.status,
        activeApplicationCount: sql<number>`(
          SELECT COUNT(*)::int FROM scholarship_applications sa
          WHERE sa.scholarship_id = ${scholarships.id}
          AND sa.status IN ('pending', 'approved')
        )`,
        createdAt: scholarships.createdAt,
      })
      .from(scholarships)
      .leftJoin(
        academicYears,
        eq(scholarships.academicYearId, academicYears.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: safePage,
      pageSize,
      pageCount,
    };
  }

  async createScholarship(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateScholarshipDto,
  ) {
    const id = randomUUID();

    await this.db.insert(scholarships).values({
      id,
      institutionId,
      name: dto.name,
      description: dto.description ?? null,
      scholarshipType: dto.scholarshipType,
      amountInPaise: dto.amountInPaise ?? null,
      percentageDiscount: dto.percentageDiscount ?? null,
      eligibilityCriteria: dto.eligibilityCriteria ?? null,
      maxRecipients: dto.maxRecipients ?? null,
      academicYearId: dto.academicYearId ?? null,
      renewalRequired: dto.renewalRequired,
      renewalPeriodMonths: dto.renewalPeriodMonths ?? null,
      status: SCHOLARSHIP_STATUS.ACTIVE,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created scholarship "${dto.name}" (${dto.scholarshipType})`,
    });

    return this.getScholarshipById(institutionId, id);
  }

  async updateScholarship(
    institutionId: string,
    scholarshipId: string,
    session: AuthenticatedSession,
    dto: UpdateScholarshipDto,
  ) {
    const existing = await this.findScholarship(institutionId, scholarshipId);

    await this.db
      .update(scholarships)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.scholarshipType !== undefined && {
          scholarshipType: dto.scholarshipType,
        }),
        ...(dto.amountInPaise !== undefined && {
          amountInPaise: dto.amountInPaise,
        }),
        ...(dto.percentageDiscount !== undefined && {
          percentageDiscount: dto.percentageDiscount,
        }),
        ...(dto.eligibilityCriteria !== undefined && {
          eligibilityCriteria: dto.eligibilityCriteria,
        }),
        ...(dto.maxRecipients !== undefined && {
          maxRecipients: dto.maxRecipients,
        }),
        ...(dto.academicYearId !== undefined && {
          academicYearId: dto.academicYearId,
        }),
        ...(dto.renewalRequired !== undefined && {
          renewalRequired: dto.renewalRequired,
        }),
        ...(dto.renewalPeriodMonths !== undefined && {
          renewalPeriodMonths: dto.renewalPeriodMonths,
        }),
      })
      .where(
        and(
          eq(scholarships.id, scholarshipId),
          eq(scholarships.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP,
      entityId: scholarshipId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated scholarship "${dto.name ?? existing.name}"`,
    });

    return this.getScholarshipById(institutionId, scholarshipId);
  }

  async updateScholarshipStatus(
    institutionId: string,
    scholarshipId: string,
    session: AuthenticatedSession,
    dto: UpdateScholarshipStatusDto,
  ) {
    await this.findScholarship(institutionId, scholarshipId);

    await this.db
      .update(scholarships)
      .set({ status: dto.status })
      .where(
        and(
          eq(scholarships.id, scholarshipId),
          eq(scholarships.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP,
      entityId: scholarshipId,
      summary: `Updated scholarship status to "${dto.status}"`,
    });

    return this.getScholarshipById(institutionId, scholarshipId);
  }

  // ── Application workflow ───────────────────────────────────────────────

  async listApplications(
    institutionId: string,
    query: ListApplicationsQueryDto,
  ) {
    const { q, scholarshipId, status, dbtStatus, page, limit, sort, order } =
      query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = applicationSortColumns[sort ?? "createdAt"];

    const appliedByMember = this.db
      .select({
        id: member.id,
        userName: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("applied_by_member");

    const reviewedByMember = this.db
      .select({
        id: member.id,
        userName: user.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("reviewed_by_member");

    const conditions = [
      eq(scholarshipApplications.institutionId, institutionId),
    ];
    if (q) {
      conditions.push(
        or(
          ilike(students.firstName, `%${q}%`),
          ilike(students.admissionNumber, `%${q}%`),
          ilike(scholarships.name, `%${q}%`),
        )!,
      );
    }
    if (scholarshipId) {
      conditions.push(eq(scholarshipApplications.scholarshipId, scholarshipId));
    }
    if (status) {
      conditions.push(eq(scholarshipApplications.status, status));
    }
    if (dbtStatus) {
      conditions.push(eq(scholarshipApplications.dbtStatus, dbtStatus));
    }

    const where = and(...conditions)!;

    const baseQuery = this.db
      .select({ count: count() })
      .from(scholarshipApplications)
      .innerJoin(students, eq(scholarshipApplications.studentId, students.id))
      .innerJoin(
        scholarships,
        eq(scholarshipApplications.scholarshipId, scholarships.id),
      )
      .where(where);

    const [totalResult] = await baseQuery;
    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: scholarshipApplications.id,
        institutionId: scholarshipApplications.institutionId,
        scholarshipId: scholarshipApplications.scholarshipId,
        scholarshipName: scholarships.name,
        studentId: scholarshipApplications.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentAdmissionNumber: students.admissionNumber,
        appliedByMemberName: appliedByMember.userName,
        status: scholarshipApplications.status,
        reviewedByMemberName: reviewedByMember.userName,
        reviewedAt: scholarshipApplications.reviewedAt,
        reviewNotes: scholarshipApplications.reviewNotes,
        dbtStatus: scholarshipApplications.dbtStatus,
        dbtTransactionId: scholarshipApplications.dbtTransactionId,
        dbtDisbursedAt: scholarshipApplications.dbtDisbursedAt,
        feeAdjustmentId: scholarshipApplications.feeAdjustmentId,
        concessionAmountInPaise:
          scholarshipApplications.concessionAmountInPaise,
        expiresAt: scholarshipApplications.expiresAt,
        renewedFromApplicationId:
          scholarshipApplications.renewedFromApplicationId,
        createdAt: scholarshipApplications.createdAt,
      })
      .from(scholarshipApplications)
      .innerJoin(students, eq(scholarshipApplications.studentId, students.id))
      .innerJoin(
        scholarships,
        eq(scholarshipApplications.scholarshipId, scholarships.id),
      )
      .leftJoin(
        appliedByMember,
        eq(scholarshipApplications.appliedByMemberId, appliedByMember.id),
      )
      .leftJoin(
        reviewedByMember,
        eq(scholarshipApplications.reviewedByMemberId, reviewedByMember.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map((r) => this.mapApplicationRow(r)),
      total,
      page: safePage,
      pageSize,
      pageCount,
    };
  }

  async createApplication(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateApplicationDto,
  ) {
    // Validate scholarship is active
    const scholarship = await this.findScholarship(
      institutionId,
      dto.scholarshipId,
    );
    if (scholarship.status !== SCHOLARSHIP_STATUS.ACTIVE) {
      throw new ConflictException(
        ERROR_MESSAGES.SCHOLARSHIPS.SCHOLARSHIP_INACTIVE,
      );
    }

    // Check max recipients
    if (scholarship.maxRecipients) {
      const [activeCount] = await this.db
        .select({ count: count() })
        .from(scholarshipApplications)
        .where(
          and(
            eq(scholarshipApplications.scholarshipId, dto.scholarshipId),
            eq(
              scholarshipApplications.status,
              SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
            ),
          ),
        );
      if ((activeCount?.count ?? 0) >= scholarship.maxRecipients) {
        throw new ConflictException(
          ERROR_MESSAGES.SCHOLARSHIPS.MAX_RECIPIENTS_REACHED,
        );
      }
    }

    // Check duplicate (student not already applied with active/pending status)
    const [existing] = await this.db
      .select({ id: scholarshipApplications.id })
      .from(scholarshipApplications)
      .where(
        and(
          eq(scholarshipApplications.scholarshipId, dto.scholarshipId),
          eq(scholarshipApplications.studentId, dto.studentId),
          or(
            eq(
              scholarshipApplications.status,
              SCHOLARSHIP_APPLICATION_STATUS.PENDING,
            ),
            eq(
              scholarshipApplications.status,
              SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
            ),
          ),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(
        ERROR_MESSAGES.SCHOLARSHIPS.STUDENT_ALREADY_APPLIED,
      );
    }

    // Resolve the active membership for the current user to use as appliedByMemberId
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      )
      .limit(1);

    const appliedByMemberId = memberRecord?.id ?? session.user.id;

    const id = randomUUID();
    const expiresAt =
      scholarship.renewalRequired && scholarship.renewalPeriodMonths
        ? new Date(
            Date.now() +
              scholarship.renewalPeriodMonths * 30 * 24 * 60 * 60 * 1000,
          )
        : null;

    await this.db.insert(scholarshipApplications).values({
      id,
      institutionId,
      scholarshipId: dto.scholarshipId,
      studentId: dto.studentId,
      appliedByMemberId,
      status: SCHOLARSHIP_APPLICATION_STATUS.PENDING,
      expiresAt,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP_APPLICATION,
      entityId: id,
      summary: `Created scholarship application for student ${dto.studentId}`,
      metadata: {
        scholarshipId: dto.scholarshipId,
        studentId: dto.studentId,
      },
    });

    return this.getApplicationById(institutionId, id);
  }

  async approveApplication(
    institutionId: string,
    applicationId: string,
    session: AuthenticatedSession,
    dto: ReviewApplicationDto,
  ) {
    const application = await this.findApplication(
      institutionId,
      applicationId,
    );
    if (application.status !== SCHOLARSHIP_APPLICATION_STATUS.PENDING) {
      throw new ConflictException(
        ERROR_MESSAGES.SCHOLARSHIPS.APPLICATION_NOT_PENDING,
      );
    }

    // Find scholarship for concession amount calculation
    const scholarship = await this.findScholarship(
      institutionId,
      application.scholarshipId,
    );

    // Resolve reviewer membership
    const [reviewerMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      )
      .limit(1);

    const reviewedByMemberId = reviewerMember?.id ?? null;

    // Calculate concession amount — try to auto-create fee adjustment
    let feeAdjustmentId: string | null = null;
    let concessionAmountInPaise: number | null = null;

    if (scholarship.amountInPaise) {
      concessionAmountInPaise = scholarship.amountInPaise;
    }

    // If there's a concession amount, try to find and adjust the student's fee assignment
    if (concessionAmountInPaise) {
      const [activeAssignment] = await this.db
        .select({
          id: feeAssignments.id,
          institutionId: feeAssignments.institutionId,
        })
        .from(feeAssignments)
        .where(
          and(
            eq(feeAssignments.institutionId, institutionId),
            eq(feeAssignments.studentId, application.studentId),
          ),
        )
        .limit(1);

      if (activeAssignment) {
        const adjustmentId = randomUUID();
        await this.db.insert(feeAssignmentAdjustments).values({
          id: adjustmentId,
          institutionId,
          feeAssignmentId: activeAssignment.id,
          adjustmentType: FEE_ADJUSTMENT_TYPES.WAIVER,
          amountInPaise: concessionAmountInPaise,
          reason: `Scholarship: ${scholarship.name}`,
        });
        feeAdjustmentId = adjustmentId;
      }
    }

    await this.db
      .update(scholarshipApplications)
      .set({
        status: SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
        reviewedByMemberId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes ?? null,
        feeAdjustmentId,
        concessionAmountInPaise,
      })
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP_APPLICATION,
      entityId: applicationId,
      summary: `Approved scholarship application`,
      metadata: {
        status: SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
        concessionAmountInPaise,
      },
    });

    return this.getApplicationById(institutionId, applicationId);
  }

  async rejectApplication(
    institutionId: string,
    applicationId: string,
    session: AuthenticatedSession,
    dto: ReviewApplicationDto,
  ) {
    const application = await this.findApplication(
      institutionId,
      applicationId,
    );
    if (application.status !== SCHOLARSHIP_APPLICATION_STATUS.PENDING) {
      throw new ConflictException(
        ERROR_MESSAGES.SCHOLARSHIPS.APPLICATION_NOT_PENDING,
      );
    }

    const [reviewerMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      )
      .limit(1);

    await this.db
      .update(scholarshipApplications)
      .set({
        status: SCHOLARSHIP_APPLICATION_STATUS.REJECTED,
        reviewedByMemberId: reviewerMember?.id ?? null,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes ?? null,
      })
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP_APPLICATION,
      entityId: applicationId,
      summary: `Rejected scholarship application`,
      metadata: { status: SCHOLARSHIP_APPLICATION_STATUS.REJECTED },
    });

    return this.getApplicationById(institutionId, applicationId);
  }

  async getApplication(institutionId: string, applicationId: string) {
    return this.getApplicationById(institutionId, applicationId);
  }

  // ── DBT tracking ──────────────────────────────────────────────────────

  async updateDbtStatus(
    institutionId: string,
    applicationId: string,
    session: AuthenticatedSession,
    dto: UpdateDbtStatusDto,
  ) {
    await this.findApplication(institutionId, applicationId);

    const updateData: Record<string, unknown> = {
      dbtStatus: dto.dbtStatus,
    };
    if (dto.dbtTransactionId !== undefined) {
      updateData.dbtTransactionId = dto.dbtTransactionId;
    }
    if (dto.dbtStatus === "disbursed") {
      updateData.dbtDisbursedAt = new Date();
    }

    await this.db
      .update(scholarshipApplications)
      .set(updateData)
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP_APPLICATION,
      entityId: applicationId,
      summary: `Updated DBT status to "${dto.dbtStatus}"`,
      metadata: { dbtStatus: dto.dbtStatus },
    });

    return this.getApplicationById(institutionId, applicationId);
  }

  // ── Renewal ────────────────────────────────────────────────────────────

  async renewApplication(
    institutionId: string,
    applicationId: string,
    session: AuthenticatedSession,
  ) {
    const existing = await this.findApplication(institutionId, applicationId);
    const scholarship = await this.findScholarship(
      institutionId,
      existing.scholarshipId,
    );

    // Mark old application as expired
    await this.db
      .update(scholarshipApplications)
      .set({ status: SCHOLARSHIP_APPLICATION_STATUS.EXPIRED })
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      );

    // Create new application linked to the old one
    const newId = randomUUID();
    const expiresAt =
      scholarship.renewalRequired && scholarship.renewalPeriodMonths
        ? new Date(
            Date.now() +
              scholarship.renewalPeriodMonths * 30 * 24 * 60 * 60 * 1000,
          )
        : null;

    // Resolve membership
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      )
      .limit(1);

    await this.db.insert(scholarshipApplications).values({
      id: newId,
      institutionId,
      scholarshipId: existing.scholarshipId,
      studentId: existing.studentId,
      appliedByMemberId: memberRecord?.id ?? session.user.id,
      status: SCHOLARSHIP_APPLICATION_STATUS.PENDING,
      renewedFromApplicationId: applicationId,
      expiresAt,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.SCHOLARSHIP_APPLICATION,
      entityId: newId,
      summary: `Renewed scholarship application from ${applicationId}`,
      metadata: {
        renewedFromApplicationId: applicationId,
        scholarshipId: existing.scholarshipId,
      },
    });

    return this.getApplicationById(institutionId, newId);
  }

  async listExpiringApplications(
    institutionId: string,
    query: ListExpiringApplicationsQueryDto,
  ) {
    const { daysUntilExpiry, page, limit } = query;
    const pageSize = resolveTablePageSize(limit);
    const expiryThreshold = new Date(
      Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000,
    );

    const conditions = [
      eq(scholarshipApplications.institutionId, institutionId),
      eq(
        scholarshipApplications.status,
        SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
      ),
      lte(scholarshipApplications.expiresAt, expiryThreshold),
    ];

    const where = and(...conditions)!;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(scholarshipApplications)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const appliedByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("applied_by_member");

    const reviewedByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("reviewed_by_member");

    const rows = await this.db
      .select({
        id: scholarshipApplications.id,
        institutionId: scholarshipApplications.institutionId,
        scholarshipId: scholarshipApplications.scholarshipId,
        scholarshipName: scholarships.name,
        studentId: scholarshipApplications.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentAdmissionNumber: students.admissionNumber,
        appliedByMemberName: appliedByMember.userName,
        status: scholarshipApplications.status,
        reviewedByMemberName: reviewedByMember.userName,
        reviewedAt: scholarshipApplications.reviewedAt,
        reviewNotes: scholarshipApplications.reviewNotes,
        dbtStatus: scholarshipApplications.dbtStatus,
        dbtTransactionId: scholarshipApplications.dbtTransactionId,
        dbtDisbursedAt: scholarshipApplications.dbtDisbursedAt,
        feeAdjustmentId: scholarshipApplications.feeAdjustmentId,
        concessionAmountInPaise:
          scholarshipApplications.concessionAmountInPaise,
        expiresAt: scholarshipApplications.expiresAt,
        renewedFromApplicationId:
          scholarshipApplications.renewedFromApplicationId,
        createdAt: scholarshipApplications.createdAt,
      })
      .from(scholarshipApplications)
      .innerJoin(students, eq(scholarshipApplications.studentId, students.id))
      .innerJoin(
        scholarships,
        eq(scholarshipApplications.scholarshipId, scholarships.id),
      )
      .leftJoin(
        appliedByMember,
        eq(scholarshipApplications.appliedByMemberId, appliedByMember.id),
      )
      .leftJoin(
        reviewedByMember,
        eq(scholarshipApplications.reviewedByMemberId, reviewedByMember.id),
      )
      .where(where)
      .orderBy(asc(scholarshipApplications.expiresAt))
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map((r) => this.mapApplicationRow(r)),
      total,
      page: safePage,
      pageSize,
      pageCount,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async findScholarship(institutionId: string, scholarshipId: string) {
    const [row] = await this.db
      .select()
      .from(scholarships)
      .where(
        and(
          eq(scholarships.id, scholarshipId),
          eq(scholarships.institutionId, institutionId),
          ne(scholarships.status, SCHOLARSHIP_STATUS.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.SCHOLARSHIPS.NOT_FOUND);
    }
    return row;
  }

  private async findApplication(institutionId: string, applicationId: string) {
    const [row] = await this.db
      .select()
      .from(scholarshipApplications)
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.SCHOLARSHIPS.APPLICATION_NOT_FOUND,
      );
    }
    return row;
  }

  private async getScholarshipById(
    institutionId: string,
    scholarshipId: string,
  ) {
    const [row] = await this.db
      .select({
        id: scholarships.id,
        institutionId: scholarships.institutionId,
        name: scholarships.name,
        description: scholarships.description,
        scholarshipType: scholarships.scholarshipType,
        amountInPaise: scholarships.amountInPaise,
        percentageDiscount: scholarships.percentageDiscount,
        eligibilityCriteria: scholarships.eligibilityCriteria,
        maxRecipients: scholarships.maxRecipients,
        academicYearId: scholarships.academicYearId,
        academicYearName: academicYears.name,
        renewalRequired: scholarships.renewalRequired,
        renewalPeriodMonths: scholarships.renewalPeriodMonths,
        status: scholarships.status,
        activeApplicationCount: sql<number>`(
          SELECT COUNT(*)::int FROM scholarship_applications sa
          WHERE sa.scholarship_id = ${scholarships.id}
          AND sa.status IN ('pending', 'approved')
        )`,
        createdAt: scholarships.createdAt,
      })
      .from(scholarships)
      .leftJoin(
        academicYears,
        eq(scholarships.academicYearId, academicYears.id),
      )
      .where(
        and(
          eq(scholarships.id, scholarshipId),
          eq(scholarships.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.SCHOLARSHIPS.NOT_FOUND);
    }

    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async getApplicationById(
    institutionId: string,
    applicationId: string,
  ) {
    const appliedByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("applied_by_member");

    const reviewedByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("reviewed_by_member");

    const [row] = await this.db
      .select({
        id: scholarshipApplications.id,
        institutionId: scholarshipApplications.institutionId,
        scholarshipId: scholarshipApplications.scholarshipId,
        scholarshipName: scholarships.name,
        studentId: scholarshipApplications.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentAdmissionNumber: students.admissionNumber,
        appliedByMemberName: appliedByMember.userName,
        status: scholarshipApplications.status,
        reviewedByMemberName: reviewedByMember.userName,
        reviewedAt: scholarshipApplications.reviewedAt,
        reviewNotes: scholarshipApplications.reviewNotes,
        dbtStatus: scholarshipApplications.dbtStatus,
        dbtTransactionId: scholarshipApplications.dbtTransactionId,
        dbtDisbursedAt: scholarshipApplications.dbtDisbursedAt,
        feeAdjustmentId: scholarshipApplications.feeAdjustmentId,
        concessionAmountInPaise:
          scholarshipApplications.concessionAmountInPaise,
        expiresAt: scholarshipApplications.expiresAt,
        renewedFromApplicationId:
          scholarshipApplications.renewedFromApplicationId,
        createdAt: scholarshipApplications.createdAt,
      })
      .from(scholarshipApplications)
      .innerJoin(students, eq(scholarshipApplications.studentId, students.id))
      .innerJoin(
        scholarships,
        eq(scholarshipApplications.scholarshipId, scholarships.id),
      )
      .leftJoin(
        appliedByMember,
        eq(scholarshipApplications.appliedByMemberId, appliedByMember.id),
      )
      .leftJoin(
        reviewedByMember,
        eq(scholarshipApplications.reviewedByMemberId, reviewedByMember.id),
      )
      .where(
        and(
          eq(scholarshipApplications.id, applicationId),
          eq(scholarshipApplications.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.SCHOLARSHIPS.APPLICATION_NOT_FOUND,
      );
    }

    return this.mapApplicationRow(row);
  }

  private mapApplicationRow(r: {
    id: string;
    institutionId: string;
    scholarshipId: string;
    scholarshipName: string;
    studentId: string;
    studentFirstName: string;
    studentLastName: string | null;
    studentAdmissionNumber: string;
    appliedByMemberName: string | null;
    status: string;
    reviewedByMemberName: string | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    dbtStatus: string;
    dbtTransactionId: string | null;
    dbtDisbursedAt: Date | null;
    feeAdjustmentId: string | null;
    concessionAmountInPaise: number | null;
    expiresAt: Date | null;
    renewedFromApplicationId: string | null;
    createdAt: Date;
  }) {
    return {
      id: r.id,
      institutionId: r.institutionId,
      scholarshipId: r.scholarshipId,
      scholarshipName: r.scholarshipName,
      studentId: r.studentId,
      studentName: [r.studentFirstName, r.studentLastName]
        .filter(Boolean)
        .join(" "),
      studentAdmissionNumber: r.studentAdmissionNumber,
      appliedByMemberName: r.appliedByMemberName ?? "Unknown",
      status: r.status,
      reviewedByMemberName: r.reviewedByMemberName,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      reviewNotes: r.reviewNotes,
      dbtStatus: r.dbtStatus,
      dbtTransactionId: r.dbtTransactionId,
      dbtDisbursedAt: r.dbtDisbursedAt?.toISOString() ?? null,
      feeAdjustmentId: r.feeAdjustmentId,
      concessionAmountInPaise: r.concessionAmountInPaise,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      renewedFromApplicationId: r.renewedFromApplicationId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
