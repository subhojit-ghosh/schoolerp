import { DATABASE } from "@repo/backend-core";
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
  academicYears,
  attendanceRecords,
  and,
  asc,
  campus,
  campusMemberships,
  classSections,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  member,
  membershipRoleScopes,
  membershipRoles,
  ne,
  or,
  roles,
  schoolClasses,
  staffCampusTransfers,
  staffDocuments,
  staffProfiles,
  subjectTeacherAssignments,
  subjects,
  timetableEntries,
  type SQL,
  user,
} from "@repo/database";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  ROLE_SLUGS,
  ROLE_TYPES,
  SORT_ORDERS,
  STATUS,
  SCOPE_TYPES,
} from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { TimetableService } from "../timetable/timetable.service";
import type {
  CreateStaffResultDto,
  StaffCampusTransferDto,
  StaffDocumentDto,
  StaffDto,
  StaffProfileDto,
  StaffRoleAssignmentDto,
  StaffRoleAssignmentScopeDto,
  SubjectTeacherAssignmentDto,
  TeachingLoadEntryDto,
  TeachingLoadResultDto,
} from "./staff.dto";
import type {
  CreateCampusTransferDto,
  CreateStaffDocumentDto,
  CreateStaffDto,
  CreateStaffRoleAssignmentDto,
  CreateSubjectTeacherAssignmentDto,
  ListStaffQueryDto,
  SetStaffStatusDto,
  UpdateStaffDocumentDto,
  UpdateStaffDto,
} from "./staff.schemas";
import { sortableStaffColumns } from "./staff.schemas";

type StaffRoleSummary = {
  id: string;
  name: string;
  slug: string;
};

type StaffWriter = Pick<AppDatabase, "delete" | "insert" | "select" | "update">;

type ScopeInput = {
  campusId?: string;
  classId?: string;
  sectionId?: string;
};

type RoleAssignmentRow = {
  assignmentId: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  validFrom: string;
  validTo: string | null;
  createdAt: Date;
};

const sortableColumns = {
  campus: campus.name,
  designation: staffProfiles.designation,
  name: user.name,
  status: member.status,
} as const;

