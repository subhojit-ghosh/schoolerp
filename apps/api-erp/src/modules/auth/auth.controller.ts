import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { API_DOCS, API_ROUTES, AUTH_COOKIE } from "../../constants";
import { CurrentSession } from "./current-session.decorator";
import {
  AuthContextDto,
  ChangePasswordBodyDto,
  ChangePasswordResponseDto,
  CompleteSetupBodyDto,
  ForgotPasswordBodyDto,
  ForgotPasswordResponseDto,
  ResetPasswordBodyDto,
  ResetPasswordResponseDto,
  SignInBodyDto,
  SignUpBodyDto,
  SwitchCampusBodyDto,
  SwitchContextBodyDto,
} from "./auth.dto";
import { AUTH_ROUTES } from "./auth.constants";
import { LocalAuthGuard } from "./local-auth.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { TenantContextService } from "../tenant-context/tenant-context.service";
import { AuthService } from "./auth.service";
import {
  parseChangePassword,
  parseCompleteSetup,
  parseForgotPassword,
  parseResetPassword,
  parseSignUp,
  parseSwitchCampus,
  parseSwitchContext,
} from "./auth.schemas";
import type { AuthenticatedSession, AuthenticatedUser, ValidatedUser } from "./auth.types";
import { readCookieValue } from "./auth.utils";

@ApiTags(API_DOCS.TAGS.AUTH)
@Controller(API_ROUTES.AUTH)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post(AUTH_ROUTES.SIGN_UP)
  @ApiOperation({ summary: "Create a user account and start a session" })
  @ApiBody({ type: SignUpBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async signUp(
    @Body() body: SignUpBodyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authSession = await this.authService.signUp(
      parseSignUp(body),
      this.getSessionRequestContext(request),
    );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
      request.headers.host,
    );

    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.authService.toContextDto(authContext);
  }

  @UseGuards(LocalAuthGuard)
  @Post(AUTH_ROUTES.SIGN_IN)
  @ApiOperation({
    summary: "Sign in with mobile number or email and create a session cookie",
  })
  @ApiBody({ type: SignInBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async signIn(
    @Body() body: SignInBodyDto,
    @Req() request: Request & { user: ValidatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    const validatedUser = request.user;

    if (validatedUser.mustChangePassword) {
      const setupToken = await this.authService.issueMustChangePasswordToken(
        validatedUser.id,
      );
      return { mustChangePassword: true as const, setupToken };
    }

    const tenantSlug = this.tenantContextService.resolveTenantSlug(
      request.headers.host,
      body.tenantSlug,
    );
    const accessContext = await this.authService.resolveSessionAccessContext(
      validatedUser.id,
      tenantSlug,
    );
    const authSession = await this.authService.createSession(
      validatedUser,
      this.getSessionRequestContext(request),
      accessContext,
    );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
      request.headers.host,
    );

    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.authService.toContextDto(authContext);
  }

  @Post(AUTH_ROUTES.COMPLETE_SETUP)
  @ApiOperation({ summary: "Complete first-login password setup and start a session" })
  @ApiBody({ type: CompleteSetupBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async completeSetup(
    @Body() body: CompleteSetupBodyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsed = parseCompleteSetup(body);
    const authSession = await this.authService.completeSetup(
      parsed.token,
      parsed.password,
      this.getSessionRequestContext(request),
    );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
      request.headers.host,
    );

    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.authService.toContextDto(authContext);
  }

  @Post(AUTH_ROUTES.FORGOT_PASSWORD)
  @ApiOperation({
    summary: "Request a password reset using mobile number or email",
  })
  @ApiBody({ type: ForgotPasswordBodyDto })
  @ApiOkResponse({ type: ForgotPasswordResponseDto })
  async forgotPassword(
    @Body() body: ForgotPasswordBodyDto,
    @Req() request: Request,
  ) {
    return this.authService.requestPasswordReset(
      parseForgotPassword(body).identifier,
      this.getSessionRequestContext(request),
    );
  }

  @Post(AUTH_ROUTES.RESET_PASSWORD)
  @ApiOperation({ summary: "Reset password using a one-time recovery token" })
  @ApiBody({ type: ResetPasswordBodyDto })
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  async resetPassword(@Body() body: ResetPasswordBodyDto) {
    const parsedBody = parseResetPassword(body);

    return this.authService.resetPassword(
      parsedBody.token,
      parsedBody.password,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.ME)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get the current authenticated user context" })
  @ApiOkResponse({ type: AuthContextDto })
  async me(@CurrentSession() authSession: AuthenticatedSession) {
    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.authService.toContextDto(authContext);
  }

  @UseGuards(SessionAuthGuard)
  @Get(AUTH_ROUTES.SESSION)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get the current authenticated session context" })
  @ApiOkResponse({ type: AuthContextDto })
  async getSession(@CurrentSession() authSession: AuthenticatedSession) {
    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return this.authService.toContextDto(authContext);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(`${API_ROUTES.CONTEXT}/${API_ROUTES.CAMPUS}`)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Select the active campus inside the current tenant",
  })
  @ApiBody({ type: SwitchCampusBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async selectCampus(
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: SwitchCampusBodyDto,
  ) {
    const nextContext = await this.authService.setActiveCampus(
      authSession.token,
      parseSwitchCampus(body).campusId,
    );

    return this.authService.toContextDto(nextContext);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(`${API_ROUTES.CONTEXT}/${API_ROUTES.SELECT}`)
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Select the active access context inside the current tenant",
  })
  @ApiBody({ type: SwitchContextBodyDto })
  @ApiOkResponse({ type: AuthContextDto })
  async selectContext(
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: SwitchContextBodyDto,
  ) {
    const nextContext = await this.authService.setActiveContext(
      authSession.token,
      parseSwitchContext(body).contextKey,
    );

    return this.authService.toContextDto(nextContext);
  }

  @UseGuards(SessionAuthGuard)
  @Post(AUTH_ROUTES.CHANGE_PASSWORD)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Change password for the authenticated user" })
  @ApiBody({ type: ChangePasswordBodyDto })
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  async changePassword(
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: ChangePasswordBodyDto,
  ) {
    const parsed = parseChangePassword(body);
    await this.authService.changePassword(
      authSession.user.id,
      parsed.currentPassword,
      parsed.newPassword,
    );
    return { success: true };
  }

  @Post(AUTH_ROUTES.SIGN_OUT)
  @ApiOperation({ summary: "Delete the current session and clear the cookie" })
  @ApiOkResponse({
    schema: { type: "object", properties: { success: { type: "boolean" } } },
  })
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.signOut(
      readCookieValue(request.cookies, AUTH_COOKIE.NAME),
    );
    this.authService.clearSessionCookie(response, request.headers.host);

    return { success: true };
  }

  private getSessionRequestContext(request: Request) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers["user-agent"] ?? null,
    };
  }
}
