import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PtmController } from "./ptm.controller";
import { PtmService } from "./ptm.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PtmController],
  providers: [PtmService],
})
export class PtmModule {}
