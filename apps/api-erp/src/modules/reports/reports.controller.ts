import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
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
import { StudentStrengthQueryDto, StudentStrengthResultDto } from "./reports.dto";
import { parseStudentStrengthQuery } from "./reports.schemas";
import { ReportsService } from "./reports.service";

const STUDENT_STRENGTH_PATH = API_ROUTES.STUDENT_STRENGTH;

@ApiTags(API_DOCS.TAGS.REPORTS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.REPORTS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(STUDENT_STRENGTH_PATH)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "Get student strength grouped by class and section" })
  @ApiOkResponse({ type: StudentStrengthResultDto })
  getStudentStrength(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: StudentStrengthQueryDto,
  ) {
    return this.reportsService.getStudentStrength(
      institution.id,
      authSession,
      scopes,
      parseStudentStrengthQuery(query),
    );
  }
}
