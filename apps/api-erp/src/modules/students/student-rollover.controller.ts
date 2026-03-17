import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
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
  StudentRolloverBodyDto,
  StudentRolloverExecuteDto,
  StudentRolloverPreviewDto,
} from "./student-rollover.dto";
import { parseStudentRolloverRequest } from "./student-rollover.schemas";
import { StudentRolloverService } from "./student-rollover.service";

@ApiTags(API_DOCS.TAGS.STUDENTS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(`${API_ROUTES.STUDENTS}/${API_ROUTES.ROLLOVER}`)
export class StudentRolloverController {
  constructor(
    private readonly studentRolloverService: StudentRolloverService,
  ) {}

  @Post(API_ROUTES.PREVIEW)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({
    summary: "Preview academic-year rollover for currently enrolled students",
  })
  @ApiBody({ type: StudentRolloverBodyDto })
  @ApiOkResponse({ type: StudentRolloverPreviewDto })
  preview(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: StudentRolloverBodyDto,
  ) {
    return this.studentRolloverService.preview(
      institution.id,
      authSession,
      scopes,
      parseStudentRolloverRequest(body),
    );
  }

  @Post(API_ROUTES.EXECUTE)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({
    summary: "Execute academic-year rollover for currently enrolled students",
  })
  @ApiBody({ type: StudentRolloverBodyDto })
  @ApiOkResponse({ type: StudentRolloverExecuteDto })
  execute(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: StudentRolloverBodyDto,
  ) {
    return this.studentRolloverService.execute(
      institution.id,
      authSession,
      scopes,
      parseStudentRolloverRequest(body),
    );
  }
}
