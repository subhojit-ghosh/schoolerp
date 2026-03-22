import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { PresignUploadBodyDto, PresignUploadResponseDto } from "./uploads.dto";
import { UploadsService } from "./uploads.service";
import { parsePresignUpload } from "./uploads.schemas";

@ApiTags(API_DOCS.TAGS.UPLOADS)
@Controller(API_ROUTES.UPLOADS)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("presign")
  @UseGuards(SessionAuthGuard, TenantInstitutionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a presigned URL for file upload to R2" })
  @ApiBody({ type: PresignUploadBodyDto })
  @ApiOkResponse({ type: PresignUploadResponseDto })
  async presignUpload(
    @Body() body: PresignUploadBodyDto,
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    const input = parsePresignUpload(body);

    return this.uploadsService.presignUpload(
      input,
      institution.id,
      session.user.id,
    );
  }
}
