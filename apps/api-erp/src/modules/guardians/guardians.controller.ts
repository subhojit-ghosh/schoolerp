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
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { CurrentSession } from "../auth/current-session.decorator";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CrossStudentFeeSummaryDto,
  GuardianDto,
  ListGuardiansQueryDto,
  ListGuardiansResultDto,
  LinkGuardianStudentBodyDto,
  UpdateGuardianBodyDto,
  UpdateGuardianStudentLinkBodyDto,
} from "./guardians.dto";
import {
  parseLinkGuardianStudent,
  parseListGuardiansQuery,
  parseUpdateGuardian,
  parseUpdateGuardianStudentLink,
} from "./guardians.schemas";
import { GuardiansService } from "./guardians.service";

@ApiTags(API_DOCS.TAGS.GUARDIANS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.GUARDIANS)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  @RequirePermission(PERMISSIONS.GUARDIANS_READ)
  @ApiOperation({
    summary: "List guardians for the current tenant institution",
  })
  @ApiOkResponse({ type: ListGuardiansResultDto })
  listGuardians(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListGuardiansQueryDto,
  ) {
    return this.guardiansService.listGuardians(
      institution.id,
      authSession,
      scopes,
      parseListGuardiansQuery(query),
    );
  }

  @Get(":guardianId")
  @RequirePermission(PERMISSIONS.GUARDIANS_READ)
  @ApiOperation({ summary: "Get a single guardian for the current tenant" })
  @ApiOkResponse({ type: GuardianDto })
  getGuardian(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.guardiansService.getGuardian(
      institution.id,
      guardianId,
      authSession,
      scopes,
    );
  }

  @Post(":guardianId/reset-password")
  @RequirePermission(PERMISSIONS.GUARDIANS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Reset a guardian's password to their mobile number",
  })
  @ApiNoContentResponse()
  resetPassword(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.guardiansService.resetMemberPassword(
      institution.id,
      guardianId,
      authSession,
      scopes,
    );
  }

  @Get(`:guardianId/${API_ROUTES.CROSS_STUDENT_FEES}`)
  @RequirePermission(PERMISSIONS.GUARDIANS_READ)
  @ApiOperation({
    summary:
      "Get combined fee summary across all students linked to a guardian",
  })
  @ApiOkResponse({ type: CrossStudentFeeSummaryDto })
  getCrossStudentFeeSummary(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.guardiansService.getCrossStudentFeeSummary(
      institution.id,
      guardianId,
      authSession,
      scopes,
    );
  }

  @Patch(":guardianId")
  @RequirePermission(PERMISSIONS.GUARDIANS_MANAGE)
  @ApiOperation({ summary: "Update guardian details" })
  @ApiBody({ type: UpdateGuardianBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateGuardian(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpdateGuardianBodyDto,
  ) {
    return this.guardiansService.updateGuardian(
      institution.id,
      guardianId,
      authSession,
      scopes,
      parseUpdateGuardian(body),
    );
  }

  @Post(":guardianId/students")
  @RequirePermission(PERMISSIONS.GUARDIANS_MANAGE)
  @ApiOperation({ summary: "Link a guardian to a student" })
  @ApiBody({ type: LinkGuardianStudentBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  linkStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: LinkGuardianStudentBodyDto,
  ) {
    return this.guardiansService.linkStudent(
      institution.id,
      guardianId,
      authSession,
      scopes,
      parseLinkGuardianStudent(body),
    );
  }

  @Patch(":guardianId/students/:studentId")
  @RequirePermission(PERMISSIONS.GUARDIANS_MANAGE)
  @ApiOperation({ summary: "Update a guardian-student relationship" })
  @ApiBody({ type: UpdateGuardianStudentLinkBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateStudentLink(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpdateGuardianStudentLinkBodyDto,
  ) {
    return this.guardiansService.updateStudentLink(
      institution.id,
      guardianId,
      studentId,
      authSession,
      scopes,
      parseUpdateGuardianStudentLink(body),
    );
  }

  @Delete(":guardianId/students/:studentId")
  @RequirePermission(PERMISSIONS.GUARDIANS_MANAGE)
  @ApiOperation({ summary: "Unlink a guardian from a student" })
  @ApiOkResponse({ type: GuardianDto })
  unlinkStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.guardiansService.unlinkStudent(
      institution.id,
      guardianId,
      studentId,
      authSession,
      scopes,
    );
  }
}
