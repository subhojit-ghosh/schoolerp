import { z } from "zod";
import { UPLOAD_ENTITY_TYPES, uploadEntityTypeSchema } from "@repo/contracts";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

const FILE_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export { FILE_UPLOAD_MAX_SIZE_BYTES, ALLOWED_MIME_TYPES };

export const uploadFileSchema = z.object({
  entityType: uploadEntityTypeSchema,
  entityId: z.uuid().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

export const listFileUploadsQuerySchema = baseListQuerySchema.extend({
  entityType: uploadEntityTypeSchema,
  entityId: z.uuid().optional(),
});

export type ListFileUploadsQuery = {
  entityType: (typeof UPLOAD_ENTITY_TYPES)[keyof typeof UPLOAD_ENTITY_TYPES];
  entityId?: string;
  page?: number;
  limit?: number;
};

export function parseUploadFileBody(body: unknown): UploadFileInput {
  return parseListQuerySchema(uploadFileSchema, body);
}

export function parseListFileUploadsQuery(
  query: unknown,
): ListFileUploadsQuery {
  const parsed = parseListQuerySchema(listFileUploadsQuerySchema, query);

  return {
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    page: parsed.page,
    limit: parsed.limit,
  };
}
