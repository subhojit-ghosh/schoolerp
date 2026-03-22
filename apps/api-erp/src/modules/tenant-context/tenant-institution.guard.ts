import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ERROR_MESSAGES } from "../../constants";
import { TenantContextService } from "./tenant-context.service";
import type { TenantRequest } from "./tenant-context.types";

@Injectable()
export class TenantInstitutionGuard implements CanActivate {
  constructor(private readonly tenantContextService: TenantContextService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const tenantInstitution = await this.tenantContextService.resolveInstitutionFromHost(
      request.headers.host,
    );

    if (!tenantInstitution) {
      throw new NotFoundException(ERROR_MESSAGES.TENANT.INSTITUTION_NOT_FOUND);
    }

    if (
      request.authSession?.activeOrganizationId &&
      request.authSession.activeOrganizationId !== tenantInstitution.id
    ) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    request.tenantInstitution = tenantInstitution;

    return true;
  }
}
