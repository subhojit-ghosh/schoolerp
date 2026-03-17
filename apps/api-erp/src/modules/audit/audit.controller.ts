import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { ListAuditLogsQueryDto, ListAuditLogsResultDto } from "./audit.dto";
import { parseListAuditLogsQuery } from "./audit.schemas";
import { AuditService } from "./audit.service";

@ApiTags(API_DOCS.TAGS.AUDIT)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.AUDIT_LOGS)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  @ApiOperation({ summary: "List audit trail entries for the current tenant" })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "entityType", required: false, type: String })
  @ApiQuery({ name: "actorUserId", required: false, type: String })
  @ApiOkResponse({ type: ListAuditLogsResultDto })
  listAuditLogs(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.auditService.listAuditLogs(
      institution.id,
      parseListAuditLogsQuery(query),
    );
  }
}
