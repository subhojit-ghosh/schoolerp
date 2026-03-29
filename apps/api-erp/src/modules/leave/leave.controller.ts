import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  AllocateLeaveBalancesBodyDto,
  CreateLeaveApplicationBodyDto,
  CreateLeaveTypeBodyDto,
  LeaveApplicationDto,
  LeaveApplicationListResultDto,
  LeaveBalanceDto,
  LeaveTypeDto,
  ListLeaveApplicationsQueryParamsDto,
  ListLeaveBalancesQueryParamsDto,
  ReviewLeaveApplicationBodyDto,
  TeamLeaveCalendarEntryDto,
  TeamLeaveCalendarQueryDto,
  UpdateLeaveTypeBodyDto,
} from "./leave.dto";
import {
  parseAllocateLeaveBalances,
  parseCreateLeaveApplication,
  parseCreateLeaveType,
  parseListLeaveApplications,
  parseListLeaveBalances,
  parseListLeaveTypes,
  parseReviewLeaveApplication,
  parseTeamLeaveCalendar,
  parseUpdateLeaveType,
} from "./leave.schemas";
import { LeaveService } from "./leave.service";

@ApiTags(API_DOCS.TAGS.LEAVE)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.LEAVE)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // ── Leave Types ───────────────────────────────────────────────────────────

  @Get(API_ROUTES.LEAVE_TYPES)
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  @ApiOperation({ summary: "List leave types" })
  @ApiOkResponse({ type: [LeaveTypeDto] })
  async listLeaveTypes(
    @CurrentInstitution() institution: TenantInstitution,
    @Query("status") status?: "active" | "inactive",
  ) {
    const parsed = parseListLeaveTypes({ status });
    return this.leaveService.listLeaveTypes(institution.id, parsed.status);
  }

  @Post(API_ROUTES.LEAVE_TYPES)
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @ApiOperation({ summary: "Create a leave type" })
  @ApiCreatedResponse({ type: LeaveTypeDto })
  async createLeaveType(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateLeaveTypeBodyDto,
  ) {
    const dto = parseCreateLeaveType(body);
    return this.leaveService.createLeaveType(institution.id, session, dto);
  }

  @Put(`${API_ROUTES.LEAVE_TYPES}/:leaveTypeId`)
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @ApiOperation({ summary: "Update a leave type" })
  @ApiOkResponse({ type: LeaveTypeDto })
  async updateLeaveType(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("leaveTypeId") leaveTypeId: string,
    @Body() body: UpdateLeaveTypeBodyDto,
  ) {
    const dto = parseUpdateLeaveType(body);
    return this.leaveService.updateLeaveType(
      institution.id,
      leaveTypeId,
      session,
      dto,
    );
  }

  // ── Leave Applications ────────────────────────────────────────────────────

  @Get(API_ROUTES.LEAVE_APPLICATIONS)
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  @ApiOperation({ summary: "List leave applications" })
  @ApiOkResponse({ type: LeaveApplicationListResultDto })
  async listLeaveApplications(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListLeaveApplicationsQueryParamsDto,
  ) {
    const parsed = parseListLeaveApplications(query);
    return this.leaveService.listLeaveApplications(institution.id, parsed);
  }

  @Get(`${API_ROUTES.LEAVE_APPLICATIONS}/:applicationId`)
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  @ApiOperation({ summary: "Get a leave application" })
  @ApiOkResponse({ type: LeaveApplicationDto })
  async getLeaveApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("applicationId") applicationId: string,
  ) {
    return this.leaveService.getLeaveApplication(institution.id, applicationId);
  }

  @Post(API_ROUTES.LEAVE_APPLICATIONS)
  @RequirePermission(PERMISSIONS.LEAVE_APPLY)
  @ApiOperation({ summary: "Apply for leave (self)" })
  @ApiCreatedResponse({ type: LeaveApplicationDto })
  async applyLeave(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateLeaveApplicationBodyDto,
  ) {
    const dto = parseCreateLeaveApplication(body);
    return this.leaveService.applyLeave(institution.id, session, dto);
  }

  @Post(`${API_ROUTES.LEAVE_APPLICATIONS}/staff/:staffMemberId`)
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @ApiOperation({ summary: "Apply leave on behalf of a staff member (admin)" })
  @ApiCreatedResponse({ type: LeaveApplicationDto })
  async applyLeaveForStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("staffMemberId") staffMemberId: string,
    @Body() body: CreateLeaveApplicationBodyDto,
  ) {
    const dto = parseCreateLeaveApplication(body);
    return this.leaveService.applyLeaveForStaff(
      institution.id,
      session,
      staffMemberId,
      dto,
    );
  }

  @Post(`${API_ROUTES.LEAVE_APPLICATIONS}/:applicationId/${API_ROUTES.REVIEW}`)
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve or reject a leave application" })
  @ApiOkResponse({ type: LeaveApplicationDto })
  async reviewLeaveApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
    @Body() body: ReviewLeaveApplicationBodyDto,
  ) {
    const dto = parseReviewLeaveApplication(body);
    return this.leaveService.reviewLeaveApplication(
      institution.id,
      applicationId,
      session,
      dto,
    );
  }

  @Post(`${API_ROUTES.LEAVE_APPLICATIONS}/:applicationId/${API_ROUTES.CANCEL}`)
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a leave application" })
  @ApiOkResponse({ type: LeaveApplicationDto })
  async cancelLeaveApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
  ) {
    return this.leaveService.cancelLeaveApplication(
      institution.id,
      applicationId,
      session,
    );
  }

  // ── Leave Balances ────────────────────────────────────────────────────────

  @Get("balances")
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  @ApiOperation({ summary: "List leave balances for staff" })
  @ApiOkResponse({ type: [LeaveBalanceDto] })
  async listLeaveBalances(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListLeaveBalancesQueryParamsDto,
  ) {
    const parsed = parseListLeaveBalances(query);
    return this.leaveService.listLeaveBalances(institution.id, parsed);
  }

  @Post("balances/allocate")
  @RequirePermission(PERMISSIONS.LEAVE_MANAGE)
  @ApiOperation({
    summary: "Allocate leave balances for all staff for a given academic year",
  })
  async allocateLeaveBalances(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: AllocateLeaveBalancesBodyDto,
  ) {
    const dto = parseAllocateLeaveBalances(body);
    return this.leaveService.allocateLeaveBalances(
      institution.id,
      dto.academicYearId,
      session,
    );
  }

  // ── Team Leave Calendar ────────────────────────────────────────────────────

  @Get("team-calendar")
  @RequirePermission(PERMISSIONS.LEAVE_READ)
  @ApiOperation({
    summary: "Get approved leaves for all staff in a date range",
  })
  @ApiOkResponse({ type: [TeamLeaveCalendarEntryDto] })
  async getTeamLeaveCalendar(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: TeamLeaveCalendarQueryDto,
  ) {
    const parsed = parseTeamLeaveCalendar(query);
    return this.leaveService.getTeamLeaveCalendar(
      institution.id,
      parsed.from,
      parsed.to,
    );
  }
}
