import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { CampusesController } from "./campuses.controller";
import { CampusesService } from "./campuses.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [CampusesController],
  providers: [CampusesService],
})
export class CampusesModule {}
