import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import {
  AcademicYearDto,
  CreateAcademicYearBodyDto,
} from "./academic-years.dto";
import {
  parseCreateAcademicYear,
} from "./academic-years.schemas";
import { AcademicYearsService } from "./academic-years.service";

@ApiTags(API_DOCS.TAGS.ACADEMIC_YEARS)
@Controller(
  `${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.ACADEMIC_YEARS}`,
)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: "List academic years for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ description: "Academic years list", type: [AcademicYearDto] })
  listAcademicYears(@Param("institutionId") institutionId: string) {
    return this.academicYearsService.listAcademicYears(institutionId);
  }

  @Post()
  @ApiOperation({ summary: "Create an academic year for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateAcademicYearBodyDto })
  @ApiCreatedResponse({ description: "Academic year created" })
  createAcademicYear(
    @Param("institutionId") institutionId: string,
    @Body() body: CreateAcademicYearBodyDto,
  ) {
    return this.academicYearsService.createAcademicYear(
      institutionId,
      parseCreateAcademicYear(body),
    );
  }

  @Patch(`:academicYearId/${API_ROUTES.CURRENT}`)
  @ApiOperation({ summary: "Set current academic year" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "academicYearId", type: String })
  @ApiOkResponse({ description: "Academic year set as current" })
  setCurrentAcademicYear(
    @Param("institutionId") institutionId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.academicYearsService.setCurrentAcademicYear(
      institutionId,
      academicYearId,
    );
  }

  @Patch(`:academicYearId/${API_ROUTES.ARCHIVE}`)
  @ApiOperation({ summary: "Archive an academic year" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "academicYearId", type: String })
  @ApiOkResponse({ description: "Academic year archived" })
  archiveAcademicYear(
    @Param("institutionId") institutionId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.academicYearsService.archiveAcademicYear(
      institutionId,
      academicYearId,
    );
  }

  @Patch(`:academicYearId/${API_ROUTES.RESTORE}`)
  @ApiOperation({ summary: "Restore an academic year" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "academicYearId", type: String })
  @ApiOkResponse({ description: "Academic year restored" })
  restoreAcademicYear(
    @Param("institutionId") institutionId: string,
    @Param("academicYearId") academicYearId: string,
  ) {
    return this.academicYearsService.restoreAcademicYear(
      institutionId,
      academicYearId,
    );
  }
}
