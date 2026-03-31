import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { FileUploadsController } from "./file-uploads.controller";
import { FileUploadsService } from "./file-uploads.service";
import { FILE_UPLOAD_MAX_SIZE_BYTES } from "./file-uploads.schemas";

@Module({
  imports: [
    AuthModule,
    AuditModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: FILE_UPLOAD_MAX_SIZE_BYTES },
    }),
  ],
  controllers: [FileUploadsController],
  providers: [FileUploadsService],
  exports: [FileUploadsService],
})
export class FileUploadsModule {}