@Injectable()
export class StaffService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly timetableService: TimetableService,
  ) {}

  async listStaff(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListStaffQueryDto = {},
  ): Promise<PaginatedResult<StaffDto>> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    await this.getCampus(institutionId, activeCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableStaffColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.STAFF),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    if (query.status?.length) {
      conditions.push(inArray(member.status, query.status));
    } else {
      conditions.push(ne(member.status, STATUS.MEMBER.DELETED));
    }

    conditions.push(eq(member.primaryCampusId, activeCampusId));

    if (query.search) {
      conditions.push(
        or(
          ilike(user.name, `%${query.search}%`),
          ilike(user.mobile, `%${query.search}%`),
          ilike(user.email, `%${query.search}%`),
          ilike(staffProfiles.employeeId, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(staffProfiles, eq(member.id, staffProfiles.membershipId))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const staffRows = await this.db
      .select(this.staffSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(staffProfiles, eq(member.id, staffProfiles.membershipId))
      .where(where)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(user.name))
      .limit(pageSize)
      .offset(pagination.offset);

    const roleByMembershipId = await this.listRoleMap(
      staffRows.map((row) => row.id),
    );

    return {
      rows: staffRows.map((row) => ({
        ...this.stripProfileColumns(row),
        profile: this.mapStaffProfile(row),
        role: roleByMembershipId.get(row.id) ?? null,
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async listRoles(institutionId: string, _authSession: AuthenticatedSession) {
    return this.listRolesForInstitution(institutionId);
  }

  async listRoleAssignments(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<StaffRoleAssignmentDto[]> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    return this.listRoleAssignmentsForMembership(staffMembership.id);
  }

  async getStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const [staffRecord] = await this.listStaffForInstitution(
      institutionId,
      activeCampusScopes,
      staffId,
    );

    if (!staffRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STAFF.STAFF_NOT_FOUND);
    }

    return staffRecord;
  }

  async createStaff(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateStaffDto,
  ): Promise<CreateStaffResultDto> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    this.assertRequestedScopeWithinAssignerScopes(
      { campusId: activeCampusId },
      activeCampusScopes,
    );

    const selectedCampus = await this.getCampus(institutionId, activeCampusId);

    const createResult = await this.db.transaction(async (tx) => {
      const resolvedUser = await this.findOrCreateUser(
        tx,
        institutionId,
        payload,
      );

      const [existingStaffMembership] = await tx
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.organizationId, institutionId),
            eq(member.userId, resolvedUser.id),
            eq(member.memberType, MEMBER_TYPES.STAFF),
            ne(member.status, STATUS.MEMBER.DELETED),
          ),
        )
        .limit(1);

      if (existingStaffMembership) {
        throw new ConflictException(
          ERROR_MESSAGES.STAFF.STAFF_MEMBERSHIP_EXISTS,
        );
      }

      const nextMembershipId = randomUUID();

      await tx.insert(member).values({
        id: nextMembershipId,
        organizationId: institutionId,
        userId: resolvedUser.id,
        primaryCampusId: selectedCampus.id,
        memberType: MEMBER_TYPES.STAFF,
        status: payload.status,
      });

      await this.ensureCampusMembership(
        tx,
        nextMembershipId,
        selectedCampus.id,
      );

      if (payload.profile) {
        const profileValues = Object.fromEntries(
          Object.entries(payload.profile).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(profileValues).length > 0) {
          await tx.insert(staffProfiles).values({
            id: randomUUID(),
            institutionId,
            membershipId: nextMembershipId,
            ...profileValues,
          });
        }
      }

      return {
        membershipId: nextMembershipId,
        userId: resolvedUser.id,
        createdNewUser: resolvedUser.createdNewUser,
      };
    });

    const staff = await this.getStaff(
      institutionId,
      createResult.membershipId,
      authSession,
      activeCampusScopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF,
        entityId: createResult.membershipId,
        entityLabel: staff.name,
        summary: `Created staff member ${staff.name}.`,
      })
      .catch(() => {});

    return {
      staff,
      passwordSetup: null,
    };
  }

  async updateStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateStaffDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const existingStaff = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    this.assertRequestedScopeWithinAssignerScopes(
      { campusId: activeCampusId },
      activeCampusScopes,
    );

    const selectedCampus = await this.getCampus(institutionId, activeCampusId);

    await this.db.transaction(async (tx) => {
      const resolvedUserId = await this.reconcileUserIdentity(
        tx,
        institutionId,
        existingStaff.userId,
        payload,
      );

      if (resolvedUserId !== existingStaff.userId) {
        const [duplicateMembership] = await tx
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.organizationId, institutionId),
              eq(member.userId, resolvedUserId),
              eq(member.memberType, MEMBER_TYPES.STAFF),
              ne(member.status, STATUS.MEMBER.DELETED),
            ),
          )
          .limit(1);

        if (duplicateMembership && duplicateMembership.id !== staffId) {
          throw new ConflictException(
            ERROR_MESSAGES.STAFF.STAFF_MEMBERSHIP_EXISTS,
          );
        }
      }

      await tx
        .update(member)
        .set({
          userId: resolvedUserId,
          primaryCampusId: selectedCampus.id,
          status: payload.status,
        })
        .where(eq(member.id, staffId));

      await this.ensureCampusMembership(tx, staffId, selectedCampus.id);

      if (payload.profile) {
        const profileValues = Object.fromEntries(
          Object.entries(payload.profile).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(profileValues).length > 0) {
          const [existing] = await tx
            .select({ id: staffProfiles.id })
            .from(staffProfiles)
            .where(eq(staffProfiles.membershipId, staffId))
            .limit(1);

          if (existing) {
            await tx
              .update(staffProfiles)
              .set(profileValues)
              .where(eq(staffProfiles.id, existing.id));
          } else {
            await tx.insert(staffProfiles).values({
              id: randomUUID(),
              institutionId,
              membershipId: staffId,
              ...profileValues,
            });
          }
        }
      }
    });

    const updatedStaff = await this.getStaff(
      institutionId,
      staffId,
      authSession,
      activeCampusScopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF,
        entityId: staffId,
        entityLabel: updatedStaff.name,
        summary: `Updated staff member ${updatedStaff.name}.`,
      })
      .catch(() => {});

    return updatedStaff;
  }

  async setStaffStatus(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetStaffStatusDto,
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    await this.db
      .update(member)
      .set({ status: payload.status })
      .where(
        and(
          eq(member.id, staffId),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
        ),
      );

    const updatedStaff = await this.getStaff(
      institutionId,
      staffId,
      authSession,
      activeCampusScopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF,
        entityId: staffId,
        entityLabel: updatedStaff.name,
        summary: `Changed staff member ${updatedStaff.name} status to ${payload.status}.`,
      })
      .catch(() => {});

    return updatedStaff;
  }

  async deleteStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    await this.assertStaffRemovable(institutionId, staffMembership.id);
    await this.timetableService.assertStaffMemberRemovable(
      institutionId,
      staffMembership.id,
    );

    await this.db.transaction(async (tx) => {
      // Hard-delete role scopes and assignments (restrict FKs — must go first)
      const activeAssignments = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(and(eq(membershipRoles.membershipId, staffMembership.id)));

      if (activeAssignments.length > 0) {
        const assignmentIds = activeAssignments.map((a) => a.id);
        await tx
          .delete(membershipRoleScopes)
          .where(inArray(membershipRoleScopes.membershipRoleId, assignmentIds));
        await tx
          .delete(membershipRoles)
          .where(inArray(membershipRoles.id, assignmentIds));
      }

      // Check if user has other active memberships (e.g. also a guardian)
      const [otherMembership] = await tx
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.userId, staffMembership.userId),
            ne(member.id, staffMembership.id),
            ne(member.status, STATUS.MEMBER.DELETED),
          ),
        )
        .limit(1);

      if (!otherMembership) {
        // No other memberships — hard delete user (cascades to member, campusMemberships, sessions, tokens)
        await tx.delete(user).where(eq(user.id, staffMembership.userId));
      } else {
        // User has other roles — soft delete this membership only
        await tx
          .update(campusMemberships)
          .set({ deletedAt: new Date() })
          .where(eq(campusMemberships.membershipId, staffMembership.id));
        await tx
          .update(member)
          .set({ status: STATUS.MEMBER.DELETED, deletedAt: new Date() })
          .where(eq(member.id, staffMembership.id));
      }
    });
  }

  async createRoleAssignment(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateStaffRoleAssignmentDto,
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );
    const selectedRole = await this.getRole(institutionId, payload.roleId);
    const normalizedScope = await this.resolveAssignmentScope(
      institutionId,
      payload,
    );

    this.assertRequestedScopeWithinAssignerScopes(
      normalizedScope,
      activeCampusScopes,
    );
    await this.assertNoDuplicateRoleAssignment(
      staffMembership.id,
      selectedRole.id,
      normalizedScope,
    );

    const assignmentId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(membershipRoles).values({
        id: assignmentId,
        membershipId: staffMembership.id,
        roleId: selectedRole.id,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: null,
        academicYearId: null,
      });

      const scopeRows = this.buildMembershipRoleScopeRows(
        assignmentId,
        normalizedScope,
      );

      if (scopeRows.length > 0) {
        await tx.insert(membershipRoleScopes).values(scopeRows);
      }
    });

    const assignments = await this.listRoleAssignmentsForMembership(
      staffMembership.id,
    );

    const createdAssignment = assignments.find(
      (item) => item.id === assignmentId,
    );
    if (!createdAssignment) {
      throw new NotFoundException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_NOT_FOUND,
      );
    }

    return createdAssignment;
  }

  async removeRoleAssignment(
    institutionId: string,
    staffId: string,
    assignmentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    const [assignment] = await this.db
      .select({ id: membershipRoles.id })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.id, assignmentId),
          eq(membershipRoles.membershipId, staffMembership.id),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw new NotFoundException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_NOT_FOUND,
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(membershipRoleScopes)
        .where(eq(membershipRoleScopes.membershipRoleId, assignmentId));

      await tx
        .delete(membershipRoles)
        .where(eq(membershipRoles.id, assignmentId));
    });
  }

  private async listStaffForInstitution(
    institutionId: string,
    scopes: ResolvedScopes,
    staffId?: string,
  ) {
    const conditions: SQL[] = [
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.STAFF),
      ne(member.status, STATUS.MEMBER.DELETED),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    if (staffId) {
      conditions.push(eq(member.id, staffId));
    }

    const visibleCampusFilter = campusScopeFilter(
      member.primaryCampusId,
      scopes,
    );
    if (visibleCampusFilter) {
      conditions.push(visibleCampusFilter);
    }

    const staffRows = await this.db
      .select(this.staffSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .leftJoin(staffProfiles, eq(member.id, staffProfiles.membershipId))
      .where(and(...conditions));

    const roleByMembershipId = await this.listRoleMap(
      staffRows.map((row) => row.id),
    );

    return staffRows.map((row) => ({
      ...this.stripProfileColumns(row),
      profile: this.mapStaffProfile(row),
      role: roleByMembershipId.get(row.id) ?? null,
    }));
  }

  private async listRolesForInstitution(institutionId: string) {
    return this.db
      .select({
        id: roles.id,
        name: roles.name,
        slug: roles.slug,
      })
      .from(roles)
      .where(
        and(
          ne(roles.roleType, ROLE_TYPES.PLATFORM),
          ne(roles.slug, ROLE_SLUGS.INSTITUTION_ADMIN),
          or(
            isNull(roles.institutionId),
            eq(roles.institutionId, institutionId),
          ),
        ),
      )
      .orderBy(asc(roles.isSystem), asc(roles.name));
  }

  private async listRoleAssignmentsForMembership(membershipId: string) {
    const assignmentRows = await this.db
      .select({
        assignmentId: membershipRoles.id,
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
        validFrom: membershipRoles.validFrom,
        validTo: membershipRoles.validTo,
        createdAt: membershipRoles.createdAt,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(membershipRoles.roleId, roles.id))
      .where(and(eq(membershipRoles.membershipId, membershipId)))
      .orderBy(desc(membershipRoles.createdAt), asc(roles.name));

    return this.enrichRoleAssignments(assignmentRows);
  }

  private async enrichRoleAssignments(rows: RoleAssignmentRow[]) {
    if (rows.length === 0) {
      return [];
    }

    const assignmentIds = rows.map((row) => row.assignmentId);
    const scopeRows = await this.db
      .select({
        assignmentId: membershipRoleScopes.membershipRoleId,
        scopeType: membershipRoleScopes.scopeType,
        scopeId: membershipRoleScopes.scopeId,
      })
      .from(membershipRoleScopes)
      .where(inArray(membershipRoleScopes.membershipRoleId, assignmentIds));

    const campusIds = scopeRows
      .filter((row) => row.scopeType === SCOPE_TYPES.CAMPUS)
      .map((row) => row.scopeId);
    const classIds = scopeRows
      .filter((row) => row.scopeType === SCOPE_TYPES.CLASS)
      .map((row) => row.scopeId);
    const sectionIds = scopeRows
      .filter((row) => row.scopeType === SCOPE_TYPES.SECTION)
      .map((row) => row.scopeId);

    const [campusRows, classRows, sectionRows] = await Promise.all([
      campusIds.length === 0
        ? Promise.resolve([])
        : this.db
            .select({ id: campus.id, name: campus.name })
            .from(campus)
            .where(inArray(campus.id, campusIds)),
      classIds.length === 0
        ? Promise.resolve([])
        : this.db
            .select({ id: schoolClasses.id, name: schoolClasses.name })
            .from(schoolClasses)
            .where(inArray(schoolClasses.id, classIds)),
      sectionIds.length === 0
        ? Promise.resolve([])
        : this.db
            .select({ id: classSections.id, name: classSections.name })
            .from(classSections)
            .where(inArray(classSections.id, sectionIds)),
    ]);

    const campusNameById = new Map(
      campusRows.map((item) => [item.id, item.name]),
    );
    const classNameById = new Map(
      classRows.map((item) => [item.id, item.name]),
    );
    const sectionNameById = new Map(
      sectionRows.map((item) => [item.id, item.name]),
    );

    const scopeByAssignmentId = new Map<string, StaffRoleAssignmentScopeDto>();
    for (const row of scopeRows) {
      const currentScope = scopeByAssignmentId.get(row.assignmentId) ?? {
        campusId: null,
        campusName: null,
        classId: null,
        className: null,
        sectionId: null,
        sectionName: null,
      };

      if (row.scopeType === SCOPE_TYPES.CAMPUS) {
        currentScope.campusId = row.scopeId;
        currentScope.campusName = campusNameById.get(row.scopeId) ?? null;
      }

      if (row.scopeType === SCOPE_TYPES.CLASS) {
        currentScope.classId = row.scopeId;
        currentScope.className = classNameById.get(row.scopeId) ?? null;
      }

      if (row.scopeType === SCOPE_TYPES.SECTION) {
        currentScope.sectionId = row.scopeId;
        currentScope.sectionName = sectionNameById.get(row.scopeId) ?? null;
      }

      scopeByAssignmentId.set(row.assignmentId, currentScope);
    }

    return rows.map((row) => ({
      id: row.assignmentId,
      role: {
        id: row.roleId,
        name: row.roleName,
        slug: row.roleSlug,
      },
      scope: scopeByAssignmentId.get(row.assignmentId) ?? {
        campusId: null,
        campusName: null,
        classId: null,
        className: null,
        sectionId: null,
        sectionName: null,
      },
      validFrom: row.validFrom,
      validTo: row.validTo,
    }));
  }

  private async listRoleMap(membershipIds: string[]) {
    if (membershipIds.length === 0) {
      return new Map<string, StaffRoleSummary>();
    }

    const roleRows = await this.db
      .select({
        membershipId: membershipRoles.membershipId,
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
        createdAt: membershipRoles.createdAt,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(membershipRoles.roleId, roles.id))
      .where(and(inArray(membershipRoles.membershipId, membershipIds)));

    const staffRoleMap = new Map<string, StaffRoleSummary>();

    roleRows
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
      .forEach((row) => {
        if (!staffRoleMap.has(row.membershipId)) {
          staffRoleMap.set(row.membershipId, {
            id: row.roleId,
            name: row.roleName,
            slug: row.roleSlug,
          });
        }
      });

    return staffRoleMap;
  }

  private readonly staffSelect = {
    id: member.id,
    userId: user.id,
    institutionId: member.organizationId,
    honorific: user.honorific,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    memberType: member.memberType,
    campusId: campus.id,
    campusName: campus.name,
    status: member.status,
    profileEmployeeId: staffProfiles.employeeId,
    profileDesignation: staffProfiles.designation,
    profileDepartment: staffProfiles.department,
    profileDateOfJoining: staffProfiles.dateOfJoining,
    profileDateOfBirth: staffProfiles.dateOfBirth,
    profileGender: staffProfiles.gender,
    profileBloodGroup: staffProfiles.bloodGroup,
    profileAddress: staffProfiles.address,
    profileEmergencyContactName: staffProfiles.emergencyContactName,
    profileEmergencyContactMobile: staffProfiles.emergencyContactMobile,
    profileEmergencyContactRelation: staffProfiles.emergencyContactRelation,
    profileReportingToMemberId: staffProfiles.reportingToMemberId,
    profileQualification: staffProfiles.qualification,
    profileExperienceYears: staffProfiles.experienceYears,
    profileEmploymentType: staffProfiles.employmentType,
  };

  private mapStaffProfile(row: {
    profileEmployeeId: string | null;
    profileDesignation: string | null;
    profileDepartment: string | null;
    profileDateOfJoining: string | null;
    profileDateOfBirth: string | null;
    profileGender: string | null;
    profileBloodGroup: string | null;
    profileAddress: string | null;
    profileEmergencyContactName: string | null;
    profileEmergencyContactMobile: string | null;
    profileEmergencyContactRelation: string | null;
    profileReportingToMemberId: string | null;
    profileQualification: string | null;
    profileExperienceYears: number | null;
    profileEmploymentType: string | null;
  }): StaffProfileDto | null {
    // If no profile exists (all nulls from left join), return null
    const hasAnyValue = Object.entries(row)
      .filter(([k]) => k.startsWith("profile"))
      .some(([, v]) => v !== null);
    if (!hasAnyValue) return null;

    return {
      employeeId: row.profileEmployeeId,
      designation: row.profileDesignation,
      department: row.profileDepartment,
      dateOfJoining: row.profileDateOfJoining,
      dateOfBirth: row.profileDateOfBirth,
      gender: row.profileGender,
      bloodGroup: row.profileBloodGroup,
      address: row.profileAddress,
      emergencyContactName: row.profileEmergencyContactName,
      emergencyContactMobile: row.profileEmergencyContactMobile,
      emergencyContactRelation: row.profileEmergencyContactRelation,
      reportingToMemberId: row.profileReportingToMemberId,
      reportingToMemberName: null,
      qualification: row.profileQualification,
      experienceYears: row.profileExperienceYears,
      employmentType: row.profileEmploymentType,
    };
  }

  private stripProfileColumns<T extends Record<string, unknown>>(
    row: T,
  ): Omit<
    T,
    | "profileEmployeeId"
    | "profileDesignation"
    | "profileDepartment"
    | "profileDateOfJoining"
    | "profileDateOfBirth"
    | "profileGender"
    | "profileBloodGroup"
    | "profileAddress"
    | "profileEmergencyContactName"
    | "profileEmergencyContactMobile"
    | "profileEmergencyContactRelation"
    | "profileReportingToMemberId"
    | "profileQualification"
    | "profileExperienceYears"
    | "profileEmploymentType"
  > {
    const {
      profileEmployeeId: _1,
      profileDesignation: _2,
      profileDepartment: _3,
      profileDateOfJoining: _4,
      profileDateOfBirth: _5,
      profileGender: _6,
      profileBloodGroup: _7,
      profileAddress: _8,
      profileEmergencyContactName: _9,
      profileEmergencyContactMobile: _10,
      profileEmergencyContactRelation: _11,
      profileReportingToMemberId: _12,
      profileQualification: _13,
      profileExperienceYears: _14,
      profileEmploymentType: _15,
      ...rest
    } = row as Record<string, unknown>;
    return rest as Omit<
      T,
      | "profileEmployeeId"
      | "profileDesignation"
      | "profileDepartment"
      | "profileDateOfJoining"
      | "profileDateOfBirth"
      | "profileGender"
      | "profileBloodGroup"
      | "profileAddress"
      | "profileEmergencyContactName"
      | "profileEmergencyContactMobile"
      | "profileEmergencyContactRelation"
      | "profileReportingToMemberId"
      | "profileQualification"
      | "profileExperienceYears"
      | "profileEmploymentType"
    >;
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [matchedCampus] = await this.db
      .select({
        id: campus.id,
        name: campus.name,
      })
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

  private async getRole(institutionId: string, roleId: string) {
    const [matchedRole] = await this.db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(
        and(
          eq(roles.id, roleId),
          or(
            isNull(roles.institutionId),
            eq(roles.institutionId, institutionId),
          ),
        ),
      )
      .limit(1);

    if (!matchedRole) {
      throw new NotFoundException(ERROR_MESSAGES.ROLES.ROLE_NOT_FOUND);
    }

    return matchedRole;
  }

  private async getClass(institutionId: string, classId: string) {
    const [matchedClass] = await this.db
      .select({
        id: schoolClasses.id,
        campusId: schoolClasses.campusId,
        name: schoolClasses.name,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .limit(1);

    if (!matchedClass) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return matchedClass;
  }

  private async getSection(institutionId: string, sectionId: string) {
    const [matchedSection] = await this.db
      .select({
        id: classSections.id,
        classId: classSections.classId,
        name: classSections.name,
      })
      .from(classSections)
      .where(
        and(
          eq(classSections.id, sectionId),
          eq(classSections.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!matchedSection) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.SECTION_NOT_FOUND);
    }

    return matchedSection;
  }

  private async getStaffMembership(
    institutionId: string,
    staffId: string,
    scopes: ResolvedScopes,
  ) {
    const conditions: SQL[] = [
      eq(member.id, staffId),
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.STAFF),
      ne(member.status, STATUS.MEMBER.DELETED),
    ];

    const visibleCampusFilter = campusScopeFilter(
      member.primaryCampusId,
      scopes,
    );
    if (visibleCampusFilter) {
      conditions.push(visibleCampusFilter);
    }

    const [matchedStaff] = await this.db
      .select({
        id: member.id,
        userId: user.id,
        primaryCampusId: member.primaryCampusId,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(...conditions))
      .limit(1);

    if (!matchedStaff) {
      throw new NotFoundException(ERROR_MESSAGES.STAFF.STAFF_NOT_FOUND);
    }

    return matchedStaff;
  }

  private async assertStaffRemovable(institutionId: string, staffId: string) {
    const [attendanceReference] = await this.db
      .select({ id: attendanceRecords.id })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.markedByMembershipId, staffId),
        ),
      )
      .limit(1);

    if (attendanceReference) {
      throw new ConflictException(
        ERROR_MESSAGES.STAFF.STAFF_HAS_ATTENDANCE_RECORDS,
      );
    }
  }

  private async resolveAssignmentScope(
    institutionId: string,
    payload: ScopeInput,
  ) {
    if (payload.sectionId && !payload.classId) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_INVALID,
      );
    }

    if (payload.classId && !payload.campusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_INVALID,
      );
    }

    const selectedCampus = payload.campusId
      ? await this.getCampus(institutionId, payload.campusId)
      : null;
    const selectedClass = payload.classId
      ? await this.getClass(institutionId, payload.classId)
      : null;
    const selectedSection = payload.sectionId
      ? await this.getSection(institutionId, payload.sectionId)
      : null;

    if (
      selectedCampus &&
      selectedClass &&
      selectedClass.campusId !== selectedCampus.id
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_MISMATCH,
      );
    }

    if (
      selectedClass &&
      selectedSection &&
      selectedSection.classId !== selectedClass.id
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_MISMATCH,
      );
    }

    return {
      campusId: selectedCampus?.id,
      classId: selectedClass?.id,
      sectionId: selectedSection?.id,
    };
  }

  private assertRequestedScopeWithinAssignerScopes(
    requestedScope: ScopeInput,
    scopes: ResolvedScopes,
  ) {
    if (scopes.campusIds !== "all") {
      if (
        !requestedScope.campusId ||
        !scopes.campusIds.includes(requestedScope.campusId)
      ) {
        throw new ForbiddenException(
          ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_FORBIDDEN,
        );
      }
    }

    if (scopes.classIds !== "all") {
      if (
        !requestedScope.classId ||
        !scopes.classIds.includes(requestedScope.classId)
      ) {
        throw new ForbiddenException(
          ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_FORBIDDEN,
        );
      }
    }

    if (scopes.sectionIds !== "all") {
      if (
        !requestedScope.sectionId ||
        !scopes.sectionIds.includes(requestedScope.sectionId)
      ) {
        throw new ForbiddenException(
          ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_FORBIDDEN,
        );
      }
    }
  }

  private async assertNoDuplicateRoleAssignment(
    membershipId: string,
    roleId: string,
    requestedScope: ScopeInput,
  ) {
    const assignmentRows = await this.db
      .select({
        assignmentId: membershipRoles.id,
      })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          eq(membershipRoles.roleId, roleId),
        ),
      );

    if (assignmentRows.length === 0) {
      return;
    }

    const scopeRows = await this.db
      .select({
        assignmentId: membershipRoleScopes.membershipRoleId,
        scopeType: membershipRoleScopes.scopeType,
        scopeId: membershipRoleScopes.scopeId,
      })
      .from(membershipRoleScopes)
      .where(
        inArray(
          membershipRoleScopes.membershipRoleId,
          assignmentRows.map((row) => row.assignmentId),
        ),
      );

    const requestedKey = this.buildScopeKey(requestedScope);
    const scopeMap = new Map<string, ScopeInput>();

    for (const row of scopeRows) {
      const currentScope = scopeMap.get(row.assignmentId) ?? {};

      if (row.scopeType === SCOPE_TYPES.CAMPUS) {
        currentScope.campusId = row.scopeId;
      }

      if (row.scopeType === SCOPE_TYPES.CLASS) {
        currentScope.classId = row.scopeId;
      }

      if (row.scopeType === SCOPE_TYPES.SECTION) {
        currentScope.sectionId = row.scopeId;
      }

      scopeMap.set(row.assignmentId, currentScope);
    }

    for (const assignment of assignmentRows) {
      const existingScope = scopeMap.get(assignment.assignmentId) ?? {};
      if (this.buildScopeKey(existingScope) === requestedKey) {
        throw new ConflictException(
          ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_EXISTS,
        );
      }
    }
  }

  private buildScopeKey(scope: ScopeInput) {
    return [
      scope.campusId ?? "",
      scope.classId ?? "",
      scope.sectionId ?? "",
    ].join("::");
  }

  private buildMembershipRoleScopeRows(
    membershipRoleId: string,
    scope: ScopeInput,
  ) {
    const rows: Array<{
      id: string;
      membershipRoleId: string;
      scopeType: (typeof SCOPE_TYPES)[keyof typeof SCOPE_TYPES];
      scopeId: string;
    }> = [];

    if (scope.campusId) {
      rows.push({
        id: randomUUID(),
        membershipRoleId,
        scopeType: SCOPE_TYPES.CAMPUS,
        scopeId: scope.campusId,
      });
    }

    if (scope.classId) {
      rows.push({
        id: randomUUID(),
        membershipRoleId,
        scopeType: SCOPE_TYPES.CLASS,
        scopeId: scope.classId,
      });
    }

    if (scope.sectionId) {
      rows.push({
        id: randomUUID(),
        membershipRoleId,
        scopeType: SCOPE_TYPES.SECTION,
        scopeId: scope.sectionId,
      });
    }

    return rows;
  }

  private async findOrCreateUser(
    tx: StaffWriter,
    institutionId: string,
    payload: CreateStaffDto,
  ) {
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const matchedUser = await this.findUserByIdentity(
      tx,
      institutionId,
      normalizedMobile,
      normalizedEmail,
    );

    if (matchedUser) {
      // Do NOT overwrite name/email/mobile — admin can update from profile screen
      return { id: matchedUser.id, createdNewUser: false };
    }

    const userId = randomUUID();

    await tx.insert(user).values({
      id: userId,
      institutionId,
      honorific: payload.honorific ?? null,
      name: payload.name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      passwordHash: await hash(payload.temporaryPassword, 12),
      mustChangePassword: true,
    });

    return { id: userId, createdNewUser: true };
  }

  private async reconcileUserIdentity(
    tx: StaffWriter,
    institutionId: string,
    currentUserId: string,
    payload: UpdateStaffDto,
  ) {
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const matchedUser = await this.findUserByIdentity(
      tx,
      institutionId,
      normalizedMobile,
      normalizedEmail,
    );

    if (matchedUser && matchedUser.id !== currentUserId) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.MOBILE_ALREADY_EXISTS);
    }

    await tx
      .update(user)
      .set({
        honorific: payload.honorific ?? null,
        name: payload.name.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
      })
      .where(eq(user.id, currentUserId));

    return currentUserId;
  }

  private async findUserByIdentity(
    tx: StaffWriter,
    institutionId: string,
    mobile: string,
    email: string | null,
  ) {
    const matchedUsers = await tx
      .select({
        id: user.id,
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(
        and(
          eq(user.institutionId, institutionId),
          email
            ? or(eq(user.mobile, mobile), eq(user.email, email))
            : eq(user.mobile, mobile),
        ),
      );

    const matchedByMobile =
      matchedUsers.find((candidate) => candidate.mobile === mobile) ?? null;
    const matchedByEmail = email
      ? (matchedUsers.find((candidate) => candidate.email === email) ?? null)
      : null;

    if (
      matchedByMobile &&
      matchedByEmail &&
      matchedByMobile.id !== matchedByEmail.id
    ) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    return matchedByMobile ?? matchedByEmail;
  }

  private async ensureCampusMembership(
    tx: StaffWriter,
    membershipId: string,
    campusId: string,
  ) {
    const [existingCampusMembership] = await tx
      .select({ id: campusMemberships.id })
      .from(campusMemberships)
      .where(
        and(
          eq(campusMemberships.membershipId, membershipId),
          eq(campusMemberships.campusId, campusId),
          isNull(campusMemberships.deletedAt),
        ),
      )
      .limit(1);

    if (!existingCampusMembership) {
      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId,
        campusId,
      });
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  async listSubjectAssignments(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<SubjectTeacherAssignmentDto[]> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const rows = await this.db
      .select({
        id: subjectTeacherAssignments.id,
        subjectId: subjects.id,
        subjectName: subjects.name,
        classId: schoolClasses.id,
        className: schoolClasses.name,
        academicYearId: academicYears.id,
        academicYearName: academicYears.name,
        createdAt: subjectTeacherAssignments.createdAt,
      })
      .from(subjectTeacherAssignments)
      .innerJoin(subjects, eq(subjectTeacherAssignments.subjectId, subjects.id))
      .leftJoin(
        schoolClasses,
        eq(subjectTeacherAssignments.classId, schoolClasses.id),
      )
      .leftJoin(
        academicYears,
        eq(subjectTeacherAssignments.academicYearId, academicYears.id),
      )
      .where(
        and(
          eq(subjectTeacherAssignments.membershipId, staffId),
          eq(subjectTeacherAssignments.institutionId, institutionId),
          isNull(subjectTeacherAssignments.deletedAt),
        ),
      )
      .orderBy(asc(subjects.name));

    return rows.map((row) => ({
      ...row,
      classId: row.classId ?? null,
      className: row.className ?? null,
      academicYearId: row.academicYearId ?? null,
      academicYearName: row.academicYearName ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createSubjectAssignment(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateSubjectTeacherAssignmentDto,
  ): Promise<SubjectTeacherAssignmentDto> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    // Verify subject exists
    const [subjectRecord] = await this.db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(
        and(
          eq(subjects.id, payload.subjectId),
          eq(subjects.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!subjectRecord) {
      throw new NotFoundException("Subject not found");
    }

    // Check for duplicate
    const duplicateConditions: SQL[] = [
      eq(subjectTeacherAssignments.membershipId, staffId),
      eq(subjectTeacherAssignments.subjectId, payload.subjectId),
      isNull(subjectTeacherAssignments.deletedAt),
    ];
    if (payload.classId) {
      duplicateConditions.push(
        eq(subjectTeacherAssignments.classId, payload.classId),
      );
    } else {
      duplicateConditions.push(isNull(subjectTeacherAssignments.classId));
    }

    const [existing] = await this.db
      .select({ id: subjectTeacherAssignments.id })
      .from(subjectTeacherAssignments)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        "This subject is already assigned to this staff member",
      );
    }

    const assignmentId = randomUUID();
    await this.db.insert(subjectTeacherAssignments).values({
      id: assignmentId,
      institutionId,
      membershipId: staffId,
      subjectId: payload.subjectId,
      classId: payload.classId ?? null,
      academicYearId: payload.academicYearId ?? null,
    });

    // Fetch class and academic year names
    let className: string | null = null;
    let academicYearName: string | null = null;

    if (payload.classId) {
      const [classRecord] = await this.db
        .select({ name: schoolClasses.name })
        .from(schoolClasses)
        .where(eq(schoolClasses.id, payload.classId))
        .limit(1);
      className = classRecord?.name ?? null;
    }

    if (payload.academicYearId) {
      const [ayRecord] = await this.db
        .select({ name: academicYears.name })
        .from(academicYears)
        .where(eq(academicYears.id, payload.academicYearId))
        .limit(1);
      academicYearName = ayRecord?.name ?? null;
    }

    return {
      id: assignmentId,
      subjectId: subjectRecord.id,
      subjectName: subjectRecord.name,
      classId: payload.classId ?? null,
      className,
      academicYearId: payload.academicYearId ?? null,
      academicYearName,
      createdAt: new Date().toISOString(),
    };
  }

  async removeSubjectAssignment(
    institutionId: string,
    staffId: string,
    assignmentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<void> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const [assignment] = await this.db
      .select({ id: subjectTeacherAssignments.id })
      .from(subjectTeacherAssignments)
      .where(
        and(
          eq(subjectTeacherAssignments.id, assignmentId),
          eq(subjectTeacherAssignments.membershipId, staffId),
          eq(subjectTeacherAssignments.institutionId, institutionId),
          isNull(subjectTeacherAssignments.deletedAt),
        ),
      )
      .limit(1);

    if (!assignment) {
      throw new NotFoundException("Subject assignment not found");
    }

    await this.db
      .update(subjectTeacherAssignments)
      .set({ deletedAt: new Date() })
      .where(eq(subjectTeacherAssignments.id, assignmentId));
  }

  async resetMemberPassword(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<void> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    if (!staffMembership.userId) {
      throw new NotFoundException(ERROR_MESSAGES.STAFF.STAFF_NOT_FOUND);
    }

    await this.authService.adminResetMemberPassword(
      staffMembership.userId,
      institutionId,
    );
  }

  // ── Staff documents ───────────────────────────────────────────────────────

  async listStaffDocuments(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<StaffDocumentDto[]> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const rows = await this.db
      .select({
        id: staffDocuments.id,
        staffMemberId: staffDocuments.staffMemberId,
        documentType: staffDocuments.documentType,
        documentName: staffDocuments.documentName,
        uploadUrl: staffDocuments.uploadUrl,
        notes: staffDocuments.notes,
        createdAt: staffDocuments.createdAt,
        updatedAt: staffDocuments.updatedAt,
      })
      .from(staffDocuments)
      .where(
        and(
          eq(staffDocuments.staffMemberId, staffId),
          eq(staffDocuments.institutionId, institutionId),
        ),
      )
      .orderBy(desc(staffDocuments.createdAt));

    return rows.map((row) => ({
      ...row,
      uploadUrl: row.uploadUrl ?? null,
      notes: row.notes ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createStaffDocument(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateStaffDocumentDto,
  ): Promise<StaffDocumentDto> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const documentId = randomUUID();
    const now = new Date();

    await this.db.insert(staffDocuments).values({
      id: documentId,
      institutionId,
      staffMemberId: staffId,
      documentType: payload.documentType,
      documentName: payload.documentName,
      uploadUrl: payload.uploadUrl ?? null,
      notes: payload.notes ?? null,
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF_DOCUMENT,
        entityId: documentId,
        entityLabel: payload.documentName,
        summary: `Added staff document "${payload.documentName}".`,
      })
      .catch(() => {});

    return {
      id: documentId,
      staffMemberId: staffId,
      documentType: payload.documentType,
      documentName: payload.documentName,
      uploadUrl: payload.uploadUrl ?? null,
      notes: payload.notes ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async updateStaffDocument(
    institutionId: string,
    staffId: string,
    documentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateStaffDocumentDto,
  ): Promise<StaffDocumentDto> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const existingDoc = await this.getStaffDocument(
      institutionId,
      staffId,
      documentId,
    );

    await this.db
      .update(staffDocuments)
      .set({
        documentType: payload.documentType,
        documentName: payload.documentName,
        uploadUrl: payload.uploadUrl ?? null,
        notes: payload.notes ?? null,
      })
      .where(eq(staffDocuments.id, documentId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF_DOCUMENT,
        entityId: documentId,
        entityLabel: payload.documentName,
        summary: `Updated staff document "${payload.documentName}".`,
      })
      .catch(() => {});

    return {
      id: documentId,
      staffMemberId: staffId,
      documentType: payload.documentType,
      documentName: payload.documentName,
      uploadUrl: payload.uploadUrl ?? null,
      notes: payload.notes ?? null,
      createdAt: existingDoc.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteStaffDocument(
    institutionId: string,
    staffId: string,
    documentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<void> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const existingDoc = await this.getStaffDocument(
      institutionId,
      staffId,
      documentId,
    );

    await this.db
      .delete(staffDocuments)
      .where(eq(staffDocuments.id, documentId));

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.DELETE,
        entityType: AUDIT_ENTITY_TYPES.STAFF_DOCUMENT,
        entityId: documentId,
        entityLabel: existingDoc.documentName,
        summary: `Deleted staff document "${existingDoc.documentName}".`,
      })
      .catch(() => {});
  }

  private async getStaffDocument(
    institutionId: string,
    staffMemberId: string,
    documentId: string,
  ) {
    const [doc] = await this.db
      .select({
        id: staffDocuments.id,
        documentName: staffDocuments.documentName,
        createdAt: staffDocuments.createdAt,
      })
      .from(staffDocuments)
      .where(
        and(
          eq(staffDocuments.id, documentId),
          eq(staffDocuments.staffMemberId, staffMemberId),
          eq(staffDocuments.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!doc) {
      throw new NotFoundException(
        ERROR_MESSAGES.STAFF_DEPTH.DOCUMENT_NOT_FOUND,
      );
    }

    return { ...doc, createdAt: doc.createdAt.toISOString() };
  }

  // ── Teaching load analysis ─────────────────────────────────────────────────

  async getTeachingLoad(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<TeachingLoadResultDto> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const rows = await this.db
      .select({
        dayOfWeek: timetableEntries.dayOfWeek,
        periodIndex: timetableEntries.periodIndex,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        subjectName: subjects.name,
        className: schoolClasses.name,
        sectionName: classSections.name,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(schoolClasses, eq(timetableEntries.classId, schoolClasses.id))
      .innerJoin(
        classSections,
        eq(timetableEntries.sectionId, classSections.id),
      )
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          eq(timetableEntries.campusId, activeCampusId),
          eq(timetableEntries.staffId, staffId),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.periodIndex),
      );

    const entries: TeachingLoadEntryDto[] = rows.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      periodIndex: row.periodIndex,
      startTime: row.startTime,
      endTime: row.endTime,
      subjectName: row.subjectName,
      className: row.className,
      sectionName: row.sectionName,
      room: row.room ?? null,
    }));

    return {
      staffMemberId: staffId,
      totalPeriodsPerWeek: entries.length,
      entries,
    };
  }

  // ── Campus transfer ────────────────────────────────────────────────────────

  async listCampusTransfers(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<StaffCampusTransferDto[]> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getStaffMembership(institutionId, staffId, activeCampusScopes);

    const fromCampus = campus;

    const rows = await this.db
      .select({
        id: staffCampusTransfers.id,
        staffMemberId: staffCampusTransfers.staffMemberId,
        fromCampusId: staffCampusTransfers.fromCampusId,
        toCampusId: staffCampusTransfers.toCampusId,
        transferDate: staffCampusTransfers.transferDate,
        reason: staffCampusTransfers.reason,
        transferredByMemberId: staffCampusTransfers.transferredByMemberId,
        createdAt: staffCampusTransfers.createdAt,
      })
      .from(staffCampusTransfers)
      .where(
        and(
          eq(staffCampusTransfers.staffMemberId, staffId),
          eq(staffCampusTransfers.institutionId, institutionId),
        ),
      )
      .orderBy(desc(staffCampusTransfers.createdAt));

    if (rows.length === 0) {
      return [];
    }

    // Resolve campus names and transferrer names
    const allCampusIds = [
      ...new Set(rows.flatMap((r) => [r.fromCampusId, r.toCampusId])),
    ];
    const transferrerMemberIds = [
      ...new Set(rows.map((r) => r.transferredByMemberId)),
    ];

    const [campusRows, transferrerRows] = await Promise.all([
      this.db
        .select({ id: campus.id, name: campus.name })
        .from(campus)
        .where(inArray(campus.id, allCampusIds)),
      this.db
        .select({ id: member.id, name: user.name })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(inArray(member.id, transferrerMemberIds)),
    ]);

    const campusNameById = new Map(
      campusRows.map((c) => [c.id, c.name]),
    );
    const transferrerNameById = new Map(
      transferrerRows.map((t) => [t.id, t.name]),
    );

    return rows.map((row) => ({
      id: row.id,
      staffMemberId: row.staffMemberId,
      fromCampusId: row.fromCampusId,
      fromCampusName: campusNameById.get(row.fromCampusId) ?? "",
      toCampusId: row.toCampusId,
      toCampusName: campusNameById.get(row.toCampusId) ?? "",
      transferDate: row.transferDate,
      reason: row.reason ?? null,
      transferredByMemberId: row.transferredByMemberId,
      transferredByName: transferrerNameById.get(row.transferredByMemberId) ?? "",
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createCampusTransfer(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateCampusTransferDto,
  ): Promise<StaffCampusTransferDto> {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      activeCampusScopes,
    );

    const fromCampusId = staffMembership.primaryCampusId;

    if (!fromCampusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED,
      );
    }

    if (fromCampusId === payload.toCampusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF_DEPTH.CAMPUS_TRANSFER_SAME,
      );
    }

    // Verify destination campus exists
    const destinationCampus = await this.getCampus(
      institutionId,
      payload.toCampusId,
    );
    const sourceCampus = await this.getCampus(institutionId, fromCampusId);

    // Resolve the current user's membership id for transferredByMemberId
    const [currentMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, authSession.user.id),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!currentMember) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    const transferId = randomUUID();
    const now = new Date();

    await this.db.transaction(async (tx) => {
      // Record the transfer
      await tx.insert(staffCampusTransfers).values({
        id: transferId,
        institutionId,
        staffMemberId: staffId,
        fromCampusId,
        toCampusId: payload.toCampusId,
        transferDate: payload.transferDate,
        reason: payload.reason ?? null,
        transferredByMemberId: currentMember.id,
      });

      // Update the member's primary campus
      await tx
        .update(member)
        .set({ primaryCampusId: payload.toCampusId })
        .where(eq(member.id, staffId));

      // Ensure campus membership for the new campus
      await this.ensureCampusMembership(tx, staffId, payload.toCampusId);
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.STAFF_CAMPUS_TRANSFER,
        entityId: transferId,
        entityLabel: `${sourceCampus.name} → ${destinationCampus.name}`,
        summary: `Transferred staff from ${sourceCampus.name} to ${destinationCampus.name}.`,
      })
      .catch(() => {});

    return {
      id: transferId,
      staffMemberId: staffId,
      fromCampusId,
      fromCampusName: sourceCampus.name,
      toCampusId: payload.toCampusId,
      toCampusName: destinationCampus.name,
      transferDate: payload.transferDate,
      reason: payload.reason ?? null,
      transferredByMemberId: currentMember.id,
      transferredByName: authSession.user.name,
      createdAt: now.toISOString(),
    };
  }

  private scopeToActiveCampus(
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): ResolvedScopes {
    const activeCampusId = this.requireActiveCampusId(authSession);

    if (
      scopes.campusIds !== "all" &&
      !scopes.campusIds.includes(activeCampusId)
    ) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return {
      ...scopes,
      campusIds: [activeCampusId],
    };
  }
}
