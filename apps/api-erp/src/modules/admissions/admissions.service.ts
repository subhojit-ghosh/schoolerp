import { DATABASE } from "@repo/backend-core";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  type AdmissionFormFieldType,
  type AdmissionFormFieldScope,
} from "@repo/contracts";
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  admissionApplications,
  admissionEnquiries,
  and,
  asc,
  campus,
  count,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import { campusScopeFilter } from "../auth/scope-filter";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateAdmissionApplicationDto,
  CreateAdmissionEnquiryDto,
  ListAdmissionApplicationsQueryDto,
  ListAdmissionEnquiriesQueryDto,
  UpdateAdmissionApplicationDto,
  UpdateAdmissionEnquiryDto,
} from "./admissions.schemas";
import {
  sortableAdmissionApplicationColumns,
  sortableAdmissionEnquiryColumns,
} from "./admissions.schemas";
import { AdmissionFormFieldsService } from "./admission-form-fields.service";

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

    return this.getAdmissionEnquiry(
      institutionId,
      enquiryId,
      authSession,
      scopes,
    );
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

    return this.getAdmissionEnquiry(
      institutionId,
      enquiryId,
      authSession,
      scopes,
    );
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

    return this.getAdmissionApplication(
      institutionId,
      applicationId,
      authSession,
      scopes,
    );
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
