import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CommunicationsModule } from "../communications/communications.module";
import { FeesController } from "./fees.controller";
import { FeesService } from "./fees.service";
import { FeeReminderService } from "./fee-reminder.service";

@Module({
  imports: [AuthModule, AuditModule, CommunicationsModule],
  controllers: [FeesController],
  providers: [FeesService, FeeReminderService],
  exports: [FeesService],
})
export class FeesModule {}
