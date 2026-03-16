import { Module } from "@nestjs/common";
import { DatabaseModule, databaseConfig } from "@repo/backend-core";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { authConfig } from "./config/auth.config";
import { AcademicYearsModule } from "./modules/academic-years/academic-years.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AdmissionsModule } from "./modules/admissions/admissions.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CampusesModule } from "./modules/campuses/campuses.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { validateEnvironment } from "./config/env.validation";
import { FeesModule } from "./modules/fees/fees.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PublicModule } from "./modules/public/public.module";
import { RolesModule } from "./modules/roles/roles.module";
import { StaffModule } from "./modules/staff/staff.module";
import { TenantContextModule } from "./modules/tenant-context/tenant-context.module";
import { GuardiansModule } from "./modules/guardians/guardians.module";
import { StudentsModule } from "./modules/students/students.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [databaseConfig, authConfig],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    TenantContextModule,
    AuthModule,
    OnboardingModule,
    CampusesModule,
    AdmissionsModule,
    ClassesModule,
    StudentsModule,
    StaffModule,
    GuardiansModule,
    AcademicYearsModule,
    AttendanceModule,
    ExamsModule,
    FeesModule,
    RolesModule,
    InstitutionsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
