import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
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
import { CampusDto, CreateCampusBodyDto } from "./campuses.dto";
import { parseCreateCampus } from "./campuses.schemas";
import { CampusesService } from "./campuses.service";

@ApiTags(API_DOCS.TAGS.CAMPUSES)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.CAMPUSES}`)
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List campuses for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: CampusDto, isArray: true })
  listCampuses(@Param("institutionId") institutionId: string) {
    return this.campusesService.listCampuses(institutionId);
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a campus for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateCampusBodyDto })
  @ApiOkResponse({ type: CampusDto })
  createCampus(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateCampusBodyDto,
  ) {
    return this.campusesService.createCampus(
      institutionId,
      authSession.user.id,
      parseCreateCampus(body),
    );
  }
}
