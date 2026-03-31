import { DATABASE } from "@repo/backend-core";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_APPLICATION_STATUSES_EXTENDED,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  type AdmissionFormFieldType,
  type AdmissionFormFieldScope,
} from "@repo/contracts";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  admissionApplicationDocuments,
  admissionApplications,
  admissionDocumentChecklists,
  admissionEnquiries,
  and,
  asc,
  campus,
  campusMemberships,
  classSections,
  count,
  desc,
  eq,
  ilike,
  isNull,
  member,
  ne,
  or,
  schoolClasses,
  students,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
} from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import { campusScopeFilter } from "../auth/scope-filter";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  ConvertToStudentDto,
  CreateAdmissionApplicationDto,
  CreateAdmissionEnquiryDto,
  CreateDocumentChecklistItemDto,
  ListAdmissionApplicationsQueryDto,
  ListAdmissionEnquiriesQueryDto,
  RecordRegistrationFeeDto,
  UpdateAdmissionApplicationDto,
  UpdateAdmissionEnquiryDto,
  UpdateDocumentChecklistItemDto,
  UpsertApplicationDocumentDto,
  VerifyRejectApplicationDocumentDto,
  WaitlistApplicationDto,
} from "./admissions.schemas";
import {
  sortableAdmissionApplicationColumns,
  sortableAdmissionEnquiryColumns,
} from "./admissions.schemas";
import { AdmissionFormFieldsService } from "./admission-form-fields.service";
import { NotificationFactory } from "../communications/notification.factory";
import { AuditService } from "../audit/audit.service";

const sortableEnquiryColumns = {
  campus: campus.name,
  createdAt: admissionEnquiries.createdAt,
  status: admissionEnquiries.status,
  studentName: admissionEnquiries.studentName,
} as const;

const sortableApplicationColumns = {
  campus: campus.name,
  createdAt: admissionApplications.createdAt,
  status: admissionApplications.status,
  studentName: admissionApplications.studentFirstName,
} as const;

