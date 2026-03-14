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
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateStaffBodyDto,
  StaffDto,
  StaffRoleDto,
  UpdateStaffBodyDto,
} from "./staff.dto";
import { parseCreateStaff, parseUpdateStaff } from "./staff.schemas";
import { StaffService } from "./staff.service";

@ApiTags(API_DOCS.TAGS.STAFF)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.STAFF)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: "List staff for the current tenant institution" })
  @ApiOkResponse({ type: StaffDto, isArray: true })
  listStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.listStaff(institution.id, authSession);
  }

  @Get(API_ROUTES.ROLES)
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

  @Post()
  @ApiOperation({ summary: "Create a staff membership for the current tenant" })
  @ApiBody({ type: CreateStaffBodyDto })
  @ApiOkResponse({ type: StaffDto })
  createStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateStaffBodyDto,
  ) {
    return this.staffService.createStaff(
      institution.id,
      authSession,
      parseCreateStaff(body),
    );
  }

  @Get(":staffId")
  @ApiOperation({ summary: "Get a single staff record for the current tenant" })
  @ApiOkResponse({ type: StaffDto })
  getStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.staffService.getStaff(institution.id, staffId, authSession);
  }

  @Patch(":staffId")
  @ApiOperation({ summary: "Update a staff membership for the current tenant" })
  @ApiBody({ type: UpdateStaffBodyDto })
  @ApiOkResponse({ type: StaffDto })
  updateStaff(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffId") staffId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateStaffBodyDto,
  ) {
    return this.staffService.updateStaff(
      institution.id,
      staffId,
      authSession,
      parseUpdateStaff(body),
    );
  }
}
