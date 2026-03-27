import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { HomeworkController } from "./homework.controller";
import { HomeworkService } from "./homework.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
