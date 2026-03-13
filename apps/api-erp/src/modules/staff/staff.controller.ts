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
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  CreateStaffBodyDto,
  StaffDto,
  StaffRoleDto,
  UpdateStaffBodyDto,
} from "./staff.dto";
import { parseCreateStaff, parseUpdateStaff } from "./staff.schemas";
import { StaffService } from "./staff.service";

@ApiTags(API_DOCS.TAGS.STAFF)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.STAFF}`)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List staff for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: StaffDto, isArray: true })
  listStaff(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.listStaff(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.ROLES)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List available staff roles for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: StaffRoleDto, isArray: true })
  listRoles(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.listRoles(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a staff membership for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateStaffBodyDto })
  @ApiOkResponse({ type: StaffDto })
  createStaff(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateStaffBodyDto,
  ) {
    return this.staffService.createStaff(
      institutionId,
      authSession,
      parseCreateStaff(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(":staffId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a single staff record for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "staffId", type: String })
  @ApiOkResponse({ type: StaffDto })
  getStaff(
    @Param("institutionId") institutionId: string,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.getStaff(institutionId, staffId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":staffId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a staff membership for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "staffId", type: String })
  @ApiBody({ type: UpdateStaffBodyDto })
  @ApiOkResponse({ type: StaffDto })
  updateStaff(
    @Param("institutionId") institutionId: string,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateStaffBodyDto,
  ) {
    return this.staffService.updateStaff(
      institutionId,
      staffId,
      authSession,
      parseUpdateStaff(body),
    );
  }
}
