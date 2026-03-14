import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  InstitutionCountsDto,
  InstitutionDto,
  ListInstitutionsQueryDto,
  ListInstitutionsResultDto,
  UpdateBrandingBodyDto,
  UpdateBrandingResponseDto,
} from "./institutions.dto";
import { InstitutionsService } from "./institutions.service";
import {
  parseListInstitutionsQuery,
  parseUpdateBranding,
} from "./institutions.schemas";

@ApiTags(API_DOCS.TAGS.INSTITUTIONS)
@Controller(API_ROUTES.INSTITUTIONS)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: "List institutions" })
  @ApiOkResponse({
    description: "Paginated institution list",
    type: ListInstitutionsResultDto,
  })
  async listInstitutions(@Query() query: ListInstitutionsQueryDto) {
    const parsedQuery = parseListInstitutionsQuery(query);
    return this.institutionsService.listInstitutions(parsedQuery);
  }

  @Get(API_ROUTES.COUNTS)
  @ApiOperation({ summary: "Count institutions by status" })
  @ApiOkResponse({
    description: "Institution counters",
    type: InstitutionCountsDto,
  })
  getInstitutionCounts() {
    return this.institutionsService.countInstitutionsByStatus();
  }

  @UseGuards(SessionAuthGuard, TenantInstitutionGuard)
  @Patch(`${API_ROUTES.CURRENT}/${API_ROUTES.BRANDING}`)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Update branding colors for the current tenant institution",
  })
  @ApiBody({ type: UpdateBrandingBodyDto })
  @ApiOkResponse({ type: UpdateBrandingResponseDto })
  async updateBranding(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: UpdateBrandingBodyDto,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    if (authSession.activeOrganizationId !== institution.id) {
      throw new ForbiddenException(
        "You do not have permission to update this institution.",
      );
    }

    return this.institutionsService.updateBranding(
      institution.id,
      parseUpdateBranding(body),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get institution by id" })
  @ApiOkResponse({
    description: "Institution details",
    type: InstitutionDto,
  })
  @ApiNotFoundResponse({ description: "Institution not found" })
  async getInstitutionById(@Param("id") id: string) {
    const institution = await this.institutionsService.getInstitutionById(id);

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    return institution;
  }
}
