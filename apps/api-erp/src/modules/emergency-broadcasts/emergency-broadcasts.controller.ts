import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateBroadcastBodyDto,
  UpdateBroadcastBodyDto,
  BroadcastDto,
  BroadcastListResultDto,
  ListBroadcastsQueryParamsDto,
  DeliveryStatsDto,
  BroadcastTemplateListDto,
} from "./emergency-broadcasts.dto";
import {
  parseCreateBroadcast,
  parseUpdateBroadcast,
  parseListBroadcastsQuery,
} from "./emergency-broadcasts.schemas";
import { EmergencyBroadcastsService } from "./emergency-broadcasts.service";

const BROADCAST_DETAIL_PATH = `${API_ROUTES.EMERGENCY_BROADCASTS}/:broadcastId`;
const BROADCAST_SEND_PATH = `${BROADCAST_DETAIL_PATH}/${API_ROUTES.SEND}`;
const BROADCAST_DELIVERY_LOGS_PATH = `${BROADCAST_DETAIL_PATH}/${API_ROUTES.DELIVERY_LOGS}`;

@ApiTags("emergency-broadcasts")
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller()
export class EmergencyBroadcastsController {
  constructor(
    private readonly broadcastsService: EmergencyBroadcastsService,
  ) {}

  // ── CRUD ───────────────────────────────────────────────────────────────

  @Get(API_ROUTES.EMERGENCY_BROADCASTS)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({ summary: "List emergency broadcasts" })
  @ApiOkResponse({ type: BroadcastListResultDto })
  async listBroadcasts(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListBroadcastsQueryParamsDto,
  ) {
    const parsed = parseListBroadcastsQuery(query);
    return this.broadcastsService.listBroadcasts(institution.id, parsed);
  }

  @Post(API_ROUTES.EMERGENCY_BROADCASTS)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({ summary: "Create an emergency broadcast draft" })
  @ApiCreatedResponse({ type: BroadcastDto })
  async createBroadcast(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateBroadcastBodyDto,
  ) {
    const dto = parseCreateBroadcast(body);
    return this.broadcastsService.createBroadcast(
      institution.id,
      session,
      dto,
    );
  }

  @Patch(BROADCAST_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({ summary: "Update an emergency broadcast (draft only)" })
  @ApiOkResponse({ type: BroadcastDto })
  async updateBroadcast(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("broadcastId") broadcastId: string,
    @Body() body: UpdateBroadcastBodyDto,
  ) {
    const dto = parseUpdateBroadcast(body);
    return this.broadcastsService.updateBroadcast(
      institution.id,
      broadcastId,
      session,
      dto,
    );
  }

  @Get(BROADCAST_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({ summary: "Get an emergency broadcast" })
  @ApiOkResponse({ type: BroadcastDto })
  async getBroadcast(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("broadcastId") broadcastId: string,
  ) {
    return this.broadcastsService.getBroadcast(institution.id, broadcastId);
  }

  // ── Send ───────────────────────────────────────────────────────────────

  @Post(BROADCAST_SEND_PATH)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({
    summary: "Send an emergency broadcast to resolved recipients",
  })
  @ApiOkResponse({ type: BroadcastDto })
  async sendBroadcast(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("broadcastId") broadcastId: string,
  ) {
    return this.broadcastsService.sendBroadcast(
      institution.id,
      broadcastId,
      session,
    );
  }

  // ── Delivery stats ─────────────────────────────────────────────────────

  @Get(BROADCAST_DELIVERY_LOGS_PATH)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({
    summary: "Get delivery statistics for a broadcast",
  })
  @ApiOkResponse({ type: DeliveryStatsDto })
  async getDeliveryStats(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("broadcastId") broadcastId: string,
  ) {
    return this.broadcastsService.getDeliveryStats(
      institution.id,
      broadcastId,
    );
  }

  // ── Templates ──────────────────────────────────────────────────────────

  @Get(API_ROUTES.BROADCAST_TEMPLATES)
  @RequirePermission(PERMISSIONS.EMERGENCY_BROADCAST_SEND)
  @ApiOperation({ summary: "List broadcast message templates" })
  @ApiOkResponse({ type: BroadcastTemplateListDto })
  listTemplates() {
    return this.broadcastsService.listTemplates();
  }
}
