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
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
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
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateRoleBodyDto,
  PermissionDto,
  RoleDto,
  UpdateRoleBodyDto,
} from "./roles.dto";
import { parseCreateRole, parseUpdateRole } from "./roles.schemas";
import { RolesService } from "./roles.service";

@ApiTags(API_DOCS.TAGS.ROLES)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.ROLES)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @ApiOperation({ summary: "List all roles for the current tenant" })
  @ApiOkResponse({ type: RoleDto, isArray: true })
  listRoles(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.rolesService.listRoles(institution.id, authSession);
  }

  @Get(`:roleId`)
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @ApiOperation({ summary: "Get a single role for the current tenant" })
  @ApiOkResponse({ type: RoleDto })
  getRole(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("roleId") roleId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.rolesService.getRole(institution.id, roleId, authSession);
  }

  @Post()
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @ApiOperation({ summary: "Create a custom role for the current tenant" })
  @ApiBody({ type: CreateRoleBodyDto })
  @ApiCreatedResponse({ type: RoleDto })
  createRole(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateRoleBodyDto,
  ) {
    return this.rolesService.createRole(
      institution.id,
      authSession,
      parseCreateRole(body),
    );
  }

  @Patch(":roleId")
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @ApiOperation({ summary: "Update a custom role for the current tenant" })
  @ApiBody({ type: UpdateRoleBodyDto })
  @ApiOkResponse({ type: RoleDto })
  updateRole(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("roleId") roleId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateRoleBodyDto,
  ) {
    return this.rolesService.updateRole(
      institution.id,
      roleId,
      authSession,
      parseUpdateRole(body),
    );
  }

  @Delete(":roleId")
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a custom role for the current tenant" })
  @ApiNoContentResponse()
  deleteRole(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("roleId") roleId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.rolesService.deleteRole(institution.id, roleId, authSession);
  }
}

@ApiTags(API_DOCS.TAGS.ROLES)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.PERMISSIONS_LIST)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INSTITUTION_ROLES_MANAGE)
  @ApiOperation({ summary: "List all available permission slugs" })
  @ApiOkResponse({ type: PermissionDto, isArray: true })
  listPermissions() {
    return this.rolesService.listPermissions();
  }
}
