import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StudentsModule } from "../students/students.module";
import { TimetableModule } from "../timetable/timetable.module";
import { FamilyController } from "./family.controller";
import { FamilyService } from "./family.service";

@Module({
  imports: [AuthModule, StudentsModule, TimetableModule],
  controllers: [FamilyController],
  providers: [FamilyService],
})
export class FamilyModule {}
