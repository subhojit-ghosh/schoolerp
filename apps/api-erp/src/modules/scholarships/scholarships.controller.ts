import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateScholarshipBodyDto,
  UpdateScholarshipBodyDto,
  UpdateScholarshipStatusBodyDto,
  ScholarshipDto,
  ScholarshipListResultDto,
  ListScholarshipsQueryParamsDto,
  CreateApplicationBodyDto,
  ListApplicationsQueryParamsDto,
  ReviewApplicationBodyDto,
  UpdateDbtStatusBodyDto,
  ScholarshipApplicationDto,
  ScholarshipApplicationListResultDto,
  ListExpiringApplicationsQueryParamsDto,
} from "./scholarships.dto";
import {
  parseCreateScholarship,
  parseUpdateScholarship,
  parseUpdateScholarshipStatus,
  parseListScholarshipsQuery,
  parseCreateApplication,
  parseListApplicationsQuery,
  parseReviewApplication,
  parseUpdateDbtStatus,
  parseListExpiringApplicationsQuery,
} from "./scholarships.schemas";
import { ScholarshipsService } from "./scholarships.service";

const SCHOLARSHIP_DETAIL_PATH = `${API_ROUTES.SCHOLARSHIPS}/:scholarshipId`;
const SCHOLARSHIP_STATUS_PATH = `${SCHOLARSHIP_DETAIL_PATH}/${API_ROUTES.STATUS}`;
const APPLICATION_DETAIL_PATH = `${API_ROUTES.SCHOLARSHIP_APPLICATIONS}/:applicationId`;
const APPLICATION_APPROVE_PATH = `${APPLICATION_DETAIL_PATH}/${API_ROUTES.APPROVE}`;
const APPLICATION_REJECT_PATH = `${APPLICATION_DETAIL_PATH}/${API_ROUTES.REJECT}`;
const APPLICATION_DBT_PATH = `${APPLICATION_DETAIL_PATH}/${API_ROUTES.DBT}`;
const APPLICATION_RENEW_PATH = `${APPLICATION_DETAIL_PATH}/${API_ROUTES.RENEW}`;
const EXPIRING_APPLICATIONS_PATH = `${API_ROUTES.SCHOLARSHIP_APPLICATIONS}/expiring`;

