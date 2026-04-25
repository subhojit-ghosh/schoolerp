import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { API_DOCS, API_ROUTES } from "../../constants";
import { AuthContextDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CheckSlugAvailabilityDto,
  CreateInstitutionOnboardingBodyDto,
  SetupStatusDto,
} from "./onboarding.dto";
import { parseCreateInstitutionOnboarding } from "./onboarding.schemas";
import { OnboardingService } from "./onboarding.service";

@ApiTags(API_DOCS.TAGS.ONBOARDING)
@Controller(API_ROUTES.ONBOARDING)
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
  ) {}

  @Get("setup-status")
  @UseGuards(SessionAuthGuard, TenantInstitutionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get institution setup progress (entity counts)" })
  @ApiOkResponse({ type: SetupStatusDto })
  async getSetupStatus(@CurrentInstitution() institution: TenantInstitution) {
    return this.onboardingService.getSetupStatus(institution.id);
  }

  @Get("check-slug")
  @ApiOperation({ summary: "Check if a subdomain slug is available" })
  @ApiQuery({ name: "slug", required: true, type: String })
  @ApiOkResponse({ type: CheckSlugAvailabilityDto })
  async checkSlug(@Query("slug") slug: string) {
    return this.onboardingService.checkSlugAvailability(slug ?? "");
  }

  @Post(API_ROUTES.INSTITUTIONS)
  @ApiOperation({
    summary: "Create an institution, default campus, and first admin account",
  })
  @ApiBody({ type: CreateInstitutionOnboardingBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async createInstitution(
    @Body() body: CreateInstitutionOnboardingBodyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { authContext, authSession } =
      await this.onboardingService.createInstitution(
        parseCreateInstitutionOnboarding(body),
        {
          ipAddress: request.ip ?? null,
          userAgent: request.headers["user-agent"] ?? null,
        },
      );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
    );

    return this.authService.toContextDto(authContext);
  }
}
