import { Module } from "@nestjs/common";
import { DatabaseModule } from "@repo/backend-core";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { TransportController } from "./transport.controller";
import { TransportService } from "./transport.service";

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
