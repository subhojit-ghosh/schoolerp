import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StudentRolloverController } from "./student-rollover.controller";
import { StudentRolloverService } from "./student-rollover.service";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [StudentsController, StudentRolloverController],
  providers: [StudentsService, StudentRolloverService],
  exports: [StudentsService],
})
export class StudentsModule {}
