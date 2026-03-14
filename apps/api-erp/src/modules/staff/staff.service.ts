import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  campus,
  campusMemberships,
  member,
  membershipRoles,
  roles,
  user,
} from "@repo/database";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, MEMBER_TYPES } from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import type { CreateStaffDto, UpdateStaffDto } from "./staff.schemas";

type StaffRoleSummary = {
  id: string;
  name: string;
  slug: string;
};

type StaffWriter = Pick<AppDatabase, "insert" | "select" | "update">;

@Injectable()
export class StaffService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listStaff(institutionId: string, authSession: AuthenticatedSession) {
    await this.requireInstitutionAccess(authSession, institutionId);
    return this.listStaffForInstitution(institutionId);
  }

  async listRoles(institutionId: string, authSession: AuthenticatedSession) {
    await this.requireInstitutionAccess(authSession, institutionId);
    return this.listRolesForInstitution(institutionId);
  }

  async getStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const [staffRecord] = await this.listStaffForInstitution(
      institutionId,
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
    payload: CreateStaffDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
    const selectedRole = payload.roleId
      ? await this.getRole(institutionId, payload.roleId)
      : null;

    const membershipId = await this.db.transaction(async (tx) => {
      const resolvedUser = await this.findOrCreateUser(tx, payload);

      const [existingStaffMembership] = await tx
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.organizationId, institutionId),
            eq(member.userId, resolvedUser.id),
            eq(member.memberType, MEMBER_TYPES.STAFF),
            isNull(member.deletedAt),
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

      if (selectedRole) {
        await tx.insert(membershipRoles).values({
          id: randomUUID(),
          membershipId: nextMembershipId,
          roleId: selectedRole.id,
          validFrom: new Date().toISOString().slice(0, 10),
          validTo: null,
          academicYearId: null,
        });
      }

      return nextMembershipId;
    });

    return this.getStaff(institutionId, membershipId, authSession);
  }

  async updateStaff(
    institutionId: string,
    staffId: string,
    authSession: AuthenticatedSession,
    payload: UpdateStaffDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const existingStaff = await this.getStaffMembership(institutionId, staffId);
    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
    const selectedRole = payload.roleId
      ? await this.getRole(institutionId, payload.roleId)
      : null;

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
              isNull(member.deletedAt),
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
      await this.syncMembershipRole(tx, staffId, selectedRole?.id ?? null);
    });

    return this.getStaff(institutionId, staffId, authSession);
  }

  private async listStaffForInstitution(
    institutionId: string,
    staffId?: string,
  ) {
    const staffRows = await this.db
      .select({
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
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          staffId ? eq(member.id, staffId) : undefined,
          isNull(member.deletedAt),
          isNull(campus.deletedAt),
        ),
      );

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
        and(eq(roles.institutionId, institutionId), isNull(roles.deletedAt)),
      );
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

  private async requireInstitutionAccess(
    authSession: AuthenticatedSession,
    institutionId: string,
  ) {
    await this.authService.requireOrganizationContext(
      authSession,
      institutionId,
      AUTH_CONTEXT_KEYS.STAFF,
    );
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [matchedCampus] = await this.db
      .select({
        id: campus.id,
      })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          isNull(campus.deletedAt),
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
          eq(roles.institutionId, institutionId),
          isNull(roles.deletedAt),
        ),
      )
      .limit(1);

    if (!matchedRole) {
      throw new NotFoundException(ERROR_MESSAGES.ROLES.ROLE_NOT_FOUND);
    }

    return matchedRole;
  }

  private async getStaffMembership(institutionId: string, staffId: string) {
    const [matchedStaff] = await this.db
      .select({
        id: member.id,
        userId: user.id,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.id, staffId),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          isNull(member.deletedAt),
        ),
      )
      .limit(1);

    if (!matchedStaff) {
      throw new NotFoundException(ERROR_MESSAGES.STAFF.STAFF_NOT_FOUND);
    }

    return matchedStaff;
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

      return { id: matchedUser.id };
    }

    const userId = randomUUID();

    await tx.insert(user).values({
      id: userId,
      name: payload.name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      passwordHash: await hash(randomUUID(), 12),
    });

    return { id: userId };
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

  private async syncMembershipRole(
    tx: StaffWriter,
    membershipId: string,
    roleId: string | null,
  ) {
    await tx
      .update(membershipRoles)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          isNull(membershipRoles.deletedAt),
        ),
      );

    if (!roleId) {
      return;
    }

    await tx.insert(membershipRoles).values({
      id: randomUUID(),
      membershipId,
      roleId,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: null,
      academicYearId: null,
    });
  }
}
