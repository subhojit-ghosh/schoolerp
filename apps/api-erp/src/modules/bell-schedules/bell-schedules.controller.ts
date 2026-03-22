import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  BellScheduleDto,
  CreateBellScheduleBodyDto,
  ListBellSchedulesQueryDto,
  ListBellSchedulesResultDto,
  ReplaceBellSchedulePeriodsBodyDto,
  SetBellScheduleStatusBodyDto,
  UpdateBellScheduleBodyDto,
} from "./bell-schedules.dto";
import {
  parseCreateBellSchedule,
  parseListBellSchedulesQuery,
  parseReplaceBellSchedulePeriods,
  parseSetBellScheduleStatus,
  parseUpdateBellSchedule,
} from "./bell-schedules.schemas";
import { BellSchedulesService } from "./bell-schedules.service";

@ApiTags(API_DOCS.TAGS.BELL_SCHEDULES)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.BELL_SCHEDULES)
export class BellSchedulesController {
  constructor(private readonly bellSchedulesService: BellSchedulesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List bell schedules for the current tenant campus" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiOkResponse({ type: ListBellSchedulesResultDto })
  listBellSchedules(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListBellSchedulesQueryDto,
  ) {
    return this.bellSchedulesService.listBellSchedules(
      institution.id,
      authSession,
      scopes,
      parseListBellSchedulesQuery(query),
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Create a bell schedule for the current tenant" })
  @ApiBody({ type: CreateBellScheduleBodyDto })
  @ApiOkResponse({ type: BellScheduleDto })
  createBellSchedule(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateBellScheduleBodyDto,
  ) {
    return this.bellSchedulesService.createBellSchedule(
      institution.id,
      authSession,
      scopes,
      parseCreateBellSchedule(body),
    );
  }

  @Get(":scheduleId")
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "Get a bell schedule for the current tenant" })
  @ApiOkResponse({ type: BellScheduleDto })
  getBellSchedule(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("scheduleId") scheduleId: string,
  ) {
    return this.bellSchedulesService.getBellSchedule(
      institution.id,
      scheduleId,
      authSession,
      scopes,
    );
  }

  @Put(":scheduleId")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Update a bell schedule for the current tenant" })
  @ApiBody({ type: UpdateBellScheduleBodyDto })
  @ApiOkResponse({ type: BellScheduleDto })
  updateBellSchedule(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("scheduleId") scheduleId: string,
    @Body() body: UpdateBellScheduleBodyDto,
  ) {
    return this.bellSchedulesService.updateBellSchedule(
      institution.id,
      scheduleId,
      authSession,
      scopes,
      parseUpdateBellSchedule(body),
    );
  }

  @Patch(":scheduleId/status")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Set bell schedule status for the current tenant" })
  @ApiBody({ type: SetBellScheduleStatusBodyDto })
  @ApiOkResponse({ type: BellScheduleDto })
  setBellScheduleStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("scheduleId") scheduleId: string,
    @Body() body: SetBellScheduleStatusBodyDto,
  ) {
    return this.bellSchedulesService.setBellScheduleStatus(
      institution.id,
      scheduleId,
      authSession,
      scopes,
      parseSetBellScheduleStatus(body),
    );
  }

  @Put(":scheduleId/periods")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({
    summary: "Replace the full period list for a bell schedule in the current tenant",
  })
  @ApiBody({ type: ReplaceBellSchedulePeriodsBodyDto })
  @ApiOkResponse({ type: BellScheduleDto })
  replaceBellSchedulePeriods(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("scheduleId") scheduleId: string,
    @Body() body: ReplaceBellSchedulePeriodsBodyDto,
  ) {
    return this.bellSchedulesService.replaceBellSchedulePeriods(
      institution.id,
      scheduleId,
      authSession,
      scopes,
      parseReplaceBellSchedulePeriods(body),
    );
  }
}
