import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { PermissionSlug } from "@repo/contracts";
import { API_DOCS, API_ROUTES } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { AuthService } from "../auth/auth.service";
import {
  DismissResultDto,
  NeedsAttentionResultDto,
  TrendsResultDto,
} from "./dashboard.dto";
import { DashboardService } from "./dashboard.service";

@ApiTags(API_DOCS.TAGS.DASHBOARD)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.DASHBOARD)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {}

  @Get(API_ROUTES.NEEDS_ATTENTION)
  @ApiOperation({
    summary: "Get items needing attention for the current user",
  })
  @ApiOkResponse({ type: NeedsAttentionResultDto })
  async getNeedsAttention(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    const permissions = await this.authService.resolvePermissions(
      session.user.id,
      institution.id,
    );

    return this.dashboardService.getNeedsAttention(
      institution.id,
      session.user.id,
      permissions as Set<PermissionSlug>,
    );
  }

  @Get(API_ROUTES.TRENDS)
  @ApiOperation({ summary: "Get dashboard trend data" })
  @ApiOkResponse({ type: TrendsResultDto })
  getTrends(
    @CurrentInstitution() institution: TenantInstitution,
  ) {
    return this.dashboardService.getTrends(institution.id);
  }

  @Post(`${API_ROUTES.NEEDS_ATTENTION}/:itemId/${API_ROUTES.DISMISS}`)
  @ApiOperation({ summary: "Dismiss a needs-attention item" })
  @ApiOkResponse({ type: DismissResultDto })
  dismissItem(
    @CurrentSession() session: AuthenticatedSession,
    @Param("itemId") itemId: string,
  ) {
    return this.dashboardService.dismissItem(session.user.id, itemId);
  }
}
