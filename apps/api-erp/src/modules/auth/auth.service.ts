import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { DATABASE } from "@academic-platform/backend-core";
import type { AppDatabase } from "@academic-platform/database";
import {
  campus,
  member,
  organization,
  session,
  user,
} from "@academic-platform/database";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import type { Response } from "express";
import { AUTH_COOKIE, ERROR_MESSAGES } from "../../constants";
import { AUTH_COOKIE_OPTIONS } from "./auth.constants";
import {
  AuthCampusDto,
  AuthContextDto,
  AuthMembershipDto,
  AuthOrganizationDto,
  type AuthUserDto,
} from "./auth.dto";
import type {
  AuthContext,
  AuthenticatedCampus,
  AuthenticatedMembership,
  AuthenticatedOrganization,
  AuthenticatedSession,
  AuthenticatedUser,
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

@Injectable()
export class AuthService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

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
    const normalizedIdentifier = identifier.trim();
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
      activeCampusId: accessContext.activeCampusId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      token,
      expiresAt,
      user: authenticatedUser,
      activeOrganizationId: accessContext.activeOrganizationId ?? null,
      activeCampusId: accessContext.activeCampusId ?? null,
    };
  }

  async getSession(token: string): Promise<AuthenticatedSession | null> {
    const [matchedSession] = await this.database
      .select({
        token: session.token,
        expiresAt: session.expiresAt,
        activeOrganizationId: session.activeOrganizationId,
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
          isNull(member.deletedAt),
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

  async signOut(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.database.delete(session).where(eq(session.token, token));
  }

  async resolveSessionAccessContext(userId: string, tenantSlug?: string) {
    const memberships = await this.listMemberships(userId);

    if (memberships.length === 0) {
      return {
        activeOrganizationId: null,
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
        activeCampusId,
      };
    }

    if (memberships.length === 1) {
      const [singleMembership] = memberships;

      return {
        activeOrganizationId: singleMembership.organizationId,
        activeCampusId: await this.resolveDefaultCampusId(
          singleMembership.organizationId,
          singleMembership.primaryCampusId,
        ),
      };
    }

    return {
      activeOrganizationId: null,
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
      activeCampus: authContext.activeCampus
        ? this.toCampusDto(authContext.activeCampus)
        : null,
      campuses: authContext.campuses.map((campusOption) =>
        this.toCampusDto(campusOption),
      ),
    };
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
    const activeCampus =
      campuses.find(
        (campusOption) => campusOption.id === authSession.activeCampusId,
      ) ?? null;

    return {
      user: authSession.user,
      expiresAt: authSession.expiresAt,
      memberships,
      activeOrganization,
      activeCampus,
      campuses,
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
          isNull(member.deletedAt),
          isNull(organization.deletedAt),
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
          isNull(campus.deletedAt),
        ),
      );
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
          isNull(organization.deletedAt),
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
          isNull(campus.deletedAt),
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
}
