import { Module } from "@nestjs/common";
import { DatabaseModule, databaseConfig } from "@repo/backend-core";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AcademicYearsModule } from "./modules/academic-years/academic-years.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CampusesModule } from "./modules/campuses/campuses.module";
import { validateEnvironment } from "./config/env.validation";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PublicModule } from "./modules/public/public.module";
import { TenantContextModule } from "./modules/tenant-context/tenant-context.module";
import { StudentsModule } from "./modules/students/students.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [databaseConfig],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    TenantContextModule,
    AuthModule,
    OnboardingModule,
    CampusesModule,
    StudentsModule,
    AcademicYearsModule,
    AttendanceModule,
    InstitutionsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
