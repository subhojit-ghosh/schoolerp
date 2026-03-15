import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSION_METADATA_KEY, type PermissionSlug } from "../../constants";
import { ERROR_MESSAGES } from "../../constants";
import { AuthService } from "./auth.service";
import type { AuthenticatedSession } from "./auth.types";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";

type GuardRequest = Request & {
  authSession?: AuthenticatedSession;
  tenantInstitution?: TenantInstitution;
  resolvedPermissions?: Set<PermissionSlug>;
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<PermissionSlug[]>(
      PERMISSION_METADATA_KEY,
      context.getHandler(),
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const session = request.authSession;
    const institution = request.tenantInstitution;

    if (!session || !institution) return false;

    if (!request.resolvedPermissions) {
      request.resolvedPermissions = await this.authService.resolvePermissions(
        session.user.id,
        institution.id,
      );
    }

    const hasAll = required.every((p) => request.resolvedPermissions!.has(p));

    if (!hasAll) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.PERMISSION_DENIED);
    }

    return true;
  }
}
