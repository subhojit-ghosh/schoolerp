export const UPLOAD_FOLDERS = {
  BRANDING_LOGO: "branding/logo",
  BRANDING_FAVICON: "branding/favicon",
  AVATAR: "avatar",
} as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[keyof typeof UPLOAD_FOLDERS];

export const UPLOAD_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const UPLOAD_ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export const PRESIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes
