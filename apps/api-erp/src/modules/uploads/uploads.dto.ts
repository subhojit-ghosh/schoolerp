export class PresignUploadBodyDto {
  folder!: string;
  contentType!: string;
  fileSize!: number;
}

export class PresignUploadResponseDto {
  uploadUrl!: string;
  publicUrl!: string;
  key!: string;
}
