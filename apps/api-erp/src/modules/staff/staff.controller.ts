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
import { CurrentSession } from "../auth/current-session.decorator";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateStaffResultDto,
  CreateStaffBodyDto,
  CreateStaffRoleAssignmentBodyDto,
  CreateSubjectTeacherAssignmentBodyDto,
  ListStaffQueryDto,
  ListStaffResultDto,
  SetStaffStatusBodyDto,
  StaffDto,
  StaffRoleAssignmentDto,
  StaffRoleDto,
  SubjectTeacherAssignmentDto,
  UpdateStaffBodyDto,
} from "./staff.dto";
import {
  parseCreateStaff,
  parseCreateStaffRoleAssignment,
  parseCreateSubjectTeacherAssignment,
  parseListStaffQuery,
  parseSetStaffStatus,
  parseUpdateStaff,
} from "./staff.schemas";
import { StaffService } from "./staff.service";

@ApiTags(API_DOCS.TAGS.STAFF)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.STAFF)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STAFF_READ)
  @ApiOperation({ summary: "List staff for the current tenant institution" })
  @ApiOkResponse({ type: ListStaffResultDto })
  listStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListStaffQueryDto,
  ) {
    return this.staffService.listStaff(
      institution.id,
      authSession,
      scopes,
      parseListStaffQuery(query),
    );
  }

  @Get(API_ROUTES.ROLES)
  @RequirePermission(PERMISSIONS.STAFF_READ)
  @ApiOperation({
    summary: "List available staff roles for the current tenant",
  })
  @ApiOkResponse({ type: StaffRoleDto, isArray: true })
  listRoles(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.listRoles(institution.id, authSession);
  }

  @Get(`:staffId/${API_ROUTES.ROLES}`)
  @RequirePermission(PERMISSIONS.STAFF_READ)
  @ApiOperation({
    summary:
      "List role assignments for a staff membership in the current tenant",
  })
  @ApiOkResponse({ type: StaffRoleAssignmentDto, isArray: true })
  listRoleAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
  ) {
    return this.staffService.listRoleAssignments(
      institution.id,
      staffId,
      authSession,
      scopes,
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @ApiOperation({ summary: "Create a staff membership for the current tenant" })
  @ApiBody({ type: CreateStaffBodyDto })
  @ApiOkResponse({ type: CreateStaffResultDto })
  createStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateStaffBodyDto,
  ) {
    return this.staffService.createStaff(
      institution.id,
      authSession,
      scopes,
      parseCreateStaff(body),
    );
  }

  @Post(`:staffId/${API_ROUTES.ROLES}`)
  @RequirePermission(PERMISSIONS.INSTITUTION_USERS_MANAGE)
  @ApiOperation({
    summary:
      "Assign a role with optional campus, class, and section scope to a staff membership",
  })
  @ApiBody({ type: CreateStaffRoleAssignmentBodyDto })
  @ApiOkResponse({ type: StaffRoleAssignmentDto })
  createRoleAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
    @Body() body: CreateStaffRoleAssignmentBodyDto,
  ) {
    return this.staffService.createRoleAssignment(
      institution.id,
      staffId,
      authSession,
      scopes,
      parseCreateStaffRoleAssignment(body),
    );
  }

  @Get(":staffId")
  @RequirePermission(PERMISSIONS.STAFF_READ)
  @ApiOperation({ summary: "Get a single staff record for the current tenant" })
  @ApiOkResponse({ type: StaffDto })
  getStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.staffService.getStaff(
      institution.id,
      staffId,
      authSession,
      scopes,
    );
  }

  @Patch(":staffId")
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @ApiOperation({ summary: "Update a staff membership for the current tenant" })
  @ApiBody({ type: UpdateStaffBodyDto })
  @ApiOkResponse({ type: StaffDto })
  updateStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpdateStaffBodyDto,
  ) {
    return this.staffService.updateStaff(
      institution.id,
      staffId,
      authSession,
      scopes,
      parseUpdateStaff(body),
    );
  }

  @Patch(":staffId/status")
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @ApiOperation({ summary: "Enable or disable a staff membership" })
  @ApiBody({ type: SetStaffStatusBodyDto })
  @ApiOkResponse({ type: StaffDto })
  setStaffStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: SetStaffStatusBodyDto,
  ) {
    return this.staffService.setStaffStatus(
      institution.id,
      staffId,
      authSession,
      scopes,
      parseSetStaffStatus(body),
    );
  }

  @Delete(":staffId")
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a staff membership for the current tenant" })
  @ApiNoContentResponse()
  deleteStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.staffService.deleteStaff(
      institution.id,
      staffId,
      authSession,
      scopes,
    );
  }

  @Post(":staffId/reset-password")
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Reset a staff member's password to their mobile number",
  })
  @ApiNoContentResponse()
  resetPassword(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.staffService.resetMemberPassword(
      institution.id,
      staffId,
      authSession,
      scopes,
    );
  }

  @Get(`:staffId/${API_ROUTES.SUBJECTS}`)
  @RequirePermission(PERMISSIONS.STAFF_READ)
  @ApiOperation({ summary: "List subject assignments for a staff member" })
  @ApiOkResponse({ type: SubjectTeacherAssignmentDto, isArray: true })
  listSubjectAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
  ) {
    return this.staffService.listSubjectAssignments(
      institution.id,
      staffId,
      authSession,
      scopes,
    );
  }

  @Post(`:staffId/${API_ROUTES.SUBJECTS}`)
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @ApiOperation({ summary: "Assign a subject to a staff member" })
  @ApiBody({ type: CreateSubjectTeacherAssignmentBodyDto })
  @ApiOkResponse({ type: SubjectTeacherAssignmentDto })
  createSubjectAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
    @Body() body: CreateSubjectTeacherAssignmentBodyDto,
  ) {
    return this.staffService.createSubjectAssignment(
      institution.id,
      staffId,
      authSession,
      scopes,
      parseCreateSubjectTeacherAssignment(body),
    );
  }

  @Delete(`:staffId/${API_ROUTES.SUBJECTS}/:assignmentId`)
  @RequirePermission(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a subject assignment from a staff member" })
  @ApiNoContentResponse()
  removeSubjectAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
    @Param("assignmentId") assignmentId: string,
  ) {
    return this.staffService.removeSubjectAssignment(
      institution.id,
      staffId,
      assignmentId,
      authSession,
      scopes,
    );
  }

  @Delete(`:staffId/${API_ROUTES.ROLES}/:assignmentId`)
  @RequirePermission(PERMISSIONS.INSTITUTION_USERS_MANAGE)
  @ApiOperation({
    summary: "Remove a role assignment from a staff membership",
  })
  removeRoleAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("staffId") staffId: string,
    @Param("assignmentId") assignmentId: string,
  ) {
    return this.staffService.removeRoleAssignment(
      institution.id,
      staffId,
      assignmentId,
      authSession,
      scopes,
    );
  }
}
