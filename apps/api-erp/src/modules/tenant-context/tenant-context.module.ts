import { Module } from "@nestjs/common";
import { TenantContextService } from "./tenant-context.service";
import { TenantInstitutionGuard } from "./tenant-institution.guard";

@Module({
  providers: [TenantContextService, TenantInstitutionGuard],
  exports: [TenantContextService, TenantInstitutionGuard],
})
export class TenantContextModule {}
