import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuthService } from "../auth/auth.service";
import { FamilyOverviewDto } from "./family.dto";
import { parseFamilyOverviewQuery } from "./family.schemas";
import { FamilyService } from "./family.service";

@ApiTags(API_DOCS.TAGS.FAMILY)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.FAMILY)
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly authService: AuthService,
  ) {}

  @Get(API_ROUTES.OVERVIEW)
  @ApiOperation({
    summary: "Get the parent portal overview for the current tenant",
  })
  @ApiQuery({ name: "studentId", required: false, type: String })
  @ApiOkResponse({ type: FamilyOverviewDto })
  async getOverview(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: unknown,
  ) {
    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.familyService.getOverview(
      institution.id,
      authSession,
      authContext.linkedStudents,
      parseFamilyOverviewQuery(query),
    );
  }
}
