import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ScholarshipsController } from "./scholarships.controller";
import { ScholarshipsService } from "./scholarships.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService],
  exports: [ScholarshipsService],
})
export class ScholarshipsModule {}
