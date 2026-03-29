import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { PtmService } from "./ptm.service";

@ApiTags(API_DOCS.TAGS.CALENDAR)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller("ptm")
export class PtmController {
  constructor(private readonly ptmService: PtmService) {}

  @Get("sessions")
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List PTM sessions" })
  async listSessions(@CurrentInstitution() institution: TenantInstitution) {
    return this.ptmService.listSessions(institution.id);
  }

  @Post("sessions")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Create a PTM session" })
  async createSession(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body()
    body: {
      title: string;
      description?: string;
      ptmDate: string;
      startTime: string;
      endTime: string;
      slotDurationMinutes?: number;
      campusId?: string;
    },
  ) {
    return this.ptmService.createSession(institution.id, session, body);
  }

  @Patch("sessions/:sessionId")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Update a PTM session" })
  async updateSession(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("sessionId") sessionId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: "scheduled" | "in_progress" | "completed" | "cancelled";
    },
  ) {
    return this.ptmService.updateSession(
      institution.id,
      sessionId,
      session,
      body,
    );
  }

  @Get("sessions/:sessionId/slots")
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "List slots for a PTM session" })
  async listSlots(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("sessionId") sessionId: string,
  ) {
    return this.ptmService.listSlots(institution.id, sessionId);
  }

  @Post("sessions/:sessionId/generate-slots")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Generate time slots for teachers" })
  async generateSlots(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("sessionId") sessionId: string,
    @Body() body: { teacherMembershipIds: string[] },
  ) {
    return this.ptmService.generateSlots(
      institution.id,
      sessionId,
      body.teacherMembershipIds,
    );
  }

  @Post("slots/:slotId/book")
  @RequirePermission(PERMISSIONS.ACADEMICS_READ)
  @ApiOperation({ summary: "Book a PTM slot (parent or admin)" })
  async bookSlot(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("slotId") slotId: string,
    @Body()
    body: { studentMembershipId: string; parentMembershipId: string },
  ) {
    return this.ptmService.bookSlot(institution.id, slotId, body);
  }

  @Post("slots/:slotId/feedback")
  @RequirePermission(PERMISSIONS.ACADEMICS_MANAGE)
  @ApiOperation({ summary: "Record feedback and attendance for a PTM slot" })
  async recordFeedback(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("slotId") slotId: string,
    @Body() body: { feedback: string; attendanceMarked: boolean },
  ) {
    return this.ptmService.recordFeedback(institution.id, slotId, body);
  }
}
