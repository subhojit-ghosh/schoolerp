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
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  AnnouncementDto,
  CreateAnnouncementBodyDto,
  ListAnnouncementsQueryDto,
  ListAnnouncementsResultDto,
  ListNotificationsQueryDto,
  ListNotificationsResultDto,
  MarkNotificationsReadBodyDto,
  SetAnnouncementStatusBodyDto,
  UpdateAnnouncementBodyDto,
} from "./communications.dto";
import {
  parseCreateAnnouncement,
  parseListAnnouncementsQuery,
  parseListNotificationsQuery,
  parseMarkNotificationsRead,
  parseSetAnnouncementStatus,
  parseUpdateAnnouncement,
} from "./communications.schemas";
import { CommunicationsService } from "./communications.service";

@ApiTags(API_DOCS.TAGS.COMMUNICATIONS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.COMMUNICATIONS)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get(API_ROUTES.ANNOUNCEMENTS)
  @RequirePermission(PERMISSIONS.COMMUNICATION_READ)
  @ApiOperation({ summary: "List announcements for the current tenant" })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "audience", required: false, type: String })
  @ApiOkResponse({ type: ListAnnouncementsResultDto })
  listAnnouncements(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListAnnouncementsQueryDto,
  ) {
    return this.communicationsService.listAnnouncements(
      institution.id,
      authSession,
      scopes,
      parseListAnnouncementsQuery(query),
    );
  }

  @Post(API_ROUTES.ANNOUNCEMENTS)
  @RequirePermission(PERMISSIONS.COMMUNICATION_MANAGE)
  @ApiOperation({ summary: "Create an announcement for the current tenant" })
  @ApiBody({ type: CreateAnnouncementBodyDto })
  @ApiOkResponse({ type: AnnouncementDto })
  createAnnouncement(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateAnnouncementBodyDto,
  ) {
    return this.communicationsService.createAnnouncement(
      institution.id,
      authSession,
      parseCreateAnnouncement(body),
    );
  }

  @Get(`${API_ROUTES.ANNOUNCEMENTS}/:announcementId`)
  @RequirePermission(PERMISSIONS.COMMUNICATION_READ)
  @ApiOperation({ summary: "Get an announcement for the current tenant" })
  @ApiOkResponse({ type: AnnouncementDto })
  getAnnouncement(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("announcementId") announcementId: string,
  ) {
    return this.communicationsService.getAnnouncement(
      institution.id,
      announcementId,
      authSession,
    );
  }

  @Patch(`${API_ROUTES.ANNOUNCEMENTS}/:announcementId`)
  @RequirePermission(PERMISSIONS.COMMUNICATION_MANAGE)
  @ApiOperation({ summary: "Update an announcement for the current tenant" })
  @ApiBody({ type: UpdateAnnouncementBodyDto })
  @ApiOkResponse({ type: AnnouncementDto })
  updateAnnouncement(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("announcementId") announcementId: string,
    @Body() body: UpdateAnnouncementBodyDto,
  ) {
    return this.communicationsService.updateAnnouncement(
      institution.id,
      announcementId,
      authSession,
      parseUpdateAnnouncement(body),
    );
  }

  @Patch(`${API_ROUTES.ANNOUNCEMENTS}/:announcementId/status`)
  @RequirePermission(PERMISSIONS.COMMUNICATION_MANAGE)
  @ApiOperation({ summary: "Update announcement workflow status" })
  @ApiBody({ type: SetAnnouncementStatusBodyDto })
  @ApiOkResponse({ type: AnnouncementDto })
  setAnnouncementStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("announcementId") announcementId: string,
    @Body() body: SetAnnouncementStatusBodyDto,
  ) {
    return this.communicationsService.setAnnouncementStatus(
      institution.id,
      announcementId,
      authSession,
      parseSetAnnouncementStatus(body),
    );
  }

  @Post(`${API_ROUTES.ANNOUNCEMENTS}/:announcementId/${API_ROUTES.PUBLISH}`)
  @RequirePermission(PERMISSIONS.COMMUNICATION_MANAGE)
  @ApiOperation({ summary: "Publish an announcement and emit a notification" })
  @ApiOkResponse({ type: AnnouncementDto })
  publishAnnouncement(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("announcementId") announcementId: string,
  ) {
    return this.communicationsService.publishAnnouncement(
      institution.id,
      announcementId,
      authSession,
    );
  }

  @Get(API_ROUTES.NOTIFICATIONS)
  @RequirePermission(PERMISSIONS.COMMUNICATION_READ)
  @ApiOperation({ summary: "List notification feed items for the current session" })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "unreadOnly", required: false, type: Boolean })
  @ApiQuery({ name: "actionRequired", required: false, type: Boolean })
  @ApiQuery({ name: "channel", required: false, type: String })
  @ApiOkResponse({ type: ListNotificationsResultDto })
  listNotifications(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.communicationsService.listNotifications(
      institution.id,
      authSession,
      scopes,
      parseListNotificationsQuery(query),
    );
  }

  @Post(`${API_ROUTES.NOTIFICATIONS}/${API_ROUTES.MARK_ALL_READ}`)
  @RequirePermission(PERMISSIONS.COMMUNICATION_READ)
  @ApiOperation({ summary: "Mark notifications as read for the current session" })
  @ApiBody({ type: MarkNotificationsReadBodyDto })
  @ApiOkResponse({
    schema: {
      properties: {
        updated: { type: "number" },
      },
    },
  })
  markNotificationsRead(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: MarkNotificationsReadBodyDto,
  ) {
    return this.communicationsService.markNotificationsRead(
      institution.id,
      authSession,
      scopes,
      parseMarkNotificationsRead(body),
    );
  }
}
