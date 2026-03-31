import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UploadFileBodyDto {
  entityType!: string;
  entityId?: string;
}

export class FileUploadDto {
  id!: string;
  institutionId!: string;
  entityType!: string;
  entityId!: string | null;
  originalFilename!: string;
  storagePath!: string;
  mimeType!: string;
  sizeBytes!: number;
  uploadedByUserId!: string;
  createdAt!: string;
}

export class ListFileUploadsQueryDto {
  entityType!: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
}

export class ListFileUploadsResultDto {
  @ApiProperty({ type: () => FileUploadDto, isArray: true })
  rows!: FileUploadDto[];

  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}
