import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AUTH_COOKIE, ERROR_MESSAGES } from "../../constants";
import { AuthService } from "./auth.service";
import type { AuthenticatedSession, AuthenticatedUser } from "./auth.types";
import { readCookieValue } from "./auth.utils";

type AuthenticatedRequest = Request & {
  authSession?: AuthenticatedSession;
  user?: AuthenticatedUser;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

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

    request.authSession = authSession;
    request.user = authSession.user;

    return true;
  }
}
