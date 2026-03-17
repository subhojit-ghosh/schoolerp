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
  CalendarEventDto,
  CreateCalendarEventBodyDto,
  ListCalendarEventsQueryDto,
  ListCalendarEventsResultDto,
  SetCalendarEventStatusBodyDto,
  UpdateCalendarEventBodyDto,
} from "./calendar.dto";
import {
  parseCreateCalendarEvent,
  parseListCalendarEventsQuery,
  parseSetCalendarEventStatus,
  parseUpdateCalendarEvent,
} from "./calendar.schemas";
import { CalendarService } from "./calendar.service";

@ApiTags(API_DOCS.TAGS.CALENDAR)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.CALENDAR)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get(API_ROUTES.EVENTS)
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List calendar events for the current tenant" })
  @ApiQuery({ name: "campusId", required: false, type: String })
  @ApiQuery({ name: "fromDate", required: false, type: String })
  @ApiQuery({ name: "toDate", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiOkResponse({ type: ListCalendarEventsResultDto })
  listEvents(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListCalendarEventsQueryDto,
  ) {
    return this.calendarService.listEvents(
      institution.id,
      authSession,
      scopes,
      parseListCalendarEventsQuery(query),
    );
  }

  @Post(API_ROUTES.EVENTS)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Create a calendar event for the current tenant" })
  @ApiBody({ type: CreateCalendarEventBodyDto })
  @ApiOkResponse({ type: CalendarEventDto })
  createEvent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateCalendarEventBodyDto,
  ) {
    return this.calendarService.createEvent(
      institution.id,
      authSession,
      parseCreateCalendarEvent(body),
    );
  }

  @Get(`${API_ROUTES.EVENTS}/:eventId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "Get a calendar event for the current tenant" })
  @ApiOkResponse({ type: CalendarEventDto })
  getEvent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("eventId") eventId: string,
  ) {
    return this.calendarService.getEvent(institution.id, eventId, authSession);
  }

  @Patch(`${API_ROUTES.EVENTS}/:eventId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Update a calendar event for the current tenant" })
  @ApiBody({ type: UpdateCalendarEventBodyDto })
  @ApiOkResponse({ type: CalendarEventDto })
  updateEvent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("eventId") eventId: string,
    @Body() body: UpdateCalendarEventBodyDto,
  ) {
    return this.calendarService.updateEvent(
      institution.id,
      eventId,
      authSession,
      parseUpdateCalendarEvent(body),
    );
  }

  @Patch(`${API_ROUTES.EVENTS}/:eventId/status`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Enable or disable a calendar event" })
  @ApiBody({ type: SetCalendarEventStatusBodyDto })
  @ApiOkResponse({ type: CalendarEventDto })
  setEventStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("eventId") eventId: string,
    @Body() body: SetCalendarEventStatusBodyDto,
  ) {
    return this.calendarService.setEventStatus(
      institution.id,
      eventId,
      authSession,
      parseSetCalendarEventStatus(body),
    );
  }

  @Delete(`${API_ROUTES.EVENTS}/:eventId`)
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a calendar event for the current tenant" })
  @ApiNoContentResponse()
  deleteEvent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("eventId") eventId: string,
  ) {
    return this.calendarService.deleteEvent(institution.id, eventId, authSession);
  }
}
