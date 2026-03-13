import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
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
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.ACADEMIC_YEARS)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: "List academic years for the current tenant institution" })
  @ApiOkResponse({
    description: "Academic years list",
    type: [AcademicYearDto],
  })
  listAcademicYears(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.academicYearsService.listAcademicYears(institution.id, authSession);
  }

  @Post()
  @ApiOperation({ summary: "Create an academic year for the current tenant" })
  @ApiBody({ type: CreateAcademicYearBodyDto })
  @ApiCreatedResponse({
    description: "Academic year created",
    type: AcademicYearDto,
  })
  createAcademicYear(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateAcademicYearBodyDto,
  ) {
    return this.academicYearsService.createAcademicYear(
      institution.id,
      authSession,
      parseCreateAcademicYear(body),
    );
  }

  @Get(":academicYearId")
  @ApiOperation({ summary: "Get a single academic year" })
  @ApiOkResponse({ description: "Academic year detail", type: AcademicYearDto })
  getAcademicYear(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("academicYearId") academicYearId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.academicYearsService.getAcademicYear(
      institution.id,
      academicYearId,
      authSession,
    );
  }

  @Patch(":academicYearId")
  @ApiOperation({ summary: "Update an academic year" })
  @ApiBody({ type: UpdateAcademicYearBodyDto })
  @ApiOkResponse({ description: "Academic year updated", type: AcademicYearDto })
  updateAcademicYear(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("academicYearId") academicYearId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateAcademicYearBodyDto,
  ) {
    return this.academicYearsService.updateAcademicYear(
      institution.id,
      academicYearId,
      authSession,
      parseUpdateAcademicYear(body),
    );
  }
}
