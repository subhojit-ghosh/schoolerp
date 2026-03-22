import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TimetableModule } from "../timetable/timetable.module";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [AuthModule, TimetableModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
