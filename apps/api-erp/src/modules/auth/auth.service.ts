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
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  campus,
  member,
  organization,
  passwordResetToken,
  session,
  studentGuardianLinks,
  students,
  user,
} from "@repo/database";
import { and, eq, gt, inArray, isNull, ne, or } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Response } from "express";
import {
  AUTH_COOKIE,
  AUTH_PASSWORD_RESET,
  AUTH_RECOVERY_CHANNELS,
  ERROR_MESSAGES,
  STATUS,
} from "../../constants";
import { AUTH_COOKIE_OPTIONS } from "./auth.constants";
import {
  AuthCampusDto,
  AuthAccessContextDto,
  AuthContextDto,
  AuthLinkedStudentDto,
  AuthMembershipDto,
  AuthOrganizationDto,
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
  AuthenticatedUser,
  PasswordResetRequestResult,
  SessionAccessContext,
  SessionRequestContext,
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
    private readonly authRateLimitService: AuthRateLimitService,
    private readonly passwordResetDeliveryService: PasswordResetDeliveryService,
  ) {}

  async signUp(
    payload: SignUpDto,
    requestContext: SessionRequestContext,
  ): Promise<AuthenticatedSession> {
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const normalizedMobile = normalizeMobile(payload.mobile);

    await this.assertUserIdentityAvailable(normalizedMobile, normalizedEmail);

    const passwordHash = await hash(payload.password, 12);
    const userId = randomUUID();

    await this.database.insert(user).values({
      id: userId,
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
      },
      requestContext,
      accessContext,
    );
  }

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const matchedUser = await this.findUserByIdentifier(identifier);

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

    const matchedUser = await this.findUserByIdentifier(normalizedIdentifier);
    const token = this.createPasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);

    await this.authRateLimitService.recordForgotPasswordAttempt(
      normalizedIdentifier,
      requestContext.ipAddress,
    );

    if (!matchedUser) {
      return {
        success: true,
        resetTokenPreview: AUTH_PASSWORD_RESET.PREVIEW_ENABLED ? token : null,
      };
    }

    await this.database
      .delete(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.userId, matchedUser.id),
          isNull(passwordResetToken.consumedAt),
        ),
      );

    const expiresAt = new Date(Date.now() + AUTH_PASSWORD_RESET.TOKEN_TTL_MS);

    await this.database.insert(passwordResetToken).values({
      id: randomUUID(),
      userId: matchedUser.id,
      tokenHash,
      expiresAt,
      consumedAt: null,
    });

    this.passwordResetDeliveryService.sendPasswordReset({
      channel: matchedUser.email
        ? AUTH_RECOVERY_CHANNELS.EMAIL
        : AUTH_RECOVERY_CHANNELS.MOBILE,
      recipient: matchedUser.email ?? matchedUser.mobile,
      token,
    });

    return {
      success: true,
      resetTokenPreview: AUTH_PASSWORD_RESET.PREVIEW_ENABLED ? token : null,
    };
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
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
      .limit(1);

    if (!matchedSession) {
      return null;
    }

    return {
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
      },
    };
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

    await this.database
      .update(session)
      .set({ activeContextKey: nextContext.key })
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

      const activeCampusId = await this.resolveDefaultCampusId(
        matchedMembership.organizationId,
        matchedMembership.primaryCampusId,
      );

      return {
        activeOrganizationId: matchedMembership.organizationId,
        activeContextKey: this.resolveDefaultContextKey(
          memberships.filter(
            (item) => item.organizationId === matchedMembership.organizationId,
          ),
          preferredContextKey,
        ),
        activeCampusId,
      };
    }

    if (memberships.length === 1) {
      const [singleMembership] = memberships;

      return {
        activeOrganizationId: singleMembership.organizationId,
        activeContextKey: this.resolveDefaultContextKey(
          [singleMembership],
          preferredContextKey,
        ),
        activeCampusId: await this.resolveDefaultCampusId(
          singleMembership.organizationId,
          singleMembership.primaryCampusId,
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

  writeSessionCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(AUTH_COOKIE.NAME, token, {
      ...AUTH_COOKIE_OPTIONS,
      expires: expiresAt,
      secure: AUTH_COOKIE.SECURE,
    });
  }

  clearSessionCookie(response: Response) {
    response.clearCookie(AUTH_COOKIE.NAME, {
      ...AUTH_COOKIE_OPTIONS,
      secure: AUTH_COOKIE.SECURE,
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
    const campuses = authSession.activeOrganizationId
      ? await this.listCampusSummaries(authSession.activeOrganizationId)
      : [];
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
    const activeCampus =
      campuses.find(
        (campusOption) => campusOption.id === authSession.activeCampusId,
      ) ?? null;

    return {
      user: authSession.user,
      expiresAt: authSession.expiresAt,
      memberships,
      activeOrganization,
      availableContexts,
      activeContext,
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

  private async listLinkedStudents(
    userId: string,
    organizationId: string,
  ): Promise<AuthenticatedLinkedStudent[]> {
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
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId),
          ne(member.status, STATUS.MEMBER.DELETED),
          isNull(studentGuardianLinks.deletedAt),
          isNull(students.deletedAt),
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
    organizationId: string,
    primaryCampusId: string | null,
  ) {
    if (primaryCampusId) {
      return primaryCampusId;
    }

    const [defaultCampus] = await this.database
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          eq(campus.isDefault, true),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    return defaultCampus?.id ?? null;
  }

  async assertUserIdentityAvailable(mobile: string, email: string | null) {
    const [existingUser] = await this.database
      .select({
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(
        email
          ? or(eq(user.mobile, mobile), eq(user.email, email))
          : eq(user.mobile, mobile),
      )
      .limit(1);

    if (existingUser?.mobile === mobile) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.MOBILE_ALREADY_EXISTS);
    }

    if (email && existingUser?.email === email) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }
  }

  private async findUserByIdentifier(identifier: string) {
    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    const [matchedUser] = await this.database
      .select({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        passwordHash: user.passwordHash,
      })
      .from(user)
      .where(
        isEmailIdentifier(normalizedIdentifier)
          ? eq(user.email, normalizeEmail(normalizedIdentifier))
          : eq(user.mobile, normalizeMobile(normalizedIdentifier)),
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
