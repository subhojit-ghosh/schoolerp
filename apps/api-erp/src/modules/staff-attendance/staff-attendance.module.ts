import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StaffAttendanceController } from "./staff-attendance.controller";
import { StaffAttendanceService } from "./staff-attendance.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [StaffAttendanceController],
  providers: [StaffAttendanceService],
})
export class StaffAttendanceModule {}
