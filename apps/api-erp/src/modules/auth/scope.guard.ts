import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedSession } from "./auth.types";
import type { ResolvedScopes } from "./auth.types";
import { AuthService } from "./auth.service";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";

type GuardRequest = Request & {
  authSession?: AuthenticatedSession;
  tenantInstitution?: TenantInstitution;
  resolvedScopes?: ResolvedScopes;
};

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuardRequest>();
    const session = request.authSession;
    const institution = request.tenantInstitution;

    if (!session || !institution) return true;

    if (!request.resolvedScopes) {
      request.resolvedScopes = await this.authService.resolveScopes(
        session.user.id,
        institution.id,
      );
    }

    return true;
  }
}
