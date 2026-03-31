import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { API_DOCS, API_ROUTES } from "../../constants";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  FileUploadDto,
  ListFileUploadsQueryDto,
  ListFileUploadsResultDto,
  UploadFileBodyDto,
} from "./file-uploads.dto";
import {
  parseListFileUploadsQuery,
  parseUploadFileBody,
} from "./file-uploads.schemas";
import { FileUploadsService } from "./file-uploads.service";

@ApiTags(API_DOCS.TAGS.FILE_UPLOADS)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.FILE_UPLOADS)
export class FileUploadsController {
  constructor(private readonly fileUploadsService: FileUploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        entityType: { type: "string" },
        entityId: { type: "string" },
      },
      required: ["file", "entityType"],
    },
  })
  @ApiOkResponse({ type: FileUploadDto })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileBodyDto,
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    const input = parseUploadFileBody(body);

    return this.fileUploadsService.uploadFile(
      institution.id,
      session,
      input,
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: "List files for an entity" })
  @ApiQuery({ name: "entityType", required: true, type: String })
  @ApiQuery({ name: "entityId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({ type: ListFileUploadsResultDto })
  listFiles(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListFileUploadsQueryDto,
  ) {
    const parsedQuery = parseListFileUploadsQuery(query);

    return this.fileUploadsService.listFiles(institution.id, parsedQuery);
  }

  @Get(":fileId")
  @ApiOperation({ summary: "Get file metadata" })
  @ApiParam({ name: "fileId", type: String })
  @ApiOkResponse({ type: FileUploadDto })
  getFile(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("fileId") fileId: string,
  ) {
    return this.fileUploadsService.getFile(institution.id, fileId);
  }

  @Get(":fileId/download")
  @ApiOperation({ summary: "Download a file" })
  @ApiParam({ name: "fileId", type: String })
  async downloadFile(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("fileId") fileId: string,
    @Res() res: Response,
  ) {
    const record = await this.fileUploadsService.getFile(
      institution.id,
      fileId,
    );
    const absolutePath =
      this.fileUploadsService.getAbsoluteFilePath(record.storagePath);

    res.setHeader("Content-Type", record.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${record.originalFilename}"`,
    );

    return res.sendFile(absolutePath);
  }

  @Delete(":fileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a file" })
  @ApiParam({ name: "fileId", type: String })
  @ApiNoContentResponse()
  deleteFile(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("fileId") fileId: string,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    return this.fileUploadsService.deleteFile(
      institution.id,
      fileId,
      session,
    );
  }
}
