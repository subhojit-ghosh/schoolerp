import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { AuthService } from "../auth/auth.service";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import { StudentPortalOverviewDto } from "./student-portal.dto";
import { parseStudentPortalOverviewQuery } from "./student-portal.schemas";
import { StudentPortalService } from "./student-portal.service";

@ApiTags(API_DOCS.TAGS.STUDENT_PORTAL)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.STUDENT_PORTAL)
export class StudentPortalController {
  constructor(
    private readonly authService: AuthService,
    private readonly studentPortalService: StudentPortalService,
  ) {}

  @Get(API_ROUTES.OVERVIEW)
  @ApiOperation({
    summary: "Get the student portal overview for the current tenant",
  })
  @ApiQuery({ name: "examTermId", required: false, type: String })
  @ApiOkResponse({ type: StudentPortalOverviewDto })
  async getOverview(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: unknown,
  ) {
    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.studentPortalService.getOverview(
      institution.id,
      authSession,
      authContext.activeContext,
      parseStudentPortalOverviewQuery(query),
    );
  }
}
