import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { TimetableController } from "./timetable.controller";
import { TimetableService } from "./timetable.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
