import { Module } from "@nestjs/common";
import { DatabaseModule } from "@repo/backend-core";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { LibraryController } from "./library.controller";
import { LibraryService } from "./library.service";

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
