import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { FeesController } from "./fees.controller";
import { FeesService } from "./fees.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
