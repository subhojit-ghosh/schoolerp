import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  AttendanceClassSectionDto,
  AttendanceDayDto,
  AttendanceDayQueryParamsDto,
  AttendanceDayViewItemDto,
  AttendanceDayViewQueryParamsDto,
  AttendanceOverviewItemDto,
  AttendanceOverviewQueryParamsDto,
  AttendanceClassReportDto,
  AttendanceClassReportQueryParamsDto,
  AttendanceStudentReportDto,
  AttendanceStudentReportQueryParamsDto,
  UpsertAttendanceDayBodyDto,
} from "./attendance.dto";
import {
  parseAttendanceDayQuery,
  parseAttendanceDayViewQuery,
  parseAttendanceOverviewQuery,
  parseAttendanceClassReportQuery,
  parseAttendanceStudentReportQuery,
  parseMonthlyRegisterQuery,
  parseConsolidatedReportQuery,
  parseChronicAbsenteesQuery,
  parseUpsertAttendanceDay,
} from "./attendance.schemas";
import { AttendanceService } from "./attendance.service";

@ApiTags(API_DOCS.TAGS.ATTENDANCE)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.ATTENDANCE)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(API_ROUTES.CLASS_SECTIONS)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "List available class-section combinations for attendance",
  })
  @ApiOkResponse({ type: AttendanceClassSectionDto, isArray: true })
  listClassSections(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.attendanceService.listClassSections(
      institution.id,
      authSession,
      scopes,
    );
  }

  @Get(API_ROUTES.DAY)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get the attendance roster for a class-section and day",
  })
  @ApiOkResponse({ type: AttendanceDayDto })
  listAttendanceDay(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: AttendanceDayQueryParamsDto,
  ) {
    return this.attendanceService.getAttendanceDay(
      institution.id,
      authSession,
      scopes,
      parseAttendanceDayQuery(query),
    );
  }

  @Post(API_ROUTES.DAY)
  @RequirePermission(PERMISSIONS.ATTENDANCE_WRITE)
  @ApiOperation({
    summary: "Create or update daily attendance for a class-section",
  })
  @ApiBody({ type: UpsertAttendanceDayBodyDto })
  @ApiOkResponse({ type: AttendanceDayDto })
  upsertAttendanceDay(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpsertAttendanceDayBodyDto,
  ) {
    return this.attendanceService.upsertAttendanceDay(
      institution.id,
      authSession,
      scopes,
      parseUpsertAttendanceDay(body),
    );
  }

  @Get(API_ROUTES.DAY_VIEW)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({ summary: "List simple attendance summaries for a day" })
  @ApiQuery({ name: "attendanceDate", type: String })
  @ApiOkResponse({ type: AttendanceDayViewItemDto, isArray: true })
  listAttendanceDayView(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: AttendanceDayViewQueryParamsDto,
  ) {
    return this.attendanceService.listAttendanceDayView(
      institution.id,
      authSession,
      scopes,
      parseAttendanceDayViewQuery(query),
    );
  }

  @Get(API_ROUTES.OVERVIEW)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get attendance overview for all class sections for a given date",
  })
  @ApiQuery({ name: "date", type: String })
  @ApiOkResponse({ type: AttendanceOverviewItemDto, isArray: true })
  getAttendanceOverview(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: AttendanceOverviewQueryParamsDto,
  ) {
    return this.attendanceService.getAttendanceOverview(
      institution.id,
      authSession,
      scopes,
      parseAttendanceOverviewQuery(query),
    );
  }

  @Get(API_ROUTES.CLASS_REPORT)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary:
      "Get student-wise attendance report for a class-section over a date range",
  })
  @ApiOkResponse({ type: AttendanceClassReportDto })
  getAttendanceClassReport(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: AttendanceClassReportQueryParamsDto,
  ) {
    return this.attendanceService.getAttendanceClassReport(
      institution.id,
      authSession,
      scopes,
      parseAttendanceClassReportQuery(query),
    );
  }

  @Get(API_ROUTES.STUDENT_REPORT)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get attendance history for a single student over a date range",
  })
  @ApiOkResponse({ type: AttendanceStudentReportDto })
  getAttendanceStudentReport(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: AttendanceStudentReportQueryParamsDto,
  ) {
    return this.attendanceService.getAttendanceStudentReport(
      institution.id,
      authSession,
      scopes,
      parseAttendanceStudentReportQuery(query),
    );
  }

  @Get(API_ROUTES.MONTHLY_REGISTER)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get monthly attendance register for a class-section",
  })
  @ApiQuery({ name: "classId", type: String })
  @ApiQuery({ name: "sectionId", type: String })
  @ApiQuery({ name: "month", type: Number })
  @ApiQuery({ name: "year", type: Number })
  getMonthlyRegister(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: Record<string, string>,
  ) {
    return this.attendanceService.getMonthlyRegister(
      institution.id,
      authSession,
      scopes,
      parseMonthlyRegisterQuery(query),
    );
  }

  @Get(`${API_ROUTES.REPORTS}/${API_ROUTES.CONSOLIDATED}`)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary:
      "Get consolidated attendance report across classes for a date range",
  })
  @ApiQuery({ name: "startDate", type: String })
  @ApiQuery({ name: "endDate", type: String })
  @ApiQuery({ name: "campusId", type: String, required: false })
  getConsolidatedReport(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: Record<string, string>,
  ) {
    return this.attendanceService.getConsolidatedReport(
      institution.id,
      authSession,
      scopes,
      parseConsolidatedReportQuery(query),
    );
  }

  @Get(`${API_ROUTES.REPORTS}/${API_ROUTES.CHRONIC_ABSENTEES}`)
  @RequirePermission(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({
    summary: "Get students below attendance threshold",
  })
  @ApiQuery({ name: "startDate", type: String })
  @ApiQuery({ name: "endDate", type: String })
  @ApiQuery({ name: "campusId", type: String, required: false })
  @ApiQuery({ name: "threshold", type: Number, required: false })
  getChronicAbsentees(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: Record<string, string>,
  ) {
    return this.attendanceService.getChronicAbsentees(
      institution.id,
      authSession,
      scopes,
      parseChronicAbsenteesQuery(query),
    );
  }
}
