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
  CreateSubjectBodyDto,
  ListSubjectsQueryDto,
  ListSubjectsResultDto,
  SetSubjectStatusBodyDto,
  SubjectDto,
  UpdateSubjectBodyDto,
} from "./subjects.dto";
import {
  parseCreateSubject,
  parseListSubjectsQuery,
  parseSetSubjectStatus,
  parseUpdateSubject,
} from "./subjects.schemas";
import { SubjectsService } from "./subjects.service";

@ApiTags(API_DOCS.TAGS.SUBJECTS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.SUBJECTS)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List subjects for the current tenant institution" })
  @ApiQuery({ name: "campusId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiOkResponse({ type: ListSubjectsResultDto })
  listSubjects(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListSubjectsQueryDto,
  ) {
    return this.subjectsService.listSubjects(
      institution.id,
      authSession,
      scopes,
      parseListSubjectsQuery(query),
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Create a subject for the current tenant" })
  @ApiBody({ type: CreateSubjectBodyDto })
  @ApiOkResponse({ type: SubjectDto })
  createSubject(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateSubjectBodyDto,
  ) {
    return this.subjectsService.createSubject(
      institution.id,
      authSession,
      parseCreateSubject(body),
    );
  }

  @Get(":subjectId")
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "Get a subject for the current tenant" })
  @ApiOkResponse({ type: SubjectDto })
  getSubject(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("subjectId") subjectId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.subjectsService.getSubject(institution.id, subjectId, authSession);
  }

  @Patch(":subjectId")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Update a subject for the current tenant" })
  @ApiBody({ type: UpdateSubjectBodyDto })
  @ApiOkResponse({ type: SubjectDto })
  updateSubject(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("subjectId") subjectId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateSubjectBodyDto,
  ) {
    return this.subjectsService.updateSubject(
      institution.id,
      subjectId,
      authSession,
      parseUpdateSubject(body),
    );
  }

  @Patch(":subjectId/status")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Enable or disable a subject for the current tenant" })
  @ApiBody({ type: SetSubjectStatusBodyDto })
  @ApiOkResponse({ type: SubjectDto })
  setSubjectStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("subjectId") subjectId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: SetSubjectStatusBodyDto,
  ) {
    return this.subjectsService.setSubjectStatus(
      institution.id,
      subjectId,
      authSession,
      parseSetSubjectStatus(body),
    );
  }

  @Delete(":subjectId")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a subject for the current tenant" })
  @ApiNoContentResponse()
  deleteSubject(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("subjectId") subjectId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.subjectsService.deleteSubject(institution.id, subjectId, authSession);
  }
}
