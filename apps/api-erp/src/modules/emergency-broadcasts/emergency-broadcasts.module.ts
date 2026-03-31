import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { EmergencyBroadcastsController } from "./emergency-broadcasts.controller";
import { EmergencyBroadcastsService } from "./emergency-broadcasts.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [EmergencyBroadcastsController],
  providers: [EmergencyBroadcastsService],
  exports: [EmergencyBroadcastsService],
})
export class EmergencyBroadcastsModule {}
