import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PermissionsController, RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RolesController, PermissionsController],
  providers: [RolesService],
})
export class RolesModule {}
