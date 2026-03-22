import {
  AUTH_CONTEXT_KEYS,
  AUTH_CONTEXT_LABELS,
  type AuthContextKey,
} from "@repo/contracts";
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  alias,
  and,
  campus,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  member,
  membershipRoles,
  membershipRoleScopes,
  ne,
  organization,
  or,
  passwordResetToken,
  permissions,
  rolePermissions,
  roles,
  session,
  sql,
  studentGuardianLinks,
  students,
  user,
} from "@repo/database";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Response } from "express";
import {
  AUTH_COOKIE,
  AUTH_PASSWORD_RESET,
  AUTH_RECOVERY_CHANNELS,
  ERROR_MESSAGES,
  MEMBER_TYPES,
  STATUS,
  type PermissionSlug,
} from "../../constants";
import { AUTH_COOKIE_OPTIONS } from "./auth.constants";
import {
  AuthCampusDto,
  AuthAccessContextDto,
  AuthContextDto,
  AuthLinkedStudentDto,
  AuthMembershipDto,
  AuthOrganizationDto,
  AuthStaffRoleDto,
  type AuthUserDto,
} from "./auth.dto";
import type {
  AuthContext,
  AuthenticatedAccessContext,
  AuthenticatedCampus,
  AuthenticatedLinkedStudent,
  AuthenticatedMembership,
  AuthenticatedOrganization,
  AuthenticatedSession,
  AuthenticatedStaffRole,
  AuthenticatedUser,
  IssuedPasswordSetupResult,
  PasswordResetRequestResult,
  ResolvedScopes,
  SessionAccessContext,
  SessionRequestContext,
  ValidatedUser,
} from "./auth.types";
import {
  isEmailIdentifier,
  normalizeEmail,
  normalizeMobile,
  normalizeOptionalEmail,
} from "./auth.utils";
import type { SignUpDto } from "./auth.schemas";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { PasswordResetDeliveryService } from "./password-reset-delivery.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly configService: ConfigService,
    private readonly authRateLimitService: AuthRateLimitService,
    private readonly passwordResetDeliveryService: PasswordResetDeliveryService,
  ) {}

  async signUp(
    payload: SignUpDto,
    requestContext: SessionRequestContext,
  ): Promise<AuthenticatedSession> {
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const normalizedMobile = normalizeMobile(payload.mobile);

    if (!payload.tenantSlug) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    const [resolvedOrg] = await this.database
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, payload.tenantSlug))
      .limit(1);

    if (!resolvedOrg) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    await this.assertUserIdentityAvailable(
      normalizedMobile,
      normalizedEmail,
      resolvedOrg.id,
    );

    const passwordHash = await hash(payload.password, 12);
    const userId = randomUUID();

    await this.database.insert(user).values({
      id: userId,
      institutionId: resolvedOrg.id,
      name: payload.name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      passwordHash,
    });

    const accessContext = await this.resolveSessionAccessContext(
      userId,
      payload.tenantSlug,
    );

    return this.createSession(
      {
        id: userId,
        name: payload.name.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
        institutionId: resolvedOrg.id,
      },
      requestContext,
      accessContext,
    );
  }

  async validateUser(
    identifier: string,
    password: string,
    institutionId: string | null,
  ): Promise<ValidatedUser | null> {
    const matchedUser = await this.findUserByIdentifier(
      identifier,
      institutionId,
    );

    if (!matchedUser) {
      return null;
    }

    const isValid = await compare(password, matchedUser.passwordHash);

    if (!isValid) {
      return null;
    }

    return {
      id: matchedUser.id,
      name: matchedUser.name,
      mobile: matchedUser.mobile,
      email: matchedUser.email,
      institutionId: matchedUser.institutionId,
      mustChangePassword: matchedUser.mustChangePassword,
    };
  }

  async requestPasswordReset(
    identifier: string,
    requestContext: SessionRequestContext,
  ): Promise<PasswordResetRequestResult> {
    const normalizedIdentifier = this.normalizeIdentifier(identifier);

    await this.authRateLimitService.assertForgotPasswordAllowed(
      normalizedIdentifier,
      requestContext.ipAddress,
    );

    const matchedUser = await this.findUserByIdentifier(
      normalizedIdentifier,
      null,
    );
    const token = this.createPasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);

    await this.authRateLimitService.recordForgotPasswordAttempt(
      normalizedIdentifier,
      requestContext.ipAddress,
    );

    if (!matchedUser) {
      return {
        success: true,
        resetTokenPreview: this.isPasswordResetPreviewEnabled() ? token : null,
      };
    }

    const result = await this.issuePasswordSetupForMatchedUser(
      matchedUser.id,
      matchedUser.mobile,
      matchedUser.email,
      token,
      tokenHash,
    );

    return {
      success: result.success,
      resetTokenPreview: result.resetTokenPreview,
    };
  }

  async issuePasswordSetupForUser(
    userId: string,
  ): Promise<IssuedPasswordSetupResult> {
    const [matchedUser] = await this.database
      .select({
        id: user.id,
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!matchedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const token = this.createPasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);

    return this.issuePasswordSetupForMatchedUser(
      matchedUser.id,
      matchedUser.mobile,
      matchedUser.email,
      token,
      tokenHash,
    );
  }

  async issueMustChangePasswordToken(userId: string): Promise<string> {
    const token = this.createPasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);

    await this.database
      .delete(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.userId, userId),
          isNull(passwordResetToken.consumedAt),
        ),
      );

    const expiresAt = new Date(Date.now() + AUTH_PASSWORD_RESET.TOKEN_TTL_MS);

    await this.database.insert(passwordResetToken).values({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      consumedAt: null,
    });

    return token;
  }

  async completeSetup(
    token: string,
    nextPassword: string,
    requestContext: SessionRequestContext,
  ): Promise<AuthenticatedSession> {
    const now = new Date();
    const tokenHash = this.hashPasswordResetToken(token);
    const [matchedToken] = await this.database
      .select({
        id: passwordResetToken.id,
        userId: passwordResetToken.userId,
        expiresAt: passwordResetToken.expiresAt,
        consumedAt: passwordResetToken.consumedAt,
      })
      .from(passwordResetToken)
      .where(eq(passwordResetToken.tokenHash, tokenHash))
      .limit(1);

    if (!matchedToken || matchedToken.consumedAt !== null) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_INVALID,
      );
    }

    if (matchedToken.expiresAt <= now) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_EXPIRED,
      );
    }

    const [matchedUser] = await this.database
      .select({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        institutionId: user.institutionId,
      })
      .from(user)
      .where(eq(user.id, matchedToken.userId))
      .limit(1);

    if (!matchedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const passwordHash = await hash(nextPassword, 12);

    await this.database.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          passwordHash,
          mustChangePassword: false,
          updatedAt: now,
        })
        .where(eq(user.id, matchedToken.userId));

      await tx
        .update(passwordResetToken)
        .set({ consumedAt: now })
        .where(eq(passwordResetToken.id, matchedToken.id));
    });

    const accessContext = await this.resolveSessionAccessContext(
      matchedUser.id,
    );

    return this.createSession(
      {
        id: matchedUser.id,
        name: matchedUser.name,
        mobile: matchedUser.mobile,
        email: matchedUser.email,
        institutionId: matchedUser.institutionId,
      },
      requestContext,
      accessContext,
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const [matchedUser] = await this.database
      .select({ id: user.id, passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!matchedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      matchedUser.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const passwordHash = await hash(newPassword, 12);

    await this.database
      .update(user)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(user.id, matchedUser.id));
  }

  async adminResetMemberPassword(
    userId: string,
    institutionId: string,
  ): Promise<void> {
    const [matchedUser] = await this.database
      .select({
        id: user.id,
        mobile: user.mobile,
        institutionId: user.institutionId,
      })
      .from(user)
      .where(and(eq(user.id, userId), eq(user.institutionId, institutionId)))
      .limit(1);

    if (!matchedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const passwordHash = await hash(matchedUser.mobile, 12);

    await this.database
      .update(user)
      .set({
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, matchedUser.id));
  }

  async resetPassword(token: string, nextPassword: string) {
    const now = new Date();
    const tokenHash = this.hashPasswordResetToken(token);
    const [matchedToken] = await this.database
      .select({
        id: passwordResetToken.id,
        userId: passwordResetToken.userId,
        expiresAt: passwordResetToken.expiresAt,
        consumedAt: passwordResetToken.consumedAt,
      })
      .from(passwordResetToken)
      .where(eq(passwordResetToken.tokenHash, tokenHash))
      .limit(1);

    if (!matchedToken || matchedToken.consumedAt !== null) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_INVALID,
      );
    }

    if (matchedToken.expiresAt <= now) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_EXPIRED,
      );
    }

    const passwordHash = await hash(nextPassword, 12);

    await this.database.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          passwordHash,
          mustChangePassword: false,
          updatedAt: now,
        })
        .where(eq(user.id, matchedToken.userId));

      await tx
        .update(passwordResetToken)
        .set({
          consumedAt: now,
        })
        .where(eq(passwordResetToken.id, matchedToken.id));

      await tx.delete(session).where(eq(session.userId, matchedToken.userId));
    });

    return { success: true };
  }

  async createSession(
    authenticatedUser: AuthenticatedUser,
    requestContext: SessionRequestContext,
    accessContext: SessionAccessContext = {},
  ): Promise<AuthenticatedSession> {
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTH_COOKIE.MAX_AGE_MS);

    await this.database.insert(session).values({
      id: randomUUID(),
      userId: authenticatedUser.id,
      token,
      expiresAt,
      ipAddress: requestContext.ipAddress ?? null,
      userAgent: requestContext.userAgent ?? null,
      activeOrganizationId: accessContext.activeOrganizationId ?? null,
      activeContextKey: accessContext.activeContextKey ?? null,
      activeCampusId: accessContext.activeCampusId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      token,
      expiresAt,
      user: authenticatedUser,
      activeOrganizationId: accessContext.activeOrganizationId ?? null,
      activeContextKey: accessContext.activeContextKey ?? null,
      activeCampusId: accessContext.activeCampusId ?? null,
    };
  }

  async getSession(token: string): Promise<AuthenticatedSession | null> {
    const [matchedSession] = await this.database
      .select({
        token: session.token,
        expiresAt: session.expiresAt,
        activeOrganizationId: session.activeOrganizationId,
        activeContextKey: session.activeContextKey,
        activeCampusId: session.activeCampusId,
        userId: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        institutionId: user.institutionId,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
      .limit(1);

    if (!matchedSession) {
      return null;
    }

    return this.reconcileSessionAccessContext({
      token: matchedSession.token,
      expiresAt: matchedSession.expiresAt,
      activeOrganizationId: matchedSession.activeOrganizationId,
      activeContextKey: matchedSession.activeContextKey,
      activeCampusId: matchedSession.activeCampusId,
      user: {
        id: matchedSession.userId,
        name: matchedSession.name,
        mobile: matchedSession.mobile,
        email: matchedSession.email,
        institutionId: matchedSession.institutionId,
      },
    });
  }

  async getAuthContext(token: string) {
    const authSession = await this.getSession(token);

    if (!authSession) {
      return null;
    }

    return this.buildAuthContext(authSession);
  }

  async getMembershipForOrganization(userId: string, organizationId: string) {
    const [matchedMembership] = await this.database
      .select({
        id: member.id,
        organizationId: member.organizationId,
      })
      .from(member)
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    return matchedMembership ?? null;
  }

  async setActiveCampus(token: string, campusId: string) {
    const authSession = this.requireSession(await this.getSession(token));
    const authContext = await this.buildAuthContext(authSession);
    const campusOption = authContext.campuses.find(
      (item) => item.id === campusId,
    );

    if (!campusOption) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED,
      );
    }

    await this.assertActiveCampusSelectionAllowed(authSession, campusId);

    await this.database
      .update(session)
      .set({
        activeOrganizationId: campusOption.organizationId,
        activeCampusId: campusOption.id,
      })
      .where(eq(session.token, token));

    return this.requireSession(await this.getAuthContext(token));
  }

  async setActiveContext(token: string, contextKey: AuthContextKey) {
    const authSession = this.requireSession(await this.getSession(token));
    const authContext = await this.buildAuthContext(authSession);
    const nextContext = authContext.availableContexts.find(
      (contextOption) => contextOption.key === contextKey,
    );

    if (!nextContext) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.CONTEXT_ACCESS_REQUIRED,
      );
    }

    const contextMemberships = authContext.memberships.filter(
      (membership) =>
        membership.organizationId === authSession.activeOrganizationId &&
        this.memberTypeToContextKey(membership.memberType) === nextContext.key,
    );
    const activeCampusId = authSession.activeOrganizationId
      ? await this.resolveDefaultCampusId(
          authSession.user.id,
          authSession.activeOrganizationId,
          nextContext.key,
          contextMemberships,
          authSession.activeCampusId,
        )
      : null;

    await this.database
      .update(session)
      .set({
        activeContextKey: nextContext.key,
        activeCampusId,
      })
      .where(eq(session.token, token));

    await this.database
      .update(user)
      .set({ preferredContextKey: nextContext.key })
      .where(eq(user.id, authSession.user.id));

    return this.requireSession(await this.getAuthContext(token));
  }

  async signOut(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.database.delete(session).where(eq(session.token, token));
  }

  async resolveSessionAccessContext(userId: string, tenantSlug?: string) {
    const [memberships, userRecord] = await Promise.all([
      this.listMemberships(userId),
      this.database
        .select({ preferredContextKey: user.preferredContextKey })
        .from(user)
        .where(eq(user.id, userId))
        .then((rows) => rows[0] ?? null),
    ]);

    const preferredContextKey = userRecord?.preferredContextKey ?? null;

    if (memberships.length === 0) {
      return {
        activeOrganizationId: null,
        activeContextKey: null,
        activeCampusId: null,
      };
    }

    if (tenantSlug) {
      const matchedMembership = memberships.find(
        (item) => item.organizationSlug === tenantSlug,
      );

      if (!matchedMembership) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED,
        );
      }

      const organizationMemberships = memberships.filter(
        (item) => item.organizationId === matchedMembership.organizationId,
      );
      const activeContextKey = this.resolveDefaultContextKey(
        organizationMemberships,
        preferredContextKey,
      );
      const activeCampusId = await this.resolveDefaultCampusId(
        userId,
        matchedMembership.organizationId,
        activeContextKey,
        organizationMemberships,
      );

      return {
        activeOrganizationId: matchedMembership.organizationId,
        activeContextKey,
        activeCampusId,
      };
    }

    if (memberships.length === 1) {
      const [singleMembership] = memberships;
      const activeContextKey = this.resolveDefaultContextKey(
        [singleMembership],
        preferredContextKey,
      );

      return {
        activeOrganizationId: singleMembership.organizationId,
        activeContextKey,
        activeCampusId: await this.resolveDefaultCampusId(
          userId,
          singleMembership.organizationId,
          activeContextKey,
          [singleMembership],
        ),
      };
    }

    return {
      activeOrganizationId: null,
      activeContextKey: null,
      activeCampusId: null,
    };
  }

  toContextDto(authContext: AuthContext): AuthContextDto {
    return {
      user: this.toAuthUserDto(authContext.user),
      expiresAt: authContext.expiresAt.toISOString(),
      memberships: authContext.memberships.map((membership) =>
        this.toMembershipDto(membership),
      ),
      activeOrganization: authContext.activeOrganization
        ? this.toOrganizationDto(authContext.activeOrganization)
        : null,
      availableContexts: authContext.availableContexts.map((contextOption) =>
        this.toAccessContextDto(contextOption),
      ),
      activeContext: authContext.activeContext
        ? this.toAccessContextDto(authContext.activeContext)
        : null,
      permissions: authContext.permissions,
      activeStaffRoles: authContext.activeStaffRoles.map((role) =>
        this.toStaffRoleDto(role),
      ),
      activeCampus: authContext.activeCampus
        ? this.toCampusDto(authContext.activeCampus)
        : null,
      campuses: authContext.campuses.map((campusOption) =>
        this.toCampusDto(campusOption),
      ),
      linkedStudents: authContext.linkedStudents.map((student) =>
        this.toLinkedStudentDto(student),
      ),
    };
  }

  async resolvePermissions(
    userId: string,
    institutionId: string,
  ): Promise<Set<PermissionSlug>> {
    const today = new Date().toISOString().slice(0, 10);

    const rows = await this.database
      .selectDistinct({ slug: permissions.slug })
      .from(member)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, member.id))
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
          lte(membershipRoles.validFrom, today),
          or(
            isNull(membershipRoles.validTo),
            sql`${membershipRoles.validTo} >= ${today}`,
          ),
        ),
      );

    return new Set(rows.map((r: { slug: string }) => r.slug as PermissionSlug));
  }

  async resolveScopes(
    userId: string,
    institutionId: string,
  ): Promise<ResolvedScopes> {
    const today = new Date().toISOString().slice(0, 10);

    const rows = await this.database
      .select({
        membershipRoleId: membershipRoles.id,
        scopeType: membershipRoleScopes.scopeType,
        scopeId: membershipRoleScopes.scopeId,
      })
      .from(member)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, member.id))
      .leftJoin(
        membershipRoleScopes,
        eq(membershipRoleScopes.membershipRoleId, membershipRoles.id),
      )
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
          lte(membershipRoles.validFrom, today),
          or(
            isNull(membershipRoles.validTo),
            sql`${membershipRoles.validTo} >= ${today}`,
          ),
        ),
      );

    // Group scope rows by membershipRoleId
    const byRole = new Map<
      string,
      Array<{ scopeType: string; scopeId: string }>
    >();
    for (const row of rows) {
      if (!byRole.has(row.membershipRoleId)) {
        byRole.set(row.membershipRoleId, []);
      }
      if (row.scopeType && row.scopeId) {
        byRole
          .get(row.membershipRoleId)!
          .push({ scopeType: row.scopeType, scopeId: row.scopeId });
      }
    }

    // If the user has no active role assignments, return empty scopes
    if (byRole.size === 0) {
      return { campusIds: [], classIds: [], sectionIds: [] };
    }

    // If any role has no scope rows → institution-wide → return "all"
    for (const scopeRows of byRole.values()) {
      if (scopeRows.length === 0) {
        return { campusIds: "all", classIds: "all", sectionIds: "all" };
      }
    }

    // Aggregate scopes across all roles
    let campusAll = false;
    let classAll = false;
    let sectionAll = false;
    const campusIds = new Set<string>();
    const classIds = new Set<string>();
    const sectionIds = new Set<string>();

    for (const scopeRows of byRole.values()) {
      const hasCampus = scopeRows.some((r) => r.scopeType === "campus");
      const hasClass = scopeRows.some((r) => r.scopeType === "class");
      const hasSection = scopeRows.some((r) => r.scopeType === "section");

      if (!hasCampus) campusAll = true;
      if (!hasClass) classAll = true;
      if (!hasSection) sectionAll = true;

      for (const { scopeType, scopeId } of scopeRows) {
        if (scopeType === "campus") campusIds.add(scopeId);
        if (scopeType === "class") classIds.add(scopeId);
        if (scopeType === "section") sectionIds.add(scopeId);
      }
    }

    return {
      campusIds: campusAll ? "all" : Array.from(campusIds),
      classIds: classAll ? "all" : Array.from(classIds),
      sectionIds: sectionAll ? "all" : Array.from(sectionIds),
    };
  }

  async requireOrganizationContext(
    authSession: AuthenticatedSession,
    organizationId: string,
    requiredContextKey: AuthContextKey,
  ) {
    const authContext = this.requireSession(
      await this.getAuthContext(authSession.token),
    );

    const membership = await this.getMembershipForOrganization(
      authSession.user.id,
      organizationId,
    );

    if (!membership || authContext.activeOrganization?.id !== organizationId) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    if (authContext.activeContext?.key !== requiredContextKey) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.CONTEXT_ACCESS_REQUIRED,
      );
    }

    return authContext;
  }

  writeSessionCookie(
    response: Response,
    token: string,
    expiresAt: Date,
    hostname?: string,
  ) {
    response.cookie(AUTH_COOKIE.NAME, token, {
      ...AUTH_COOKIE_OPTIONS,
      domain: this.resolveAuthCookieDomain(hostname),
      expires: expiresAt,
      secure: this.isAuthCookieSecure(),
    });
  }

  clearSessionCookie(response: Response, hostname?: string) {
    response.clearCookie(AUTH_COOKIE.NAME, {
      ...AUTH_COOKIE_OPTIONS,
      domain: this.resolveAuthCookieDomain(hostname),
      secure: this.isAuthCookieSecure(),
    });
  }

  requireSession<T>(authSession: T | null) {
    if (!authSession) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.SESSION_REQUIRED);
    }

    return authSession;
  }

  private async buildAuthContext(
    authSession: AuthenticatedSession,
  ): Promise<AuthContext> {
    const memberships = await this.listMemberships(authSession.user.id);
    const activeOrganization = authSession.activeOrganizationId
      ? await this.getOrganizationSummary(authSession.activeOrganizationId)
      : null;
    const linkedStudents = authSession.activeOrganizationId
      ? await this.listLinkedStudents(
          authSession.user.id,
          authSession.activeOrganizationId,
        )
      : [];
    const availableContexts = authSession.activeOrganizationId
      ? this.buildAvailableContexts(
          memberships.filter(
            (membership) =>
              membership.organizationId === authSession.activeOrganizationId,
          ),
        )
      : [];
    const activeContext = this.resolveActiveContext(
      authSession.activeContextKey,
      availableContexts,
    );
    const campuses =
      authSession.activeOrganizationId && activeContext
        ? await this.listAccessibleCampuses(
            authSession.user.id,
            authSession.activeOrganizationId,
            activeContext.key,
          )
        : [];
    const permissions = authSession.activeOrganizationId
      ? Array.from(
          await this.resolvePermissions(
            authSession.user.id,
            authSession.activeOrganizationId,
          ),
        ).sort()
      : [];
    const activeStaffRoles = authSession.activeOrganizationId
      ? await this.listActiveStaffRoles(
          authSession.user.id,
          authSession.activeOrganizationId,
        )
      : [];
    const accessibleCampusIds = new Set(
      campuses.map((campusOption) => campusOption.id),
    );
    const activeCampusId =
      authSession.activeCampusId &&
      accessibleCampusIds.has(authSession.activeCampusId)
        ? authSession.activeCampusId
        : null;
    const activeCampus =
      campuses.find((campusOption) => campusOption.id === activeCampusId) ??
      null;

    return {
      user: authSession.user,
      expiresAt: authSession.expiresAt,
      memberships,
      activeOrganization,
      availableContexts,
      activeContext,
      permissions,
      activeStaffRoles,
      activeCampus,
      campuses,
      linkedStudents,
    };
  }

  private async listMemberships(
    userId: string,
  ): Promise<AuthenticatedMembership[]> {
    return this.database
      .select({
        id: member.id,
        organizationId: member.organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        memberType: member.memberType,
        status: member.status,
        primaryCampusId: member.primaryCampusId,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(
        and(
          eq(member.userId, userId),
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(organization.status, STATUS.ORG.DELETED),
        ),
      );
  }

  private async listCampusSummaries(
    organizationId: string,
  ): Promise<AuthenticatedCampus[]> {
    return this.database
      .select({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        isDefault: campus.isDefault,
        status: campus.status,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );
  }

  private async listActiveStaffRoles(
    userId: string,
    organizationId: string,
  ): Promise<AuthenticatedStaffRole[]> {
    const today = new Date().toISOString().slice(0, 10);

    const roleRows = await this.database
      .select({
        id: roles.id,
        name: roles.name,
        slug: roles.slug,
        permissionCount:
          sql<number>`count(distinct ${rolePermissions.permissionId})`.mapWith(
            Number,
          ),
      })
      .from(member)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, member.id))
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
          lte(membershipRoles.validFrom, today),
          or(
            isNull(membershipRoles.validTo),
            sql`${membershipRoles.validTo} >= ${today}`,
          ),
        ),
      )
      .groupBy(roles.id, roles.name, roles.slug)
      .orderBy(
        sql`count(distinct ${rolePermissions.permissionId}) desc`,
        sql`lower(${roles.name}) asc`,
      );

    return roleRows.map(({ id, name, slug }) => ({
      id,
      name,
      slug,
    }));
  }

  private async listLinkedStudents(
    userId: string,
    organizationId: string,
  ): Promise<AuthenticatedLinkedStudent[]> {
    const studentMember = alias(member, "student_member");

    const linkedRows = await this.database
      .select({
        studentId: students.id,
        membershipId: students.membershipId,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        relationship: studentGuardianLinks.relationship,
      })
      .from(studentGuardianLinks)
      .innerJoin(member, eq(studentGuardianLinks.parentMembershipId, member.id))
      .innerJoin(
        students,
        eq(studentGuardianLinks.studentMembershipId, students.membershipId),
      )
      .innerJoin(studentMember, eq(students.membershipId, studentMember.id))
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId),
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(studentMember.status, STATUS.MEMBER.DELETED),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );

    if (linkedRows.length === 0) {
      return [];
    }

    const campusRows = await this.database
      .select({
        membershipId: member.id,
        campusId: campus.id,
        campusName: campus.name,
      })
      .from(member)
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          inArray(
            member.id,
            linkedRows.map((row) => row.membershipId),
          ),
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );

    const campusByMembershipId = new Map(
      campusRows.map((row) => [row.membershipId, row]),
    );

    const linkedStudents: AuthenticatedLinkedStudent[] = [];

    for (const row of linkedRows) {
      const campusSummary = campusByMembershipId.get(row.membershipId);

      if (!campusSummary) {
        continue;
      }

      linkedStudents.push({
        studentId: row.studentId,
        membershipId: row.membershipId,
        fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
        admissionNumber: row.admissionNumber,
        campusId: campusSummary.campusId,
        campusName: campusSummary.campusName,
        relationship: row.relationship,
      });
    }

    return linkedStudents;
  }

  private async getOrganizationSummary(
    organizationId: string,
  ): Promise<AuthenticatedOrganization | null> {
    const [row] = await this.database
      .select({
        id: organization.id,
        name: organization.name,
        shortName: organization.shortName,
        slug: organization.slug,
        institutionType: organization.institutionType,
        logoUrl: organization.logoUrl,
        faviconUrl: organization.faviconUrl,
        primaryColor: organization.primaryColor,
        accentColor: organization.accentColor,
        sidebarColor: organization.sidebarColor,
        status: organization.status,
      })
      .from(organization)
      .where(
        and(
          eq(organization.id, organizationId),
          ne(organization.status, STATUS.ORG.DELETED),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async resolveDefaultCampusId(
    userId: string,
    organizationId: string,
    activeContextKey: AuthContextKey | null,
    memberships: AuthenticatedMembership[],
    preferredCampusId?: string | null,
  ) {
    const accessibleCampusIds = await this.resolveAccessibleCampusIds(
      userId,
      organizationId,
      activeContextKey,
    );

    if (accessibleCampusIds.length === 0) {
      return null;
    }

    const prioritizedCampusIds = [
      preferredCampusId ?? null,
      ...memberships
        .map((membership) => membership.primaryCampusId)
        .filter((campusId): campusId is string => Boolean(campusId)),
    ];

    for (const campusId of prioritizedCampusIds) {
      if (campusId && accessibleCampusIds.includes(campusId)) {
        return campusId;
      }
    }

    const [defaultCampus] = await this.database
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          eq(campus.isDefault, true),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          inArray(campus.id, accessibleCampusIds),
        ),
      )
      .limit(1);

    return defaultCampus?.id ?? accessibleCampusIds[0] ?? null;
  }

  private async resolveAccessibleCampusIds(
    userId: string,
    organizationId: string,
    activeContextKey: AuthContextKey | null,
  ) {
    if (activeContextKey === AUTH_CONTEXT_KEYS.PARENT) {
      const linkedStudents = await this.listLinkedStudents(
        userId,
        organizationId,
      );

      return Array.from(
        new Set(linkedStudents.map((student) => student.campusId)),
      );
    }

    if (activeContextKey === AUTH_CONTEXT_KEYS.STUDENT) {
      return this.listStudentCampusIds(userId, organizationId);
    }

    const scopes = await this.resolveScopes(userId, organizationId);

    if (scopes.campusIds === "all") {
      const campuses = await this.listCampusSummaries(organizationId);

      return campuses.map((campusOption) => campusOption.id);
    }

    return scopes.campusIds;
  }

  private async listAccessibleCampuses(
    userId: string,
    organizationId: string,
    activeContextKey: AuthContextKey | null,
  ) {
    const accessibleCampusIds = await this.resolveAccessibleCampusIds(
      userId,
      organizationId,
      activeContextKey,
    );

    if (accessibleCampusIds.length === 0) {
      return [];
    }

    const accessibleCampusIdSet = new Set(accessibleCampusIds);
    const campuses = await this.listCampusSummaries(organizationId);

    return campuses.filter((campusOption) =>
      accessibleCampusIdSet.has(campusOption.id),
    );
  }

  private async listStudentCampusIds(userId: string, organizationId: string) {
    const studentCampusRows = await this.database
      .select({
        campusId: member.primaryCampusId,
      })
      .from(member)
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId),
          eq(member.memberType, MEMBER_TYPES.STUDENT),
          ne(member.status, STATUS.MEMBER.DELETED),
          isNotNull(member.primaryCampusId),
        ),
      );

    return Array.from(
      new Set(
        studentCampusRows
          .map((row) => row.campusId)
          .filter((campusId): campusId is string => Boolean(campusId)),
      ),
    );
  }

  private async assertActiveCampusSelectionAllowed(
    authSession: AuthenticatedSession,
    campusId: string,
  ) {
    if (!authSession.activeOrganizationId) {
      return;
    }

    const accessibleCampusIds = await this.resolveAccessibleCampusIds(
      authSession.user.id,
      authSession.activeOrganizationId,
      authSession.activeContextKey,
    );

    if (accessibleCampusIds.includes(campusId)) {
      return;
    }

    throw new UnauthorizedException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
  }

  private async reconcileSessionAccessContext(
    authSession: AuthenticatedSession,
  ): Promise<AuthenticatedSession> {
    if (!authSession.activeOrganizationId) {
      return authSession;
    }

    const memberships = await this.listMemberships(authSession.user.id);
    const organizationMemberships = memberships.filter(
      (membership) =>
        membership.organizationId === authSession.activeOrganizationId,
    );
    const activeContextKey = this.resolveDefaultContextKey(
      organizationMemberships,
      authSession.activeContextKey,
    );
    const contextMemberships = organizationMemberships.filter(
      (membership) =>
        activeContextKey !== null &&
        this.memberTypeToContextKey(membership.memberType) === activeContextKey,
    );
    const activeCampusId =
      activeContextKey === null
        ? null
        : await this.resolveDefaultCampusId(
            authSession.user.id,
            authSession.activeOrganizationId,
            activeContextKey,
            contextMemberships,
            authSession.activeCampusId,
          );

    if (
      activeContextKey === authSession.activeContextKey &&
      activeCampusId === authSession.activeCampusId
    ) {
      return authSession;
    }

    await this.database
      .update(session)
      .set({
        activeContextKey,
        activeCampusId,
      })
      .where(eq(session.token, authSession.token));

    return {
      ...authSession,
      activeContextKey,
      activeCampusId,
    };
  }

  async assertUserIdentityAvailable(
    mobile: string,
    email: string | null,
    institutionId: string,
  ) {
    const identifierCondition = email
      ? or(eq(user.mobile, mobile), eq(user.email, email))
      : eq(user.mobile, mobile);

    const [existingUser] = await this.database
      .select({
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(and(identifierCondition, eq(user.institutionId, institutionId)))
      .limit(1);

    if (existingUser?.mobile === mobile) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.MOBILE_ALREADY_EXISTS);
    }

    if (email && existingUser?.email === email) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }
  }

  private async findUserByIdentifier(
    identifier: string,
    institutionId: string | null,
  ) {
    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    const identifierCondition = isEmailIdentifier(normalizedIdentifier)
      ? eq(user.email, normalizeEmail(normalizedIdentifier))
      : eq(user.mobile, normalizeMobile(normalizedIdentifier));

    const [matchedUser] = await this.database
      .select({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        passwordHash: user.passwordHash,
        institutionId: user.institutionId,
        mustChangePassword: user.mustChangePassword,
      })
      .from(user)
      .where(
        institutionId
          ? and(identifierCondition, eq(user.institutionId, institutionId))
          : identifierCondition,
      )
      .limit(1);

    return matchedUser ?? null;
  }

  private createPasswordResetToken() {
    return randomBytes(AUTH_PASSWORD_RESET.TOKEN_BYTE_LENGTH).toString("hex");
  }

  private hashPasswordResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async issuePasswordSetupForMatchedUser(
    userId: string,
    mobile: string,
    email: string | null,
    token: string,
    tokenHash: string,
  ): Promise<IssuedPasswordSetupResult> {
    await this.database
      .delete(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.userId, userId),
          isNull(passwordResetToken.consumedAt),
        ),
      );

    const expiresAt = new Date(Date.now() + AUTH_PASSWORD_RESET.TOKEN_TTL_MS);

    await this.database.insert(passwordResetToken).values({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      consumedAt: null,
    });

    const channel = email
      ? AUTH_RECOVERY_CHANNELS.EMAIL
      : AUTH_RECOVERY_CHANNELS.MOBILE;
    const recipient = email ?? mobile;

    await this.passwordResetDeliveryService.sendPasswordReset({
      channel,
      recipient,
      token,
    });

    return {
      success: true,
      channel,
      recipient,
      resetTokenPreview: this.isPasswordResetPreviewEnabled() ? token : null,
    };
  }

  private resolveAuthCookieDomain(hostname?: string) {
    if (hostname) {
      return hostname.split(":")[0].toLowerCase();
    }
    return this.configService.get<string>("auth.cookieDomain", "erp.test");
  }

  private isAuthCookieSecure() {
    return this.configService.get<boolean>("auth.cookieSecure", true);
  }

  private isPasswordResetPreviewEnabled() {
    return this.configService.get<boolean>(
      "auth.passwordResetPreviewEnabled",
      false,
    );
  }

  private normalizeIdentifier(identifier: string) {
    const trimmedIdentifier = identifier.trim();

    return isEmailIdentifier(trimmedIdentifier)
      ? normalizeEmail(trimmedIdentifier)
      : normalizeMobile(trimmedIdentifier);
  }

  private toAuthUserDto(authenticatedUser: AuthenticatedUser): AuthUserDto {
    return {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      mobile: authenticatedUser.mobile,
      email: authenticatedUser.email,
    };
  }

  private toOrganizationDto(
    organizationSummary: AuthenticatedOrganization,
  ): AuthOrganizationDto {
    return organizationSummary;
  }

  private toCampusDto(campusSummary: AuthenticatedCampus): AuthCampusDto {
    return campusSummary;
  }

  private toMembershipDto(
    membershipSummary: AuthenticatedMembership,
  ): AuthMembershipDto {
    return membershipSummary;
  }

  private toAccessContextDto(
    contextSummary: AuthenticatedAccessContext,
  ): AuthAccessContextDto {
    return {
      key: contextSummary.key,
      label: contextSummary.label,
      membershipIds: contextSummary.membershipIds,
    };
  }

  private toLinkedStudentDto(
    linkedStudent: AuthenticatedLinkedStudent,
  ): AuthLinkedStudentDto {
    return linkedStudent;
  }

  private toStaffRoleDto(role: AuthenticatedStaffRole): AuthStaffRoleDto {
    return role;
  }

  private buildAvailableContexts(
    memberships: AuthenticatedMembership[],
  ): AuthenticatedAccessContext[] {
    const contextMap = new Map<AuthContextKey, AuthenticatedAccessContext>();

    for (const membership of memberships) {
      const contextKey = this.memberTypeToContextKey(membership.memberType);

      if (!contextKey) {
        continue;
      }

      const existingContext = contextMap.get(contextKey);

      if (existingContext) {
        existingContext.membershipIds.push(membership.id);
        continue;
      }

      contextMap.set(contextKey, {
        key: contextKey,
        label: AUTH_CONTEXT_LABELS[contextKey],
        membershipIds: [membership.id],
      });
    }

    return [
      AUTH_CONTEXT_KEYS.STAFF,
      AUTH_CONTEXT_KEYS.PARENT,
      AUTH_CONTEXT_KEYS.STUDENT,
    ]
      .map((contextKey) => contextMap.get(contextKey))
      .filter((contextOption): contextOption is AuthenticatedAccessContext =>
        Boolean(contextOption),
      );
  }

  private resolveDefaultContextKey(
    memberships: AuthenticatedMembership[],
    preferredContextKey?: AuthContextKey | null,
  ): AuthContextKey | null {
    const availableContexts = this.buildAvailableContexts(memberships);

    if (preferredContextKey) {
      const preferred = availableContexts.find(
        (c) => c.key === preferredContextKey,
      );
      if (preferred) return preferred.key;
    }

    return availableContexts[0]?.key ?? null;
  }

  private resolveActiveContext(
    activeContextKey: AuthContextKey | null,
    availableContexts: AuthenticatedAccessContext[],
  ) {
    if (availableContexts.length === 0) {
      return null;
    }

    return (
      availableContexts.find(
        (contextOption) => contextOption.key === activeContextKey,
      ) ?? availableContexts[0]
    );
  }

  private memberTypeToContextKey(
    memberType: AuthenticatedMembership["memberType"],
  ): AuthContextKey | null {
    switch (memberType) {
      case "staff":
        return AUTH_CONTEXT_KEYS.STAFF;
      case "guardian":
        return AUTH_CONTEXT_KEYS.PARENT;
      case "student":
        return AUTH_CONTEXT_KEYS.STUDENT;
      default:
        return null;
    }
  }
}
