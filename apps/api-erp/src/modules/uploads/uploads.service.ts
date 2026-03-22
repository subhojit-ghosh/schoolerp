import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageConfig } from "../../config/storage.config";
import {
  UPLOAD_FOLDERS,
  PRESIGNED_URL_EXPIRY_SECONDS,
} from "./uploads.constants";
import type { PresignUploadInput } from "./uploads.schemas";

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

@Injectable()
export class UploadsService {
  private s3: S3Client | null = null;
  private static readonly REQUEST_CHECKSUM_MODE = "WHEN_REQUIRED";
  private static readonly RESPONSE_CHECKSUM_MODE = "WHEN_REQUIRED";

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: ReturnType<typeof storageConfig>,
  ) {
    if (this.config.r2AccountId && this.config.r2AccessKeyId) {
      this.s3 = new S3Client({
        endpoint: `https://${this.config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.r2AccessKeyId,
          secretAccessKey: this.config.r2SecretAccessKey,
        },
        region: "auto",
        requestChecksumCalculation: UploadsService.REQUEST_CHECKSUM_MODE,
        responseChecksumValidation: UploadsService.RESPONSE_CHECKSUM_MODE,
      });
    }
  }

  async presignUpload(
    input: PresignUploadInput,
    institutionId: string,
    userId: string,
  ) {
    if (!this.s3) {
      throw new ServiceUnavailableException(
        "File storage is not configured. Set R2 environment variables.",
      );
    }

    const key = this.buildObjectKey(
      input.folder,
      input.contentType,
      institutionId,
      userId,
    );

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: key,
        ContentType: input.contentType,
        CacheControl: "public, max-age=3600",
      }),
      { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS },
    );

    const publicUrl = `${this.config.r2PublicUrl}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  async deleteObjectByPublicUrl(publicUrl: string | null | undefined) {
    const key = this.extractObjectKeyFromPublicUrl(publicUrl);

    if (!key) {
      return;
    }

    if (!this.s3) {
      throw new ServiceUnavailableException(
        "File storage is not configured. Set R2 environment variables.",
      );
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: key,
      }),
    );
  }

  private buildObjectKey(
    folder: string,
    contentType: string,
    institutionId: string,
    userId: string,
  ): string {
    const ext = CONTENT_TYPE_TO_EXT[contentType] ?? "bin";

    switch (folder) {
      case UPLOAD_FOLDERS.BRANDING_LOGO:
        return `${institutionId}/branding/logo.${ext}`;
      case UPLOAD_FOLDERS.BRANDING_FAVICON:
        return `${institutionId}/branding/favicon.${ext}`;
      case UPLOAD_FOLDERS.AVATAR:
        return `${institutionId}/avatars/${userId}.${ext}`;
      default:
        return `${institutionId}/${folder}/${userId}.${ext}`;
    }
  }

  private extractObjectKeyFromPublicUrl(
    publicUrl: string | null | undefined,
  ): string | null {
    if (!publicUrl || !this.config.r2PublicUrl) {
      return null;
    }

    const normalizedPublicBase = this.config.r2PublicUrl.replace(/\/+$/, "");
    const normalizedObjectUrl = publicUrl.replace(/\/+$/, "");
    const prefix = `${normalizedPublicBase}/`;

    if (!normalizedObjectUrl.startsWith(prefix)) {
      return null;
    }

    const key = normalizedObjectUrl.slice(prefix.length);

    return key.length > 0 ? key : null;
  }
}
