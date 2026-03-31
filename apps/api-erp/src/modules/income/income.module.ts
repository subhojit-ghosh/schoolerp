import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { IncomeController } from "./income.controller";
import { IncomeService } from "./income.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [IncomeController],
  providers: [IncomeService],
  exports: [IncomeService],
})
export class IncomeModule {}
