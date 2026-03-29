import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { DocumentsService } from "./documents.service";

@ApiTags("documents")
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.DOCUMENTS)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ── Signatories ─────────────────────────────────────────────────────────

  @Get(API_ROUTES.SIGNATORIES)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "List institution signatories" })
  listSignatories(@CurrentInstitution() institution: TenantInstitution) {
    return this.documentsService.listSignatories(institution.id);
  }

  @Post(API_ROUTES.SIGNATORIES)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Create a signatory" })
  createSignatory(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: { name: string; designation: string; sortOrder?: number },
  ) {
    return this.documentsService.createSignatory(institution.id, body);
  }

  @Patch(`${API_ROUTES.SIGNATORIES}/:signatoryId`)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Update a signatory" })
  updateSignatory(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("signatoryId") signatoryId: string,
    @Body()
    body: {
      name?: string;
      designation?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.documentsService.updateSignatory(
      institution.id,
      signatoryId,
      body,
    );
  }

  // ── Document config ─────────────────────────────────────────────────────

  @Get(API_ROUTES.CONFIG)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Get document configuration" })
  getDocumentConfig(@CurrentInstitution() institution: TenantInstitution) {
    return this.documentsService.getDocumentConfig(institution.id);
  }

  @Patch(API_ROUTES.CONFIG)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Update document configuration" })
  updateDocumentConfig(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: Record<string, unknown>,
  ) {
    return this.documentsService.updateDocumentConfig(
      institution.id,
      body as Parameters<typeof this.documentsService.updateDocumentConfig>[1],
    );
  }
}
