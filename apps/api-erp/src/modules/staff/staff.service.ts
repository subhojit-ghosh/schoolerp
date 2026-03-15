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
  attendanceRecords,
  campus,
  campusMemberships,
  classSections,
  member,
  membershipRoleScopes,
  membershipRoles,
  roles,
  schoolClasses,
  user,
} from "@repo/database";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
  SCOPE_TYPES,
} from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type {
  AuthenticatedSession,
  IssuedPasswordSetupResult,
  ResolvedScopes,
} from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import { AuthService } from "../auth/auth.service";
import type {
  CreateStaffResultDto,
  StaffDto,
  StaffRoleAssignmentDto,
  StaffRoleAssignmentScopeDto,
} from "./staff.dto";
import type {
  CreateStaffDto,
  CreateStaffRoleAssignmentDto,
  ListStaffQueryDto,
  SetStaffStatusDto,
  UpdateStaffDto,
} from "./staff.schemas";
import { sortableStaffColumns } from "./staff.schemas";

type StaffRoleSummary = {
  id: string;
  name: string;
  slug: string;
};

type StaffWriter = Pick<
  AppDatabase,
  "delete" | "insert" | "select" | "update"
>;

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
  name: user.name,
  status: member.status,
} as const;

@Injectable()
export class StaffService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listStaff(
    institutionId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListStaffQueryDto = {},
  ): Promise<PaginatedResult<StaffDto>> {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableStaffColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.STAFF),
      ne(member.status, STATUS.MEMBER.DELETED),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    const campusFilter = campusScopeFilter(member.primaryCampusId, scopes);
    if (campusFilter) conditions.push(campusFilter);

    if (query.search) {
      conditions.push(
        or(
          ilike(user.name, `%${query.search}%`),
          ilike(user.mobile, `%${query.search}%`),
          ilike(user.email, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const staffRows = await this.db
      .select(this.staffSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(where)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(user.name))
      .limit(pageSize)
      .offset(pagination.offset);

    const roleByMembershipId = await this.listRoleMap(
      staffRows.map((row) => row.id),
    );

    return {
      rows: staffRows.map((row) => ({
        ...row,
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
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<StaffRoleAssignmentDto[]> {
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      scopes,
    );

    return this.listRoleAssignmentsForMembership(staffMembership.id);
  }

  async getStaff(
    institutionId: string,
    staffId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const [staffRecord] = await this.listStaffForInstitution(
      institutionId,
      scopes,
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
    this.assertRequestedScopeWithinAssignerScopes(
      { campusId: payload.campusId },
      scopes,
    );

    const selectedCampus = await this.getCampus(institutionId, payload.campusId);

    const createResult = await this.db.transaction(async (tx) => {
      const resolvedUser = await this.findOrCreateUser(tx, payload);

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
      scopes,
    );

    let passwordSetup: IssuedPasswordSetupResult | null = null;

    if (createResult.createdNewUser) {
      passwordSetup = await this.authService.issuePasswordSetupForUser(
        createResult.userId,
      );
    }

    return {
      staff,
      passwordSetup,
    };
  }

  async updateStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateStaffDto,
  ) {
    const existingStaff = await this.getStaffMembership(
      institutionId,
      staffId,
      scopes,
    );

    this.assertRequestedScopeWithinAssignerScopes(
      { campusId: payload.campusId },
      scopes,
    );

    const selectedCampus = await this.getCampus(institutionId, payload.campusId);

    await this.db.transaction(async (tx) => {
      const resolvedUserId = await this.reconcileUserIdentity(
        tx,
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
    });

    return this.getStaff(institutionId, staffId, authSession, scopes);
  }

  async setStaffStatus(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetStaffStatusDto,
  ) {
    await this.getStaffMembership(institutionId, staffId, scopes);

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

    return this.getStaff(institutionId, staffId, authSession, scopes);
  }

  async deleteStaff(
    institutionId: string,
    staffId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      scopes,
    );

    await this.assertStaffRemovable(institutionId, staffMembership.id);

    await this.db.transaction(async (tx) => {
      const activeAssignments = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(
          and(
            eq(membershipRoles.membershipId, staffMembership.id),
            isNull(membershipRoles.deletedAt),
          ),
        );

      if (activeAssignments.length > 0) {
        const assignmentIds = activeAssignments.map((assignment) => assignment.id);

        await tx
          .delete(membershipRoleScopes)
          .where(inArray(membershipRoleScopes.membershipRoleId, assignmentIds));

        await tx
          .update(membershipRoles)
          .set({ deletedAt: new Date() })
          .where(inArray(membershipRoles.id, assignmentIds));
      }

      await tx
        .update(campusMemberships)
        .set({ deletedAt: new Date() })
        .where(eq(campusMemberships.membershipId, staffMembership.id));

      await tx
        .update(member)
        .set({
          status: STATUS.MEMBER.DELETED,
          deletedAt: new Date(),
        })
        .where(eq(member.id, staffMembership.id));
    });
  }

  async createRoleAssignment(
    institutionId: string,
    staffId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateStaffRoleAssignmentDto,
  ) {
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      scopes,
    );
    const selectedRole = await this.getRole(institutionId, payload.roleId);
    const normalizedScope = await this.resolveAssignmentScope(
      institutionId,
      payload,
    );

    this.assertRequestedScopeWithinAssignerScopes(normalizedScope, scopes);
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

    const createdAssignment = assignments.find((item) => item.id === assignmentId);
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
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const staffMembership = await this.getStaffMembership(
      institutionId,
      staffId,
      scopes,
    );

    const [assignment] = await this.db
      .select({ id: membershipRoles.id })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.id, assignmentId),
          eq(membershipRoles.membershipId, staffMembership.id),
          isNull(membershipRoles.deletedAt),
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
        .update(membershipRoles)
        .set({ deletedAt: new Date() })
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

    const visibleCampusFilter = campusScopeFilter(member.primaryCampusId, scopes);
    if (visibleCampusFilter) {
      conditions.push(visibleCampusFilter);
    }

    const staffRows = await this.db
      .select(this.staffSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(and(...conditions));

    const roleByMembershipId = await this.listRoleMap(
      staffRows.map((row) => row.id),
    );

    return staffRows.map((row) => ({
      ...row,
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
          or(isNull(roles.institutionId), eq(roles.institutionId, institutionId)),
          isNull(roles.deletedAt),
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
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          isNull(membershipRoles.deletedAt),
          isNull(roles.deletedAt),
        ),
      )
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

    const campusNameById = new Map(campusRows.map((item) => [item.id, item.name]));
    const classNameById = new Map(classRows.map((item) => [item.id, item.name]));
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
      .where(
        and(
          inArray(membershipRoles.membershipId, membershipIds),
          isNull(membershipRoles.deletedAt),
          isNull(roles.deletedAt),
        ),
      );

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
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    memberType: member.memberType,
    campusId: campus.id,
    campusName: campus.name,
    status: member.status,
  };

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
          or(isNull(roles.institutionId), eq(roles.institutionId, institutionId)),
          isNull(roles.deletedAt),
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

    const visibleCampusFilter = campusScopeFilter(member.primaryCampusId, scopes);
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

    if (selectedCampus && selectedClass && selectedClass.campusId !== selectedCampus.id) {
      throw new BadRequestException(
        ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_SCOPE_MISMATCH,
      );
    }

    if (selectedClass && selectedSection && selectedSection.classId !== selectedClass.id) {
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
          isNull(membershipRoles.deletedAt),
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
        throw new ConflictException(ERROR_MESSAGES.STAFF.ROLE_ASSIGNMENT_EXISTS);
      }
    }
  }

  private buildScopeKey(scope: ScopeInput) {
    return [scope.campusId ?? "", scope.classId ?? "", scope.sectionId ?? ""].join(
      "::",
    );
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

  private async findOrCreateUser(tx: StaffWriter, payload: CreateStaffDto) {
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const matchedUser = await this.findUserByIdentity(
      tx,
      normalizedMobile,
      normalizedEmail,
    );

    if (matchedUser) {
      await tx
        .update(user)
        .set({
          name: payload.name.trim(),
          mobile: normalizedMobile,
          email: normalizedEmail,
        })
        .where(eq(user.id, matchedUser.id));

      return { id: matchedUser.id, createdNewUser: false };
    }

    const userId = randomUUID();

    await tx.insert(user).values({
      id: userId,
      name: payload.name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      passwordHash: await hash(randomUUID(), 12),
    });

    return { id: userId, createdNewUser: true };
  }

  private async reconcileUserIdentity(
    tx: StaffWriter,
    currentUserId: string,
    payload: UpdateStaffDto,
  ) {
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const matchedUser = await this.findUserByIdentity(
      tx,
      normalizedMobile,
      normalizedEmail,
    );

    if (matchedUser && matchedUser.id !== currentUserId) {
      await tx
        .update(user)
        .set({
          name: payload.name.trim(),
          mobile: normalizedMobile,
          email: normalizedEmail,
        })
        .where(eq(user.id, matchedUser.id));

      return matchedUser.id;
    }

    await tx
      .update(user)
      .set({
        name: payload.name.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
      })
      .where(eq(user.id, currentUserId));

    return currentUserId;
  }

  private async findUserByIdentity(
    tx: StaffWriter,
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
        email
          ? or(eq(user.mobile, mobile), eq(user.email, email))
          : eq(user.mobile, mobile),
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
}
