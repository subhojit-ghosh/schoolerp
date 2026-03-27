import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { LeaveModule } from "../leave/leave.module";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";

@Module({
  imports: [AuthModule, AuditModule, LeaveModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
