import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AUTH_COOKIE, ERROR_MESSAGES } from "../../constants";
import { AuthService } from "./auth.service";
import { TenantContextService } from "../tenant-context/tenant-context.service";
import type { AuthenticatedSession, AuthenticatedUser } from "./auth.types";
import { readCookieValue } from "./auth.utils";

type AuthenticatedRequest = Request & {
  authSession?: AuthenticatedSession;
  user?: AuthenticatedUser;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookieValue(request.cookies, AUTH_COOKIE.NAME);

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.SESSION_REQUIRED);
    }

    const authSession = await this.authService.getSession(token);

    if (!authSession) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.SESSION_REQUIRED);
    }

    // Tenant-match check: reject sessions from other institutions
    const tenant = await this.tenantContextService.resolveInstitutionFromHost(
      request.headers.host,
    );

    if (tenant && authSession.user.institutionId !== tenant.id) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.SESSION_REQUIRED);
    }

    request.authSession = authSession;
    request.user = authSession.user;

    return true;
  }
}
