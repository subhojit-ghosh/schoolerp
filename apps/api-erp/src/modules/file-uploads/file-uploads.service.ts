import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  count,
  desc,
  eq,
  fileUploads,
  type AppDatabase,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { ERROR_MESSAGES } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import type {
  ListFileUploadsQuery,
  UploadFileInput,
} from "./file-uploads.schemas";
import {
  FILE_UPLOAD_MAX_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from "./file-uploads.schemas";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

@Injectable()
export class FileUploadsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async uploadFile(
    institutionId: string,
    authSession: AuthenticatedSession,
    input: UploadFileInput,
    file: Express.Multer.File,
  ) {
    this.validateFile(file);

    const fileId = randomUUID();
    const ext =
      path.extname(file.originalname) || this.mimeToExt(file.mimetype);
    const uploadDir = this.getUploadPath(institutionId, input.entityType);
    const filename = `${fileId}${ext}`;
    const storagePath = path.join(institutionId, input.entityType, filename);
    const fullPath = path.join(uploadDir, filename);

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(fullPath, file.buffer);

    const [record] = await this.db
      .insert(fileUploads)
      .values({
        id: fileId,
        institutionId,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        originalFilename: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedByUserId: authSession.user.id,
      })
      .returning();

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.FILE_UPLOAD,
        entityId: fileId,
        entityLabel: file.originalname,
        summary: `Uploaded file ${file.originalname}.`,
      })
      .catch(() => {});

    return this.formatRecord(record);
  }

  async getFile(institutionId: string, fileId: string) {
    const [record] = await this.db
      .select()
      .from(fileUploads)
      .where(
        and(
          eq(fileUploads.id, fileId),
          eq(fileUploads.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!record) {
      throw new NotFoundException(ERROR_MESSAGES.FILE_UPLOADS.FILE_NOT_FOUND);
    }

    return this.formatRecord(record);
  }

  getAbsoluteFilePath(storagePath: string) {
    return path.join(UPLOADS_ROOT, storagePath);
  }

  async deleteFile(
    institutionId: string,
    fileId: string,
    authSession: AuthenticatedSession,
  ) {
    const record = await this.getFile(institutionId, fileId);
    const fullPath = this.getAbsoluteFilePath(record.storagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await this.db
      .delete(fileUploads)
      .where(
        and(
          eq(fileUploads.id, fileId),
          eq(fileUploads.institutionId, institutionId),
        ),
      );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.DELETE,
        entityType: AUDIT_ENTITY_TYPES.FILE_UPLOAD,
        entityId: fileId,
        entityLabel: record.originalFilename,
        summary: `Deleted file ${record.originalFilename}.`,
      })
      .catch(() => {});
  }

  async listFiles(institutionId: string, query: ListFileUploadsQuery) {
    const pageSize = resolveTablePageSize(query.limit);
    const conditions = [
      eq(fileUploads.institutionId, institutionId),
      eq(fileUploads.entityType, query.entityType),
    ];

    if (query.entityId) {
      conditions.push(eq(fileUploads.entityId, query.entityId));
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(fileUploads)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select()
      .from(fileUploads)
      .where(where)
      .orderBy(desc(fileUploads.createdAt))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => this.formatRecord(row)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  private getUploadPath(institutionId: string, entityType: string) {
    return path.join(UPLOADS_ROOT, institutionId, entityType);
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > FILE_UPLOAD_MAX_SIZE_BYTES) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_UPLOADS.FILE_TOO_LARGE);
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.FILE_UPLOADS.INVALID_FILE_TYPE,
      );
    }
  }

  private mimeToExt(mime: string): string {
    const mapping: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
    };

    return mapping[mime] ?? ".bin";
  }

  private formatRecord(record: typeof fileUploads.$inferSelect) {
    return {
      id: record.id,
      institutionId: record.institutionId,
      entityType: record.entityType,
      entityId: record.entityId,
      originalFilename: record.originalFilename,
      storagePath: record.storagePath,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      uploadedByUserId: record.uploadedByUserId,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
