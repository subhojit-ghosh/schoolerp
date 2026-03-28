import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
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
  StaffAttendanceDayDto,
  StaffAttendanceDayViewDto,
  StaffAttendanceDayViewQueryParamsDto,
  StaffAttendanceReportDto,
  StaffAttendanceReportQueryParamsDto,
  StaffAttendanceRosterQueryParamsDto,
  UpsertStaffAttendanceDayBodyDto,
} from "./staff-attendance.dto";
import {
  parseStaffAttendanceDayViewQuery,
  parseStaffAttendanceReportQuery,
  parseStaffAttendanceRosterQuery,
  parseUpsertStaffAttendanceDay,
} from "./staff-attendance.schemas";
import { StaffAttendanceService } from "./staff-attendance.service";

@ApiTags(API_DOCS.TAGS.STAFF_ATTENDANCE)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.STAFF_ATTENDANCE)
export class StaffAttendanceController {
  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  @Get(API_ROUTES.ROSTER)
  @RequirePermission(PERMISSIONS.STAFF_ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get staff attendance roster for a campus and date",
  })
  @ApiOkResponse({ type: StaffAttendanceDayDto })
  getRoster(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: StaffAttendanceRosterQueryParamsDto,
  ) {
    return this.staffAttendanceService.getRoster(
      institution.id,
      parseStaffAttendanceRosterQuery(query),
    );
  }

  @Post(API_ROUTES.DAY)
  @RequirePermission(PERMISSIONS.STAFF_ATTENDANCE_MANAGE)
  @ApiOperation({
    summary: "Create or update daily staff attendance for a campus",
  })
  @ApiBody({ type: UpsertStaffAttendanceDayBodyDto })
  @ApiCreatedResponse({ type: StaffAttendanceDayDto })
  upsertDay(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpsertStaffAttendanceDayBodyDto,
  ) {
    return this.staffAttendanceService.upsertDay(
      institution.id,
      authSession,
      parseUpsertStaffAttendanceDay(body),
    );
  }

  @Get(API_ROUTES.DAY_VIEW)
  @RequirePermission(PERMISSIONS.STAFF_ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get staff attendance summary across campuses for a date",
  })
  @ApiOkResponse({ type: StaffAttendanceDayViewDto })
  getDayView(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: StaffAttendanceDayViewQueryParamsDto,
  ) {
    return this.staffAttendanceService.getDayView(
      institution.id,
      parseStaffAttendanceDayViewQuery(query),
    );
  }

  @Get(API_ROUTES.REPORT)
  @RequirePermission(PERMISSIONS.STAFF_ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get staff attendance report for a campus over a date range",
  })
  @ApiOkResponse({ type: StaffAttendanceReportDto })
  getReport(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: StaffAttendanceReportQueryParamsDto,
  ) {
    return this.staffAttendanceService.getReport(
      institution.id,
      parseStaffAttendanceReportQuery(query),
    );
  }
}
