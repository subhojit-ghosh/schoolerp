import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
import { CampusDto, CreateCampusBodyDto } from "./campuses.dto";
import { parseCreateCampus } from "./campuses.schemas";
import { CampusesService } from "./campuses.service";

@ApiTags(API_DOCS.TAGS.CAMPUSES)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.CAMPUSES)
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  @ApiOperation({ summary: "List campuses for the current tenant institution" })
  @ApiOkResponse({ type: CampusDto, isArray: true })
  listCampuses(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.campusesService.listCampuses(institution.id, authSession);
  }

  @Post()
  @ApiOperation({
    summary: "Create a campus for the current tenant institution",
  })
  @ApiBody({ type: CreateCampusBodyDto })
  @ApiOkResponse({ type: CampusDto })
  createCampus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateCampusBodyDto,
  ) {
    return this.campusesService.createCampus(
      institution.id,
      authSession,
      parseCreateCampus(body),
    );
  }
}
