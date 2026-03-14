import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { TenantInstitution, TenantRequest } from "./tenant-context.types";

export const CurrentInstitution = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): TenantInstitution | undefined => {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    return request.tenantInstitution;
  },
);
