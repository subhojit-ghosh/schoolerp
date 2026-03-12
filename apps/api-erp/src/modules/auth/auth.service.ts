import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { DATABASE } from "@academic-platform/backend-core";
import type { AppDatabase } from "@academic-platform/database";
import { session, user } from "@academic-platform/database";
import { and, eq, gt, or } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import type { Response } from "express";
import { AUTH_COOKIE, ERROR_MESSAGES } from "../../constants";
import { AUTH_COOKIE_OPTIONS } from "./auth.constants";
import { AuthSessionDto, type AuthUserDto } from "./auth.dto";
import type {
  AuthenticatedSession,
  AuthenticatedUser,
  SessionRequestContext,
} from "./auth.types";
import {
  isEmailIdentifier,
  normalizeEmail,
  normalizeMobile,
} from "./auth.utils";
import type { SignUpDto } from "./auth.schemas";

@Injectable()
export class AuthService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  async signUp(
    payload: SignUpDto,
    requestContext: SessionRequestContext,
  ): Promise<AuthenticatedSession> {
    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedMobile = normalizeMobile(payload.mobile);

    const [existingUser] = await this.database
      .select({
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(
        or(eq(user.mobile, normalizedMobile), eq(user.email, normalizedEmail)),
      )
      .limit(1);

    if (existingUser?.mobile === normalizedMobile) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.MOBILE_ALREADY_EXISTS);
    }

    if (existingUser?.email === normalizedEmail) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await hash(payload.password, 12);
    const userId = randomUUID();

    await this.database.insert(user).values({
      id: userId,
      name: payload.name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      passwordHash,
    });

    return this.createSession(
      {
        id: userId,
        name: payload.name.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
      },
      requestContext,
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
  ): Promise<AuthenticatedSession> {
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTH_COOKIE.MAX_AGE_MS);

    await this.database.insert(session).values({
      id: randomUUID(),
      userId: authenticatedUser.id,
      token,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: requestContext.ipAddress ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    return {
      token,
      expiresAt,
      user: authenticatedUser,
    };
  }

  async getSession(token: string): Promise<AuthenticatedSession | null> {
    const [matchedSession] = await this.database
      .select({
        token: session.token,
        expiresAt: session.expiresAt,
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
      user: {
        id: matchedSession.userId,
        name: matchedSession.name,
        mobile: matchedSession.mobile,
        email: matchedSession.email,
      },
    };
  }

  async signOut(token: string | undefined) {
    if (!token) {
      return;
    }

    await this.database.delete(session).where(eq(session.token, token));
  }

  toSessionDto(authSession: AuthenticatedSession): AuthSessionDto {
    return {
      user: this.toAuthUserDto(authSession.user),
      expiresAt: authSession.expiresAt.toISOString(),
    };
  }

  writeSessionCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(AUTH_COOKIE.NAME, token, {
      ...AUTH_COOKIE_OPTIONS,
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
    });
  }

  clearSessionCookie(response: Response) {
    response.clearCookie(AUTH_COOKIE.NAME, {
      ...AUTH_COOKIE_OPTIONS,
      secure: process.env.NODE_ENV === "production",
    });
  }

  requireSession(authSession: AuthenticatedSession | null) {
    if (!authSession) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.SESSION_REQUIRED);
    }

    return authSession;
  }

  private toAuthUserDto(authenticatedUser: AuthenticatedUser): AuthUserDto {
    return {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      mobile: authenticatedUser.mobile,
      email: authenticatedUser.email,
    };
  }
}
