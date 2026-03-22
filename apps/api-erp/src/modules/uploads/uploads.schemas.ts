import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  UPLOAD_FOLDERS,
  UPLOAD_ALLOWED_IMAGE_TYPES,
  UPLOAD_MAX_FILE_SIZE,
} from "./uploads.constants";

export const presignUploadSchema = z.object({
  folder: z.enum([
    UPLOAD_FOLDERS.BRANDING_LOGO,
    UPLOAD_FOLDERS.BRANDING_FAVICON,
    UPLOAD_FOLDERS.AVATAR,
  ]),
  contentType: z.enum(
    UPLOAD_ALLOWED_IMAGE_TYPES as unknown as [string, ...string[]],
  ),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(UPLOAD_MAX_FILE_SIZE, "File size exceeds 5 MB limit"),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export function parsePresignUpload(value: unknown): PresignUploadInput {
  const result = presignUploadSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}
