import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { CommunicationsModule } from "../communications/communications.module";
import { AdmissionFormFieldsService } from "./admission-form-fields.service";
import { AdmissionsController } from "./admissions.controller";
import { AdmissionsService } from "./admissions.service";

@Module({
  imports: [AuthModule, AuditModule, CommunicationsModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService, AdmissionFormFieldsService],
  exports: [AdmissionFormFieldsService],
})
export class AdmissionsModule {}
