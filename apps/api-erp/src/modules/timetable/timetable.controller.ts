import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  ReplaceSectionTimetableBodyDto,
  TimetableScopeQueryDto,
  TimetableViewDto,
} from "./timetable.dto";
import {
  parseReplaceSectionTimetable,
  parseTimetableScopeQuery,
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

  @Put(`sections/:sectionId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({
    summary:
      "Replace the full timetable for a class section in the current tenant",
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
