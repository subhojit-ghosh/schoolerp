import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { NotificationPreferencesService } from "./notification-preferences.service";

@ApiTags(API_DOCS.TAGS.COMMUNICATIONS)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller("notification-preferences")
export class NotificationPreferencesController {
  constructor(
    private readonly notificationPreferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get notification preferences for current user" })
  async getPreferences(
    @CurrentSession() session: AuthenticatedSession,
    @CurrentInstitution() institution: TenantInstitution,
  ) {
    return this.notificationPreferencesService.getPreferences(
      session.user.id,
      institution.id,
    );
  }

  @Put()
  @ApiOperation({ summary: "Update notification preferences for current user" })
  async updatePreferences(
    @CurrentSession() session: AuthenticatedSession,
    @CurrentInstitution() institution: TenantInstitution,
    @Body()
    body: {
      channelSms?: boolean;
      channelEmail?: boolean;
      channelInApp?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      digestMode?: "instant" | "daily" | "weekly";
    },
  ) {
    return this.notificationPreferencesService.updatePreferences(
      session.user.id,
      institution.id,
      body,
    );
  }
}
