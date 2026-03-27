import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { HostelController } from "./hostel.controller";
import { HostelService } from "./hostel.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService],
})
export class HostelModule {}
