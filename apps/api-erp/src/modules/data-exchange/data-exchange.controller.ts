import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  DataExchangeBodyRequestDto,
  DataExchangeCapabilitiesDto,
  DataExchangeExecuteResultDto,
  DataExchangePreviewResultDto,
} from "./data-exchange.dto";
import {
  parseDataExchangeBody,
  parseDataExchangeEntityType,
} from "./data-exchange.schemas";
import { DataExchangeService } from "./data-exchange.service";

@ApiTags(API_DOCS.TAGS.DATA_EXCHANGE)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.DATA_EXCHANGE)
export class DataExchangeController {
  constructor(private readonly dataExchangeService: DataExchangeService) {}

  @Get("capabilities")
  @ApiOperation({ summary: "List available bulk import/export capabilities" })
  @ApiOkResponse({ type: DataExchangeCapabilitiesDto })
  getCapabilities(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.dataExchangeService.getCapabilities(
      institution.id,
      authSession,
    );
  }

  @Get(`${API_ROUTES.TEMPLATES}/:entityType`)
  @ApiOperation({
    summary: "Download a CSV template for an import/export entity type",
  })
  async downloadTemplate(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("entityType") entityTypeParam: string,
    @Res() response: Response,
  ) {
    const entityType = parseDataExchangeEntityType({
      entityType: entityTypeParam,
    });
    const file = await this.dataExchangeService.getTemplate(
      institution.id,
      authSession,
      entityType,
    );

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    response.send(file.content);
  }

  @Post(`${API_ROUTES.IMPORTS}/preview`)
  @ApiOperation({ summary: "Preview a bulk CSV import before execution" })
  @ApiBody({ type: DataExchangeBodyRequestDto })
  @ApiOkResponse({ type: DataExchangePreviewResultDto })
  previewImport(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: DataExchangeBodyRequestDto,
  ) {
    return this.dataExchangeService.previewImport(
      institution.id,
      authSession,
      scopes,
      parseDataExchangeBody(body),
    );
  }

  @Post(`${API_ROUTES.IMPORTS}/execute`)
  @ApiOperation({ summary: "Execute a validated bulk CSV import" })
  @ApiBody({ type: DataExchangeBodyRequestDto })
  @ApiOkResponse({ type: DataExchangeExecuteResultDto })
  executeImport(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: DataExchangeBodyRequestDto,
  ) {
    return this.dataExchangeService.executeImport(
      institution.id,
      authSession,
      scopes,
      parseDataExchangeBody(body),
    );
  }

  @Get(`${API_ROUTES.EXPORTS}/:entityType`)
  @ApiOperation({ summary: "Export entity data to CSV" })
  async exportData(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("entityType") entityTypeParam: string,
    @Res() response: Response,
  ) {
    const entityType = parseDataExchangeEntityType({
      entityType: entityTypeParam,
    });
    const file = await this.dataExchangeService.exportData(
      institution.id,
      authSession,
      scopes,
      entityType,
    );

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    response.send(file.content);
  }
}
