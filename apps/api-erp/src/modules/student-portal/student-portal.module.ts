import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ExamsModule } from "../exams/exams.module";
import { StudentsModule } from "../students/students.module";
import { TimetableModule } from "../timetable/timetable.module";
import { StudentPortalController } from "./student-portal.controller";
import { StudentPortalService } from "./student-portal.service";

@Module({
  imports: [AuthModule, StudentsModule, ExamsModule, TimetableModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
})
export class StudentPortalModule {}
