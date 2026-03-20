import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
