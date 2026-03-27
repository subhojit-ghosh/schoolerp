import { Module } from "@nestjs/common";
import { DatabaseModule, databaseConfig } from "@repo/backend-core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { appConfig } from "./config/app.config";
import { authConfig } from "./config/auth.config";
import { deliveryConfig } from "./config/delivery.config";
import { paymentConfig } from "./config/payment.config";
import { storageConfig } from "./config/storage.config";
import { AcademicYearsModule } from "./modules/academic-years/academic-years.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AdmissionsModule } from "./modules/admissions/admissions.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BellSchedulesModule } from "./modules/bell-schedules/bell-schedules.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { CampusesModule } from "./modules/campuses/campuses.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CommunicationsModule } from "./modules/communications/communications.module";
import { DeliverySettingsModule } from "./modules/delivery/delivery-settings.module";
import { PaymentGatewayModule } from "./modules/payment-gateway/payment-gateway.module";
import { PaymentGatewaySettingsModule } from "./modules/payment-gateway/payment-gateway-settings.module";
import { validateEnvironment } from "./config/env.validation";
import { DataExchangeModule } from "./modules/data-exchange/data-exchange.module";
import { FeesModule } from "./modules/fees/fees.module";
import { ExamsModule } from "./modules/exams/exams.module";
import { FamilyModule } from "./modules/family/family.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PublicModule } from "./modules/public/public.module";
import { RolesModule } from "./modules/roles/roles.module";
import { StaffModule } from "./modules/staff/staff.module";
import { StudentPortalModule } from "./modules/student-portal/student-portal.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { TenantContextModule } from "./modules/tenant-context/tenant-context.module";
import { TimetableModule } from "./modules/timetable/timetable.module";
import { GuardiansModule } from "./modules/guardians/guardians.module";
import { HomeworkModule } from "./modules/homework/homework.module";
import { LeaveModule } from "./modules/leave/leave.module";
import { LibraryModule } from "./modules/library/library.module";
import { TransportModule } from "./modules/transport/transport.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { StudentsModule } from "./modules/students/students.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [
        databaseConfig,
        appConfig,
        authConfig,
        deliveryConfig,
        paymentConfig,
        storageConfig,
      ],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuditModule,
    TenantContextModule,
    AuthModule,
    OnboardingModule,
    CampusesModule,
    AdmissionsModule,
    ClassesModule,
    SubjectsModule,
    BellSchedulesModule,
    TimetableModule,
    CalendarModule,
    CommunicationsModule,
    DeliverySettingsModule,
    PaymentGatewayModule,
    PaymentGatewaySettingsModule,
    DataExchangeModule,
    StudentsModule,
    FamilyModule,
    StudentPortalModule,
    StaffModule,
    GuardiansModule,
    AcademicYearsModule,
    AttendanceModule,
    ExamsModule,
    FeesModule,
    HomeworkModule,
    LeaveModule,
    LibraryModule,
    TransportModule,
    PayrollModule,
    RolesModule,
    InstitutionsModule,
    UploadsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
