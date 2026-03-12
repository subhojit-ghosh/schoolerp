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
  ForgotPasswordBodyDto,
  ForgotPasswordResponseDto,
  ResetPasswordBodyDto,
  ResetPasswordResponseDto,
  SignInBodyDto,
  SignUpBodyDto,
  SwitchCampusBodyDto,
} from "./auth.dto";
import { AUTH_ROUTES } from "./auth.constants";
import { LocalAuthGuard } from "./local-auth.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { AuthService } from "./auth.service";
import {
  parseForgotPassword,
  parseResetPassword,
  parseSignUp,
  parseSwitchCampus,
} from "./auth.schemas";
import type { AuthenticatedSession, AuthenticatedUser } from "./auth.types";
import { readCookieValue } from "./auth.utils";

@ApiTags(API_DOCS.TAGS.AUTH)
@Controller(API_ROUTES.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    @Req() request: Request & { user: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    const authenticatedUser = request.user;
    const accessContext = await this.authService.resolveSessionAccessContext(
      authenticatedUser.id,
      body.tenantSlug,
    );
    const authSession = await this.authService.createSession(
      authenticatedUser,
      this.getSessionRequestContext(request),
      accessContext,
    );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
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
    this.authService.clearSessionCookie(response);

    return { success: true };
  }

  private getSessionRequestContext(request: Request) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers["user-agent"] ?? null,
    };
  }
}
