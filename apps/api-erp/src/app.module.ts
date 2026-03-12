import { Module } from "@nestjs/common";
import {
  DatabaseModule,
  databaseConfig,
} from "@academic-platform/backend-core";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AcademicYearsModule } from "./modules/academic-years/academic-years.module";
import { validateEnvironment } from "./config/env.validation";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { PublicModule } from "./modules/public/public.module";

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
    AcademicYearsModule,
    InstitutionsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
