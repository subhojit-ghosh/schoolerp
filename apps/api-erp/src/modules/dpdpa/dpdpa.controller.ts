import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  ConsentDto,
  GrantConsentBodyDto,
  ListSensitiveAccessQueryDto,
  ListSensitiveAccessResultDto,
  SessionConfigDto,
  UpdateSessionConfigBodyDto,
} from "./dpdpa.dto";
import {
  parseGrantConsent,
  parseListSensitiveAccessQuery,
  parseUpdateSessionConfig,
  parseWithdrawConsentParam,
} from "./dpdpa.schemas";
import { DpdpaService } from "./dpdpa.service";

const API_TAG = "dpdpa";

@ApiTags(API_TAG)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.DPDPA)
export class DpdpaController {
  constructor(private readonly dpdpaService: DpdpaService) {}

  // ── Consent endpoints ───────────────────────────────────────────────

  @Get(API_ROUTES.CONSENTS)
  @ApiOperation({ summary: "List current user's data consents" })
  @ApiOkResponse({ type: ConsentDto, isArray: true })
  listConsents(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    return this.dpdpaService.listConsents(institution.id, session.user.id);
  }

  @Post(API_ROUTES.CONSENTS)
  @ApiOperation({ summary: "Grant a data consent" })
  @ApiBody({ type: GrantConsentBodyDto })
  @ApiOkResponse({ type: ConsentDto })
  grantConsent(
    @Body() body: GrantConsentBodyDto,
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Req() req: Request,
  ) {
    const input = parseGrantConsent(body);
    const ipAddress = (req.ip ?? req.socket.remoteAddress) || null;

    return this.dpdpaService.grantConsent(
      institution.id,
      session.user.id,
      input.purpose,
      ipAddress,
      session,
    );
  }

  @Delete(`${API_ROUTES.CONSENTS}/:purpose`)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Withdraw a data consent" })
  @ApiParam({ name: "purpose", type: String })
  @ApiOkResponse({ type: ConsentDto })
  withdrawConsent(
    @Param() params: { purpose: string },
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Req() req: Request,
  ) {
    const { purpose } = parseWithdrawConsentParam(params);
    const ipAddress = (req.ip ?? req.socket.remoteAddress) || null;

    return this.dpdpaService.withdrawConsent(
      institution.id,
      session.user.id,
      purpose,
      ipAddress,
      session,
    );
  }

  // ── Sensitive access logs (admin only) ──────────────────────────────

  @Get(API_ROUTES.SENSITIVE_ACCESS)
  @UseGuards(PermissionGuard, ScopeGuard)
  @RequirePermission(PERMISSIONS.DPDPA_MANAGE)
  @ApiOperation({ summary: "List sensitive data access logs" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiQuery({ name: "dataType", required: false, type: String })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "accessedByUserId", required: false, type: String })
  @ApiOkResponse({ type: ListSensitiveAccessResultDto })
  listSensitiveAccessLogs(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListSensitiveAccessQueryDto,
  ) {
    const parsedQuery = parseListSensitiveAccessQuery(query);

    return this.dpdpaService.listAccessLogs(institution.id, parsedQuery);
  }

  // ── Session config ──────────────────────────────────────────────────

  @Get(API_ROUTES.SESSION_CONFIG)
  @ApiOperation({ summary: "Get institution session configuration" })
  @ApiOkResponse({ type: SessionConfigDto })
  getSessionConfig(@CurrentInstitution() institution: TenantInstitution) {
    return this.dpdpaService.getSessionConfig(institution.id);
  }

  @Patch(API_ROUTES.SESSION_CONFIG)
  @UseGuards(PermissionGuard, ScopeGuard)
  @RequirePermission(PERMISSIONS.INSTITUTION_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Update institution session configuration" })
  @ApiBody({ type: UpdateSessionConfigBodyDto })
  @ApiOkResponse({ type: SessionConfigDto })
  updateSessionConfig(
    @Body() body: UpdateSessionConfigBodyDto,
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    const input = parseUpdateSessionConfig(body);

    return this.dpdpaService.updateSessionConfig(
      institution.id,
      input,
      session,
    );
  }
}