@Injectable()
export class AdmissionsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly admissionFormFieldsService: AdmissionFormFieldsService,
    private readonly notificationFactory: NotificationFactory,
    private readonly auditService: AuditService,
  ) {}

  async listAdmissionFormFields(
    institutionId: string,
    scope?: AdmissionFormFieldScope,
  ) {
    const rows = await this.admissionFormFieldsService.listFields(
      institutionId,
      scope,
    );

    return { rows };
  }

  async createAdmissionFormField(
    institutionId: string,
    payload: {
      key: string;
      label: string;
      scope: AdmissionFormFieldScope;
      fieldType: AdmissionFormFieldType;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      active: boolean;
      options?: Array<{ label: string; value: string }>;
      sortOrder: number;
    },
  ) {
    return this.admissionFormFieldsService.createField(institutionId, payload);
  }

  async updateAdmissionFormField(
    institutionId: string,
    fieldId: string,
    payload: {
      key: string;
      label: string;
      scope: AdmissionFormFieldScope;
      fieldType: AdmissionFormFieldType;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      active: boolean;
      options?: Array<{ label: string; value: string }>;
      sortOrder: number;
    },
  ) {
    return this.admissionFormFieldsService.updateField(
      institutionId,
      fieldId,
      payload,
    );
  }

  async listAdmissionEnquiries(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListAdmissionEnquiriesQueryDto = {},
  ): Promise<
    PaginatedResult<Awaited<ReturnType<typeof this.getAdmissionEnquiry>>>
  > {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, scopedCampusId, scopes);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableAdmissionEnquiryColumns.createdAt;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;
    const conditions: SQL[] = [
      eq(admissionEnquiries.institutionId, institutionId),
      isNull(admissionEnquiries.deletedAt),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    conditions.push(eq(admissionEnquiries.campusId, scopedCampusId));

    if (query.search) {
      conditions.push(
        or(
          ilike(admissionEnquiries.studentName, `%${query.search}%`),
          ilike(admissionEnquiries.guardianName, `%${query.search}%`),
          ilike(admissionEnquiries.mobile, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(admissionEnquiries)
      .innerJoin(campus, eq(admissionEnquiries.campusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: admissionEnquiries.id,
        institutionId: admissionEnquiries.institutionId,
        campusId: admissionEnquiries.campusId,
        campusName: campus.name,
        studentName: admissionEnquiries.studentName,
        guardianName: admissionEnquiries.guardianName,
        mobile: admissionEnquiries.mobile,
        email: admissionEnquiries.email,
        source: admissionEnquiries.source,
        status: admissionEnquiries.status,
        notes: admissionEnquiries.notes,
        createdAt: admissionEnquiries.createdAt,
      })
      .from(admissionEnquiries)
      .innerJoin(campus, eq(admissionEnquiries.campusId, campus.id))
      .where(where)
      .orderBy(
        sortDirection(sortableEnquiryColumns[sortKey]),
        desc(admissionEnquiries.createdAt),
      )
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

  async getAdmissionEnquiry(
    institutionId: string,
    enquiryId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const [row] = await this.db
      .select({
        id: admissionEnquiries.id,
        institutionId: admissionEnquiries.institutionId,
        campusId: admissionEnquiries.campusId,
        campusName: campus.name,
        studentName: admissionEnquiries.studentName,
        guardianName: admissionEnquiries.guardianName,
        mobile: admissionEnquiries.mobile,
        email: admissionEnquiries.email,
        source: admissionEnquiries.source,
        status: admissionEnquiries.status,
        notes: admissionEnquiries.notes,
        createdAt: admissionEnquiries.createdAt,
      })
      .from(admissionEnquiries)
      .innerJoin(campus, eq(admissionEnquiries.campusId, campus.id))
      .where(
        and(
          eq(admissionEnquiries.id, enquiryId),
          eq(admissionEnquiries.institutionId, institutionId),
          isNull(admissionEnquiries.deletedAt),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          campusScopeFilter(admissionEnquiries.campusId, scopes),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.ADMISSIONS.ENQUIRY_NOT_FOUND);
    }

    return row;
  }

  async createAdmissionEnquiry(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateAdmissionEnquiryDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, campusId, scopes);

    const enquiryId = randomUUID();
    await this.db.insert(admissionEnquiries).values({
      id: enquiryId,
      institutionId,
      campusId,
      studentName: payload.studentName.trim(),
      guardianName: payload.guardianName.trim(),
      mobile: payload.mobile.trim(),
      email: this.normalizeOptional(payload.email),
      source: this.normalizeOptional(payload.source),
      status: payload.status,
      notes: this.normalizeOptional(payload.notes),
      deletedAt: null,
    });

    const enquiry = await this.getAdmissionEnquiry(
      institutionId,
      enquiryId,
      authSession,
      scopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_ENQUIRY,
        entityId: enquiryId,
        entityLabel: payload.studentName,
        summary: `Created admission enquiry for ${payload.studentName}.`,
      })
      .catch(() => {});

    return enquiry;
  }

  async updateAdmissionEnquiry(
    institutionId: string,
    enquiryId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateAdmissionEnquiryDto,
  ) {
    await this.getAdmissionEnquiry(
      institutionId,
      enquiryId,
      authSession,
      scopes,
    );
    const campusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, campusId, scopes);

    await this.db
      .update(admissionEnquiries)
      .set({
        campusId,
        studentName: payload.studentName.trim(),
        guardianName: payload.guardianName.trim(),
        mobile: payload.mobile.trim(),
        email: this.normalizeOptional(payload.email),
        source: this.normalizeOptional(payload.source),
        status: payload.status,
        notes: this.normalizeOptional(payload.notes),
      })
      .where(eq(admissionEnquiries.id, enquiryId));

    const updatedEnquiry = await this.getAdmissionEnquiry(
      institutionId,
      enquiryId,
      authSession,
      scopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_ENQUIRY,
        entityId: enquiryId,
        entityLabel: payload.studentName,
        summary: `Updated admission enquiry for ${payload.studentName}.`,
      })
      .catch(() => {});

    return updatedEnquiry;
  }

  async listAdmissionApplications(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListAdmissionApplicationsQueryDto = {},
  ): Promise<
    PaginatedResult<Awaited<ReturnType<typeof this.getAdmissionApplication>>>
  > {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, scopedCampusId, scopes);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableAdmissionApplicationColumns.createdAt;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;
    const conditions: SQL[] = [
      eq(admissionApplications.institutionId, institutionId),
      isNull(admissionApplications.deletedAt),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    conditions.push(eq(admissionApplications.campusId, scopedCampusId));

    if (query.search) {
      conditions.push(
        or(
          ilike(admissionApplications.studentFirstName, `%${query.search}%`),
          ilike(admissionApplications.studentLastName, `%${query.search}%`),
          ilike(admissionApplications.guardianName, `%${query.search}%`),
          ilike(admissionApplications.mobile, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(admissionApplications)
      .innerJoin(campus, eq(admissionApplications.campusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: admissionApplications.id,
        institutionId: admissionApplications.institutionId,
        enquiryId: admissionApplications.enquiryId,
        campusId: admissionApplications.campusId,
        campusName: campus.name,
        studentFirstName: admissionApplications.studentFirstName,
        studentLastName: admissionApplications.studentLastName,
        guardianName: admissionApplications.guardianName,
        mobile: admissionApplications.mobile,
        email: admissionApplications.email,
        desiredClassName: admissionApplications.desiredClassName,
        desiredSectionName: admissionApplications.desiredSectionName,
        status: admissionApplications.status,
        notes: admissionApplications.notes,
        customFieldValues: admissionApplications.customFieldValues,
        createdAt: admissionApplications.createdAt,
      })
      .from(admissionApplications)
      .innerJoin(campus, eq(admissionApplications.campusId, campus.id))
      .where(where)
      .orderBy(
        sortDirection(sortableApplicationColumns[sortKey]),
        desc(admissionApplications.createdAt),
      )
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

  async getAdmissionApplication(
    institutionId: string,
    applicationId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const [row] = await this.db
      .select({
        id: admissionApplications.id,
        institutionId: admissionApplications.institutionId,
        enquiryId: admissionApplications.enquiryId,
        campusId: admissionApplications.campusId,
        campusName: campus.name,
        studentFirstName: admissionApplications.studentFirstName,
        studentLastName: admissionApplications.studentLastName,
        guardianName: admissionApplications.guardianName,
        mobile: admissionApplications.mobile,
        email: admissionApplications.email,
        desiredClassName: admissionApplications.desiredClassName,
        desiredSectionName: admissionApplications.desiredSectionName,
        status: admissionApplications.status,
        notes: admissionApplications.notes,
        customFieldValues: admissionApplications.customFieldValues,
        createdAt: admissionApplications.createdAt,
      })
      .from(admissionApplications)
      .innerJoin(campus, eq(admissionApplications.campusId, campus.id))
      .where(
        and(
          eq(admissionApplications.id, applicationId),
          eq(admissionApplications.institutionId, institutionId),
          isNull(admissionApplications.deletedAt),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          campusScopeFilter(admissionApplications.campusId, scopes),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.ADMISSIONS.APPLICATION_NOT_FOUND,
      );
    }

    return row;
  }

  async createAdmissionApplication(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateAdmissionApplicationDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, campusId, scopes);

    if (payload.enquiryId) {
      await this.assertEnquiryExists(institutionId, payload.enquiryId, scopes);
    }

    const customFieldValues =
      await this.admissionFormFieldsService.validateValues(
        institutionId,
        ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
        payload.customFieldValues ?? undefined,
      );

    const applicationId = randomUUID();
    await this.db.insert(admissionApplications).values({
      id: applicationId,
      institutionId,
      enquiryId: payload.enquiryId ?? null,
      campusId,
      studentFirstName: payload.studentFirstName.trim(),
      studentLastName: this.normalizeOptional(payload.studentLastName),
      guardianName: payload.guardianName.trim(),
      mobile: payload.mobile.trim(),
      email: this.normalizeOptional(payload.email),
      desiredClassName: this.normalizeOptional(payload.desiredClassName),
      desiredSectionName: this.normalizeOptional(payload.desiredSectionName),
      status: payload.status,
      notes: this.normalizeOptional(payload.notes),
      customFieldValues,
      deletedAt: null,
    });

    const studentName =
      `${payload.studentFirstName.trim()} ${payload.studentLastName?.trim() ?? ""}`.trim();

    this.notificationFactory
      .notify({
        institutionId,
        campusId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.ADMISSION_APPLICATION_RECEIVED,
        channel: NOTIFICATION_CHANNELS.OPERATIONS,
        tone: NOTIFICATION_TONES.INFO,
        audience: "staff",
        title: "New admission application",
        message: `New application received for ${studentName}.`,
        senderLabel: authSession.user.name,
      })
      .catch(() => {});

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
        entityId: applicationId,
        entityLabel: studentName,
        summary: `Created admission application for ${studentName}.`,
      })
      .catch(() => {});

    return this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );
  }

  async updateAdmissionApplication(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateAdmissionApplicationDto,
  ) {
    await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );
    const campusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, campusId, scopes);

    if (payload.enquiryId) {
      await this.assertEnquiryExists(institutionId, payload.enquiryId, scopes);
    }

    const customFieldValues =
      await this.admissionFormFieldsService.validateValues(
        institutionId,
        ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
        payload.customFieldValues ?? undefined,
      );

    await this.db
      .update(admissionApplications)
      .set({
        enquiryId: payload.enquiryId ?? null,
        campusId,
        studentFirstName: payload.studentFirstName.trim(),
        studentLastName: this.normalizeOptional(payload.studentLastName),
        guardianName: payload.guardianName.trim(),
        mobile: payload.mobile.trim(),
        email: this.normalizeOptional(payload.email),
        desiredClassName: this.normalizeOptional(payload.desiredClassName),
        desiredSectionName: this.normalizeOptional(payload.desiredSectionName),
        status: payload.status,
        notes: this.normalizeOptional(payload.notes),
        customFieldValues,
      })
      .where(eq(admissionApplications.id, applicationId));

    const updatedStudentName =
      `${payload.studentFirstName.trim()} ${payload.studentLastName?.trim() ?? ""}`.trim();

    this.notificationFactory
      .notify({
        institutionId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.ADMISSION_STATUS_CHANGED,
        channel: NOTIFICATION_CHANNELS.OPERATIONS,
        tone: NOTIFICATION_TONES.INFO,
        audience: "staff",
        title: "Admission status updated",
        message: `Application for ${updatedStudentName} updated to ${payload.status}.`,
        senderLabel: authSession.user.name,
      })
      .catch(() => {});

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
        entityId: applicationId,
        entityLabel: updatedStudentName,
        summary: `Updated admission application for ${updatedStudentName} to ${payload.status}.`,
      })
      .catch(() => {});

    return this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );
  }

  // ── Document checklist ───────────────────────────────────────────────────

  async listDocumentChecklist(institutionId: string) {
    const rows = await this.db
      .select({
        id: admissionDocumentChecklists.id,
        institutionId: admissionDocumentChecklists.institutionId,
        documentName: admissionDocumentChecklists.documentName,
        isRequired: admissionDocumentChecklists.isRequired,
        sortOrder: admissionDocumentChecklists.sortOrder,
        isActive: admissionDocumentChecklists.isActive,
        createdAt: admissionDocumentChecklists.createdAt,
        updatedAt: admissionDocumentChecklists.updatedAt,
      })
      .from(admissionDocumentChecklists)
      .where(eq(admissionDocumentChecklists.institutionId, institutionId))
      .orderBy(asc(admissionDocumentChecklists.sortOrder));

    return { rows };
  }

  async createDocumentChecklistItem(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateDocumentChecklistItemDto,
  ) {
    const itemId = randomUUID();
    await this.db.insert(admissionDocumentChecklists).values({
      id: itemId,
      institutionId,
      documentName: payload.documentName.trim(),
      isRequired: payload.isRequired,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_DOCUMENT,
        entityId: itemId,
        entityLabel: payload.documentName,
        summary: `Created document checklist item "${payload.documentName}".`,
      })
      .catch(() => {});

    return this.getDocumentChecklistItem(institutionId, itemId);
  }

  async updateDocumentChecklistItem(
    institutionId: string,
    itemId: string,
    authSession: AuthenticatedSession,
    payload: UpdateDocumentChecklistItemDto,
  ) {
    await this.getDocumentChecklistItem(institutionId, itemId);

    await this.db
      .update(admissionDocumentChecklists)
      .set({
        documentName: payload.documentName.trim(),
        isRequired: payload.isRequired,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,
      })
      .where(eq(admissionDocumentChecklists.id, itemId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_DOCUMENT,
        entityId: itemId,
        entityLabel: payload.documentName,
        summary: `Updated document checklist item "${payload.documentName}".`,
      })
      .catch(() => {});

    return this.getDocumentChecklistItem(institutionId, itemId);
  }

  private async getDocumentChecklistItem(
    institutionId: string,
    itemId: string,
  ) {
    const [row] = await this.db
      .select({
        id: admissionDocumentChecklists.id,
        institutionId: admissionDocumentChecklists.institutionId,
        documentName: admissionDocumentChecklists.documentName,
        isRequired: admissionDocumentChecklists.isRequired,
        sortOrder: admissionDocumentChecklists.sortOrder,
        isActive: admissionDocumentChecklists.isActive,
        createdAt: admissionDocumentChecklists.createdAt,
        updatedAt: admissionDocumentChecklists.updatedAt,
      })
      .from(admissionDocumentChecklists)
      .where(
        and(
          eq(admissionDocumentChecklists.id, itemId),
          eq(admissionDocumentChecklists.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.CHECKLIST_ITEM_NOT_FOUND,
      );
    }

    return row;
  }

  // ── Application documents ─────────────────────────────────────────────────

  async listApplicationDocuments(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );

    const rows = await this.db
      .select({
        id: admissionApplicationDocuments.id,
        institutionId: admissionApplicationDocuments.institutionId,
        applicationId: admissionApplicationDocuments.applicationId,
        checklistItemId: admissionApplicationDocuments.checklistItemId,
        status: admissionApplicationDocuments.status,
        uploadUrl: admissionApplicationDocuments.uploadUrl,
        verifiedByMemberId: admissionApplicationDocuments.verifiedByMemberId,
        verifiedAt: admissionApplicationDocuments.verifiedAt,
        notes: admissionApplicationDocuments.notes,
        createdAt: admissionApplicationDocuments.createdAt,
        updatedAt: admissionApplicationDocuments.updatedAt,
      })
      .from(admissionApplicationDocuments)
      .where(
        and(
          eq(admissionApplicationDocuments.institutionId, institutionId),
          eq(admissionApplicationDocuments.applicationId, applicationId),
        ),
      )
      .orderBy(asc(admissionApplicationDocuments.createdAt));

    return { rows };
  }

  async upsertApplicationDocument(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpsertApplicationDocumentDto,
  ) {
    await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );
    await this.getDocumentChecklistItem(institutionId, payload.checklistItemId);

    const [existing] = await this.db
      .select({ id: admissionApplicationDocuments.id })
      .from(admissionApplicationDocuments)
      .where(
        and(
          eq(admissionApplicationDocuments.applicationId, applicationId),
          eq(
            admissionApplicationDocuments.checklistItemId,
            payload.checklistItemId,
          ),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(admissionApplicationDocuments)
        .set({
          status: payload.status,
          uploadUrl: this.normalizeOptional(payload.uploadUrl),
          notes: this.normalizeOptional(payload.notes),
        })
        .where(eq(admissionApplicationDocuments.id, existing.id));

      return this.getApplicationDocument(institutionId, existing.id);
    }

    const documentId = randomUUID();
    await this.db.insert(admissionApplicationDocuments).values({
      id: documentId,
      institutionId,
      applicationId,
      checklistItemId: payload.checklistItemId,
      status: payload.status,
      uploadUrl: this.normalizeOptional(payload.uploadUrl),
      notes: this.normalizeOptional(payload.notes),
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_DOCUMENT,
        entityId: documentId,
        entityLabel: applicationId,
        summary: `Added document to application ${applicationId}.`,
      })
      .catch(() => {});

    return this.getApplicationDocument(institutionId, documentId);
  }

  async verifyRejectApplicationDocument(
    institutionId: string,
    documentId: string,
    authSession: AuthenticatedSession,
    payload: VerifyRejectApplicationDocumentDto,
  ) {
    const doc = await this.getApplicationDocument(institutionId, documentId);
    if (!doc) {
      throw new NotFoundException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.APPLICATION_DOCUMENT_NOT_FOUND,
      );
    }

    const now = new Date();
    await this.db
      .update(admissionApplicationDocuments)
      .set({
        status: payload.status,
        verifiedByMemberId: null,
        verifiedAt: now,
        notes: this.normalizeOptional(payload.notes),
      })
      .where(eq(admissionApplicationDocuments.id, documentId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_DOCUMENT,
        entityId: documentId,
        entityLabel: doc.applicationId,
        summary: `Document ${payload.status} for application ${doc.applicationId}.`,
      })
      .catch(() => {});

    return this.getApplicationDocument(institutionId, documentId);
  }

  private async getApplicationDocument(
    institutionId: string,
    documentId: string,
  ) {
    const [row] = await this.db
      .select({
        id: admissionApplicationDocuments.id,
        institutionId: admissionApplicationDocuments.institutionId,
        applicationId: admissionApplicationDocuments.applicationId,
        checklistItemId: admissionApplicationDocuments.checklistItemId,
        status: admissionApplicationDocuments.status,
        uploadUrl: admissionApplicationDocuments.uploadUrl,
        verifiedByMemberId: admissionApplicationDocuments.verifiedByMemberId,
        verifiedAt: admissionApplicationDocuments.verifiedAt,
        notes: admissionApplicationDocuments.notes,
        createdAt: admissionApplicationDocuments.createdAt,
        updatedAt: admissionApplicationDocuments.updatedAt,
      })
      .from(admissionApplicationDocuments)
      .where(
        and(
          eq(admissionApplicationDocuments.id, documentId),
          eq(admissionApplicationDocuments.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.APPLICATION_DOCUMENT_NOT_FOUND,
      );
    }

    return row;
  }

  // ── Convert to student ────────────────────────────────────────────────────

  async convertToStudent(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: ConvertToStudentDto,
  ) {
    const application = await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );

    if (
      application.status !== ADMISSION_APPLICATION_STATUSES_EXTENDED.APPROVED
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.APPLICATION_NOT_APPROVED,
      );
    }

    const [alreadyConverted] = await this.db
      .select({ convertedStudentId: admissionApplications.convertedStudentId })
      .from(admissionApplications)
      .where(eq(admissionApplications.id, applicationId))
      .limit(1);

    if (alreadyConverted?.convertedStudentId) {
      throw new ConflictException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.APPLICATION_ALREADY_CONVERTED,
      );
    }

    const campusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, campusId, scopes);

    const resolvedPlacement = await this.resolveClassSection(
      institutionId,
      payload.classId,
      payload.sectionId,
    );

    const studentId = randomUUID();
    const studentMembershipId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(member).values({
        id: studentMembershipId,
        organizationId: institutionId,
        userId: null,
        primaryCampusId: campusId,
        memberType: MEMBER_TYPES.STUDENT,
        status: STATUS.MEMBER.ACTIVE,
      });

      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId: studentMembershipId,
        campusId,
      });

      await tx.insert(students).values({
        id: studentId,
        institutionId,
        membershipId: studentMembershipId,
        admissionNumber: payload.admissionNumber.trim(),
        firstName: application.studentFirstName,
        lastName: application.studentLastName,
        classId: resolvedPlacement.classId,
        sectionId: resolvedPlacement.sectionId,
      });

      await tx
        .update(admissionApplications)
        .set({
          status: ADMISSION_APPLICATION_STATUSES_EXTENDED.CONVERTED,
          convertedStudentId: studentId,
        })
        .where(eq(admissionApplications.id, applicationId));
    });

    const studentName =
      `${application.studentFirstName} ${application.studentLastName ?? ""}`.trim();

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_CONVERSION,
        entityId: applicationId,
        entityLabel: studentName,
        summary: `Converted application for ${studentName} to student ${studentId}.`,
      })
      .catch(() => {});

    return { applicationId, studentId };
  }

  private async resolveClassSection(
    institutionId: string,
    classId: string,
    sectionId: string,
  ) {
    const [row] = await this.db
      .select({
        classId: schoolClasses.id,
        sectionId: classSections.id,
      })
      .from(schoolClasses)
      .innerJoin(classSections, eq(classSections.classId, schoolClasses.id))
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(classSections.id, sectionId),
          eq(schoolClasses.institutionId, institutionId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return row;
  }

  // ── Waitlist ──────────────────────────────────────────────────────────────

  async waitlistApplication(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: WaitlistApplicationDto,
  ) {
    await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );

    const [current] = await this.db
      .select({
        status: admissionApplications.status,
        waitlistPosition: admissionApplications.waitlistPosition,
      })
      .from(admissionApplications)
      .where(eq(admissionApplications.id, applicationId))
      .limit(1);

    if (
      current?.status === ADMISSION_APPLICATION_STATUSES_EXTENDED.WAITLISTED &&
      current.waitlistPosition !== null
    ) {
      throw new ConflictException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.WAITLIST_POSITION_EXISTS,
      );
    }

    await this.db
      .update(admissionApplications)
      .set({
        status: ADMISSION_APPLICATION_STATUSES_EXTENDED.WAITLISTED,
        waitlistPosition: payload.waitlistPosition,
      })
      .where(eq(admissionApplications.id, applicationId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
        entityId: applicationId,
        entityLabel: `Position ${payload.waitlistPosition}`,
        summary: `Waitlisted application ${applicationId} at position ${payload.waitlistPosition}.`,
      })
      .catch(() => {});

    return {
      applicationId,
      status: ADMISSION_APPLICATION_STATUSES_EXTENDED.WAITLISTED,
      waitlistPosition: payload.waitlistPosition,
    };
  }

  async promoteNextWaitlisted(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    await this.assertCampusAccess(institutionId, scopedCampusId, scopes);

    const [nextApplication] = await this.db
      .select({
        id: admissionApplications.id,
        waitlistPosition: admissionApplications.waitlistPosition,
      })
      .from(admissionApplications)
      .where(
        and(
          eq(admissionApplications.institutionId, institutionId),
          eq(admissionApplications.campusId, scopedCampusId),
          eq(
            admissionApplications.status,
            ADMISSION_APPLICATION_STATUSES_EXTENDED.WAITLISTED,
          ),
          isNull(admissionApplications.deletedAt),
        ),
      )
      .orderBy(asc(admissionApplications.waitlistPosition))
      .limit(1);

    if (!nextApplication) {
      throw new NotFoundException(
        ERROR_MESSAGES.ADMISSIONS_DEPTH.NO_WAITLISTED_APPLICATIONS,
      );
    }

    await this.db
      .update(admissionApplications)
      .set({
        status: ADMISSION_APPLICATION_STATUSES_EXTENDED.APPROVED,
        waitlistPosition: null,
      })
      .where(eq(admissionApplications.id, nextApplication.id));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
        entityId: nextApplication.id,
        entityLabel: `Promoted from position ${nextApplication.waitlistPosition}`,
        summary: `Promoted waitlisted application ${nextApplication.id} to approved.`,
      })
      .catch(() => {});

    return {
      promotedApplicationId: nextApplication.id,
      status: ADMISSION_APPLICATION_STATUSES_EXTENDED.APPROVED,
    };
  }

  // ── Registration fee ──────────────────────────────────────────────────────

  async recordRegistrationFee(
    institutionId: string,
    applicationId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: RecordRegistrationFeeDto,
  ) {
    await this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );

    const now = new Date();
    await this.db
      .update(admissionApplications)
      .set({
        registrationFeeAmountInPaise: payload.amountInPaise,
        registrationFeePaidAt: now,
      })
      .where(eq(admissionApplications.id, applicationId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
        entityId: applicationId,
        entityLabel: `Fee ${payload.amountInPaise} paise`,
        summary: `Recorded registration fee of ${payload.amountInPaise} paise for application ${applicationId}.`,
      })
      .catch(() => {});

    return {
      applicationId,
      registrationFeeAmountInPaise: payload.amountInPaise,
      registrationFeePaidAt: now.toISOString(),
    };
  }

  private normalizeOptional(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async assertCampusAccess(
    institutionId: string,
    campusId: string,
    scopes: ResolvedScopes,
  ) {
    const [matchedCampus] = await this.db
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          campusScopeFilter(campus.id, scopes),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }
  }

  private async assertEnquiryExists(
    institutionId: string,
    enquiryId: string,
    scopes: ResolvedScopes,
  ) {
    const [matchedEnquiry] = await this.db
      .select({ id: admissionEnquiries.id })
      .from(admissionEnquiries)
      .where(
        and(
          eq(admissionEnquiries.id, enquiryId),
          eq(admissionEnquiries.institutionId, institutionId),
          isNull(admissionEnquiries.deletedAt),
          campusScopeFilter(admissionEnquiries.campusId, scopes),
        ),
      )
      .limit(1);

    if (!matchedEnquiry) {
      throw new NotFoundException(ERROR_MESSAGES.ADMISSIONS.ENQUIRY_NOT_FOUND);
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }
}
