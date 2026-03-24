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
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
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
  CopySectionTimetableBodyDto,
  CreateTimetableVersionBodyDto,
  ListTimetableVersionsQueryDto,
  PublishTimetableVersionBodyDto,
  ReplaceSectionTimetableBodyDto,
  SetTimetableVersionStatusBodyDto,
  TeacherTimetableQueryDto,
  TeacherTimetableViewDto,
  TimetableStaffOptionsDto,
  TimetableStaffOptionsQueryDto,
  TimetableScopeQueryDto,
  TimetableVersionDto,
  TimetableViewDto,
  UpdateTimetableVersionBodyDto,
} from "./timetable.dto";
import {
  parseCopySectionTimetable,
  parseCreateTimetableVersion,
  parseListTimetableVersionsQuery,
  parsePublishTimetableVersion,
  parseReplaceSectionTimetable,
  parseSetTimetableVersionStatus,
  parseTeacherTimetableQuery,
  parseTimetableScopeQuery,
  parseTimetableStaffOptionsQuery,
  parseUpdateTimetableVersion,
} from "./timetable.schemas";
import { TimetableService } from "./timetable.service";

@ApiTags(API_DOCS.TAGS.TIMETABLE)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.TIMETABLE)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({
    summary: "Get class-section timetable for the current tenant",
  })
  @ApiQuery({ name: "classId", required: true, type: String })
  @ApiQuery({ name: "sectionId", required: true, type: String })
  @ApiQuery({ name: "versionId", required: false, type: String })
  @ApiQuery({ name: "date", required: false, type: String })
  @ApiOkResponse({ type: TimetableViewDto })
  getTimetable(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: TimetableScopeQueryDto,
  ) {
    return this.timetableService.getTimetable(
      institution.id,
      authSession,
      scopes,
      parseTimetableScopeQuery(query),
    );
  }

  @Get(API_ROUTES.VERSIONS)
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List timetable versions for a class section" })
  @ApiQuery({ name: "classId", required: true, type: String })
  @ApiQuery({ name: "sectionId", required: true, type: String })
  @ApiOkResponse({ type: TimetableVersionDto, isArray: true })
  listTimetableVersions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListTimetableVersionsQueryDto,
  ) {
    return this.timetableService.listTimetableVersions(
      institution.id,
      authSession,
      scopes,
      parseListTimetableVersionsQuery(query),
    );
  }

  @Post(API_ROUTES.VERSIONS)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Create a draft timetable version" })
  @ApiBody({ type: CreateTimetableVersionBodyDto })
  @ApiOkResponse({ type: TimetableVersionDto })
  createTimetableVersion(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateTimetableVersionBodyDto,
  ) {
    return this.timetableService.createTimetableVersion(
      institution.id,
      authSession,
      scopes,
      parseCreateTimetableVersion(body),
    );
  }

  @Patch(`${API_ROUTES.VERSIONS}/:versionId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Update timetable version details" })
  @ApiBody({ type: UpdateTimetableVersionBodyDto })
  @ApiOkResponse({ type: TimetableVersionDto })
  updateTimetableVersion(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("versionId") versionId: string,
    @Body() body: UpdateTimetableVersionBodyDto,
  ) {
    return this.timetableService.updateTimetableVersion(
      institution.id,
      versionId,
      authSession,
      scopes,
      parseUpdateTimetableVersion(body),
    );
  }

  @Post(`${API_ROUTES.VERSIONS}/:versionId/${API_ROUTES.PUBLISH}`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Publish a timetable version and assign it" })
  @ApiBody({ type: PublishTimetableVersionBodyDto })
  @ApiOkResponse({ type: TimetableVersionDto })
  publishTimetableVersion(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("versionId") versionId: string,
    @Body() body: PublishTimetableVersionBodyDto,
  ) {
    return this.timetableService.publishTimetableVersion(
      institution.id,
      versionId,
      authSession,
      scopes,
      parsePublishTimetableVersion(body),
    );
  }

  @Patch(`${API_ROUTES.VERSIONS}/:versionId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Set timetable version status" })
  @ApiBody({ type: SetTimetableVersionStatusBodyDto })
  @ApiOkResponse({ type: TimetableVersionDto })
  setTimetableVersionStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("versionId") versionId: string,
    @Body() body: SetTimetableVersionStatusBodyDto,
  ) {
    return this.timetableService.setTimetableVersionStatus(
      institution.id,
      versionId,
      authSession,
      scopes,
      parseSetTimetableVersionStatus(body),
    );
  }

  @Get(API_ROUTES.OPTIONS)
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({
    summary: "List timetable staff options for the current tenant",
  })
  @ApiQuery({ name: "subjectId", required: true, type: String })
  @ApiQuery({ name: "classId", required: false, type: String })
  @ApiOkResponse({ type: TimetableStaffOptionsDto })
  listStaffOptions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: TimetableStaffOptionsQueryDto,
  ) {
    return this.timetableService.listStaffOptions(
      institution.id,
      authSession,
      scopes,
      parseTimetableStaffOptionsQuery(query),
    );
  }

  @Get(API_ROUTES.TEACHER)
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "Get teacher timetable for the current tenant" })
  @ApiQuery({ name: "staffId", required: true, type: String })
  @ApiQuery({ name: "date", required: false, type: String })
  @ApiOkResponse({ type: TeacherTimetableViewDto })
  getTeacherTimetable(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: TeacherTimetableQueryDto,
  ) {
    return this.timetableService.getTeacherTimetable(
      institution.id,
      authSession,
      scopes,
      parseTeacherTimetableQuery(query),
    );
  }

  @Put(`sections/:sectionId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({
    summary:
      "Replace the full timetable for a class section inside a specific version",
  })
  @ApiBody({ type: ReplaceSectionTimetableBodyDto })
  @ApiOkResponse({ type: TimetableViewDto })
  replaceSectionTimetable(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("sectionId") sectionId: string,
    @Body() body: ReplaceSectionTimetableBodyDto,
  ) {
    return this.timetableService.replaceSectionTimetable(
      institution.id,
      sectionId,
      authSession,
      scopes,
      parseReplaceSectionTimetable(body),
    );
  }

  @Post(`sections/:sectionId/${API_ROUTES.COPY_FROM}`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({
    summary: "Copy timetable entries from another section into a draft version",
  })
  @ApiBody({ type: CopySectionTimetableBodyDto })
  @ApiOkResponse({ type: TimetableViewDto })
  copySectionTimetable(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("sectionId") sectionId: string,
    @Body() body: CopySectionTimetableBodyDto,
  ) {
    return this.timetableService.copySectionTimetable(
      institution.id,
      sectionId,
      authSession,
      scopes,
      parseCopySectionTimetable(body),
    );
  }

  @Delete(`:entryId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a timetable entry for the current tenant" })
  @ApiNoContentResponse()
  deleteEntry(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("entryId") entryId: string,
  ) {
    return this.timetableService.deleteEntry(
      institution.id,
      entryId,
      authSession,
    );
  }
}
