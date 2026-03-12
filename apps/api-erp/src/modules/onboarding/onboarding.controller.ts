import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { API_DOCS, API_ROUTES } from "../../constants";
import { AuthContextDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { CreateInstitutionOnboardingBodyDto } from "./onboarding.dto";
import { parseCreateInstitutionOnboarding } from "./onboarding.schemas";
import { OnboardingService } from "./onboarding.service";

@ApiTags(API_DOCS.TAGS.ONBOARDING)
@Controller(API_ROUTES.ONBOARDING)
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
  ) {}

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
