import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdmissionFormFieldsService } from "./admission-form-fields.service";
import { AdmissionsController } from "./admissions.controller";
import { AdmissionsService } from "./admissions.service";

@Module({
  imports: [AuthModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService, AdmissionFormFieldsService],
  exports: [AdmissionFormFieldsService],
})
export class AdmissionsModule {}