@ApiTags("scholarships")
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller()
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  // ── Scholarships ───────────────────────────────────────────────────────

  @Get(API_ROUTES.SCHOLARSHIPS)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_READ)
  @ApiOperation({ summary: "List scholarships" })
  @ApiOkResponse({ type: ScholarshipListResultDto })
  async listScholarships(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListScholarshipsQueryParamsDto,
  ) {
    const parsed = parseListScholarshipsQuery(query);
    return this.scholarshipsService.listScholarships(institution.id, parsed);
  }

  @Post(API_ROUTES.SCHOLARSHIPS)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({ summary: "Create a scholarship" })
  @ApiCreatedResponse({ type: ScholarshipDto })
  async createScholarship(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateScholarshipBodyDto,
  ) {
    const dto = parseCreateScholarship(body);
    return this.scholarshipsService.createScholarship(
      institution.id,
      session,
      dto,
    );
  }

  @Patch(SCHOLARSHIP_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({ summary: "Update a scholarship" })
  @ApiOkResponse({ type: ScholarshipDto })
  async updateScholarship(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("scholarshipId") scholarshipId: string,
    @Body() body: UpdateScholarshipBodyDto,
  ) {
    const dto = parseUpdateScholarship(body);
    return this.scholarshipsService.updateScholarship(
      institution.id,
      scholarshipId,
      session,
      dto,
    );
  }

  @Patch(SCHOLARSHIP_STATUS_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({ summary: "Update scholarship status" })
  @ApiOkResponse({ type: ScholarshipDto })
  async updateScholarshipStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("scholarshipId") scholarshipId: string,
    @Body() body: UpdateScholarshipStatusBodyDto,
  ) {
    const dto = parseUpdateScholarshipStatus(body);
    return this.scholarshipsService.updateScholarshipStatus(
      institution.id,
      scholarshipId,
      session,
      dto,
    );
  }

  // ── Applications ───────────────────────────────────────────────────────

  @Get(API_ROUTES.SCHOLARSHIP_APPLICATIONS)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_READ)
  @ApiOperation({ summary: "List scholarship applications" })
  @ApiOkResponse({ type: ScholarshipApplicationListResultDto })
  async listApplications(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListApplicationsQueryParamsDto,
  ) {
    const parsed = parseListApplicationsQuery(query);
    return this.scholarshipsService.listApplications(institution.id, parsed);
  }

  @Post(API_ROUTES.SCHOLARSHIP_APPLICATIONS)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({ summary: "Create a scholarship application" })
  @ApiCreatedResponse({ type: ScholarshipApplicationDto })
  async createApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateApplicationBodyDto,
  ) {
    const dto = parseCreateApplication(body);
    return this.scholarshipsService.createApplication(
      institution.id,
      session,
      dto,
    );
  }

  @Get(APPLICATION_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_READ)
  @ApiOperation({ summary: "Get a scholarship application" })
  @ApiOkResponse({ type: ScholarshipApplicationDto })
  async getApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("applicationId") applicationId: string,
  ) {
    return this.scholarshipsService.getApplication(
      institution.id,
      applicationId,
    );
  }

  @Post(APPLICATION_APPROVE_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({
    summary: "Approve a scholarship application",
  })
  @ApiOkResponse({ type: ScholarshipApplicationDto })
  async approveApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
    @Body() body: ReviewApplicationBodyDto,
  ) {
    const dto = parseReviewApplication(body);
    return this.scholarshipsService.approveApplication(
      institution.id,
      applicationId,
      session,
      dto,
    );
  }

  @Post(APPLICATION_REJECT_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({
    summary: "Reject a scholarship application",
  })
  @ApiOkResponse({ type: ScholarshipApplicationDto })
  async rejectApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
    @Body() body: ReviewApplicationBodyDto,
  ) {
    const dto = parseReviewApplication(body);
    return this.scholarshipsService.rejectApplication(
      institution.id,
      applicationId,
      session,
      dto,
    );
  }

  // ── DBT Tracking ──────────────────────────────────────────────────────

  @Patch(APPLICATION_DBT_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({
    summary: "Update DBT status for a scholarship application",
  })
  @ApiOkResponse({ type: ScholarshipApplicationDto })
  async updateDbtStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
    @Body() body: UpdateDbtStatusBodyDto,
  ) {
    const dto = parseUpdateDbtStatus(body);
    return this.scholarshipsService.updateDbtStatus(
      institution.id,
      applicationId,
      session,
      dto,
    );
  }

  // ── Renewal ────────────────────────────────────────────────────────────

  @Post(APPLICATION_RENEW_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_MANAGE)
  @ApiOperation({
    summary: "Renew an expiring scholarship application",
  })
  @ApiCreatedResponse({ type: ScholarshipApplicationDto })
  async renewApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("applicationId") applicationId: string,
  ) {
    return this.scholarshipsService.renewApplication(
      institution.id,
      applicationId,
      session,
    );
  }

  @Get(EXPIRING_APPLICATIONS_PATH)
  @RequirePermission(PERMISSIONS.SCHOLARSHIPS_READ)
  @ApiOperation({
    summary: "List scholarship applications expiring soon",
  })
  @ApiOkResponse({ type: ScholarshipApplicationListResultDto })
  async listExpiringApplications(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListExpiringApplicationsQueryParamsDto,
  ) {
    const parsed = parseListExpiringApplicationsQuery(query);
    return this.scholarshipsService.listExpiringApplications(
      institution.id,
      parsed,
    );
  }
}
