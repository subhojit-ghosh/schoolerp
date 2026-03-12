import { Injectable } from "@nestjs/common";
import { TenantContextService } from "../tenant-context/tenant-context.service";

@Injectable()
export class PublicService {
  constructor(private readonly tenantContextService: TenantContextService) {}

  getTenantBranding(host: string | undefined, tenantQuery: string | undefined) {
    return this.tenantContextService.getTenantBranding(host, tenantQuery);
  }
}
