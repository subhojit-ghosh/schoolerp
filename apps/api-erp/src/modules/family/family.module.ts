import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StudentsModule } from "../students/students.module";
import { FamilyController } from "./family.controller";
import { FamilyService } from "./family.service";

@Module({
  imports: [AuthModule, StudentsModule],
  controllers: [FamilyController],
  providers: [FamilyService],
})
export class FamilyModule {}
