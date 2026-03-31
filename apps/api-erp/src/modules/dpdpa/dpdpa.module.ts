import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DpdpaController } from "./dpdpa.controller";
import { DpdpaService } from "./dpdpa.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DpdpaController],
  providers: [DpdpaService],
  exports: [DpdpaService],
})
export class DpdpaModule {}
