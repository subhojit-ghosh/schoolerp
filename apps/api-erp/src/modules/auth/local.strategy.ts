import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import type { Request } from "express";
import { ERROR_MESSAGES } from "../../constants";
import { AUTH_FIELDS, AUTH_STRATEGIES } from "./auth.constants";
import { AuthService } from "./auth.service";
import { TenantContextService } from "../tenant-context/tenant-context.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGIES.LOCAL,
) {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super({
      usernameField: AUTH_FIELDS.IDENTIFIER,
      passwordField: AUTH_FIELDS.PASSWORD,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, identifier: string, password: string) {
    const tenant = await this.tenantContextService.resolveInstitutionFromHost(
      request.headers.host,
    );
    const authenticatedUser = await this.authService.validateUser(
      identifier,
      password,
      tenant?.id ?? null,
    );

    if (!authenticatedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return authenticatedUser;
  }
}
