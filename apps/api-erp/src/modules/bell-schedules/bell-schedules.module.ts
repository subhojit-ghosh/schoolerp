import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { BellSchedulesController } from "./bell-schedules.controller";
import { BellSchedulesService } from "./bell-schedules.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [BellSchedulesController],
  providers: [BellSchedulesService],
  exports: [BellSchedulesService],
})
export class BellSchedulesModule {}
