import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
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
  AcademicYearDto,
  CreateAcademicYearBodyDto,
  UpdateAcademicYearBodyDto,
} from "./academic-years.dto";
import {
  parseCreateAcademicYear,
  parseUpdateAcademicYear,
} from "./academic-years.schemas";
import { AcademicYearsService } from "./academic-years.service";

@ApiTags(API_DOCS.TAGS.ACADEMIC_YEARS)
@Controller(
  `${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.ACADEMIC_YEARS}`,
)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List academic years for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({
    description: "Academic years list",
    type: [AcademicYearDto],
  })
  listAcademicYears(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.academicYearsService.listAcademicYears(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create an academic year for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateAcademicYearBodyDto })
  @ApiCreatedResponse({
    description: "Academic year created",
    type: AcademicYearDto,
  })
  createAcademicYear(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateAcademicYearBodyDto,
  ) {
    return this.academicYearsService.createAcademicYear(
      institutionId,
      authSession,
      parseCreateAcademicYear(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(":academicYearId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a single academic year" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "academicYearId", type: String })
  @ApiOkResponse({ description: "Academic year detail", type: AcademicYearDto })
  getAcademicYear(
    @Param("institutionId") institutionId: string,
    @Param("academicYearId") academicYearId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.academicYearsService.getAcademicYear(
      institutionId,
      academicYearId,
      authSession,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":academicYearId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update an academic year" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "academicYearId", type: String })
  @ApiBody({ type: UpdateAcademicYearBodyDto })
  @ApiOkResponse({ description: "Academic year updated", type: AcademicYearDto })
  updateAcademicYear(
    @Param("institutionId") institutionId: string,
    @Param("academicYearId") academicYearId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateAcademicYearBodyDto,
  ) {
    return this.academicYearsService.updateAcademicYear(
      institutionId,
      academicYearId,
      authSession,
      parseUpdateAcademicYear(body),
    );
  }
}
