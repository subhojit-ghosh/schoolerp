import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
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
import { CurrentScopes } from "../auth/current-scopes.decorator";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  BulkUpsertSubmissionsBodyDto,
  ClassHomeworkAnalyticsDto,
  CreateHomeworkBodyDto,
  HomeworkAnalyticsDto,
  HomeworkDto,
  HomeworkListResultDto,
  ListHomeworkQueryParamsDto,
  ListSubmissionsQueryParamsDto,
  SubmissionListResultDto,
  UpdateHomeworkBodyDto,
} from "./homework.dto";
import {
  parseBulkUpsertSubmissions,
  parseCreateHomework,
  parseListHomeworkQuery,
  parseListSubmissionsQuery,
  parseUpdateHomework,
} from "./homework.schemas";
import { HomeworkService } from "./homework.service";

@ApiTags(API_DOCS.TAGS.HOMEWORK)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.HOMEWORK)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  @RequirePermission(PERMISSIONS.HOMEWORK_READ)
  @ApiOperation({ summary: "List homework assignments" })
  @ApiOkResponse({ type: HomeworkListResultDto })
  async listHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListHomeworkQueryParamsDto,
  ) {
    const parsed = parseListHomeworkQuery(query);
    return this.homeworkService.listHomework(
      institution.id,
      session,
      scopes,
      parsed,
    );
  }

  @Get(`:homeworkId`)
  @RequirePermission(PERMISSIONS.HOMEWORK_READ)
  @ApiOperation({ summary: "Get a homework assignment" })
  @ApiOkResponse({ type: HomeworkDto })
  async getHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
  ) {
    return this.homeworkService.getHomework(institution.id, scopes, homeworkId);
  }

  @Post()
  @RequirePermission(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: "Create a homework assignment" })
  @ApiCreatedResponse({ type: HomeworkDto })
  async createHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateHomeworkBodyDto,
  ) {
    const dto = parseCreateHomework(body);
    return this.homeworkService.createHomework(
      institution.id,
      session,
      scopes,
      dto,
    );
  }

  @Put(`:homeworkId`)
  @RequirePermission(PERMISSIONS.HOMEWORK_MANAGE)
  @ApiOperation({ summary: "Update a homework assignment" })
  @ApiOkResponse({ type: HomeworkDto })
  async updateHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
    @Body() body: UpdateHomeworkBodyDto,
  ) {
    const dto = parseUpdateHomework(body);
    return this.homeworkService.updateHomework(
      institution.id,
      session,
      scopes,
      homeworkId,
      dto,
    );
  }

  @Post(`:homeworkId/${API_ROUTES.PUBLISH}`)
  @RequirePermission(PERMISSIONS.HOMEWORK_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Publish a homework assignment" })
  @ApiOkResponse({ type: HomeworkDto })
  async publishHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
  ) {
    return this.homeworkService.publishHomework(
      institution.id,
      session,
      scopes,
      homeworkId,
    );
  }

  @Delete(`:homeworkId`)
  @RequirePermission(PERMISSIONS.HOMEWORK_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a homework assignment" })
  @ApiNoContentResponse()
  async deleteHomework(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
  ) {
    await this.homeworkService.deleteHomework(
      institution.id,
      session,
      scopes,
      homeworkId,
    );
  }

  // ── Submissions ────────────────────────────────────────────────────────

  @Post(`:homeworkId/${API_ROUTES.SUBMISSIONS}`)
  @RequirePermission(PERMISSIONS.HOMEWORK_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Bulk upsert homework submissions" })
  @ApiOkResponse({ description: "Number of submissions updated" })
  async bulkUpsertSubmissions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
    @Body() body: BulkUpsertSubmissionsBodyDto,
  ) {
    const dto = parseBulkUpsertSubmissions(body);
    return this.homeworkService.bulkUpsertSubmissions(
      institution.id,
      session,
      scopes,
      homeworkId,
      dto,
    );
  }

  @Get(`:homeworkId/${API_ROUTES.SUBMISSIONS}`)
  @RequirePermission(PERMISSIONS.HOMEWORK_READ)
  @ApiOperation({ summary: "List submissions for a homework assignment" })
  @ApiOkResponse({ type: SubmissionListResultDto })
  async listSubmissions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
    @Query() query: ListSubmissionsQueryParamsDto,
  ) {
    const parsed = parseListSubmissionsQuery(query);
    return this.homeworkService.listSubmissions(
      institution.id,
      scopes,
      homeworkId,
      parsed,
    );
  }

  // ── Analytics ──────────────────────────────────────────────────────────

  @Get(`:homeworkId/${API_ROUTES.ANALYTICS}`)
  @RequirePermission(PERMISSIONS.HOMEWORK_READ)
  @ApiOperation({ summary: "Get submission analytics for a homework" })
  @ApiOkResponse({ type: HomeworkAnalyticsDto })
  async getHomeworkAnalytics(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("homeworkId") homeworkId: string,
  ) {
    return this.homeworkService.getHomeworkAnalytics(
      institution.id,
      scopes,
      homeworkId,
    );
  }

  @Get(`${API_ROUTES.ANALYTICS}/:classId`)
  @RequirePermission(PERMISSIONS.HOMEWORK_READ)
  @ApiOperation({
    summary: "Get class-wise homework completion analytics",
  })
  @ApiOkResponse({ type: [ClassHomeworkAnalyticsDto] })
  async getClassAnalytics(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("classId") classId: string,
  ) {
    return this.homeworkService.getClassAnalytics(
      institution.id,
      scopes,
      classId,
    );
  }
}
