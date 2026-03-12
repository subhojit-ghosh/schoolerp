import {
  Body,
  Controller,
  Get,
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
import { AuthSessionDto, SignInBodyDto, SignUpBodyDto } from "./auth.dto";
import { AUTH_ROUTES } from "./auth.constants";
import { LocalAuthGuard } from "./local-auth.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import { AuthService } from "./auth.service";
import { parseSignUp } from "./auth.schemas";
import type { AuthenticatedSession, AuthenticatedUser } from "./auth.types";
import { readCookieValue } from "./auth.utils";

@ApiTags(API_DOCS.TAGS.AUTH)
@Controller(API_ROUTES.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AUTH_ROUTES.SIGN_UP)
  @ApiOperation({ summary: "Create a user account and start a session" })
  @ApiBody({ type: SignUpBodyDto })
  @ApiOkResponse({ type: AuthSessionDto })
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

    return this.authService.toSessionDto(authSession);
  }

  @UseGuards(LocalAuthGuard)
  @Post(AUTH_ROUTES.SIGN_IN)
  @ApiOperation({
    summary: "Sign in with mobile number or email and create a session cookie",
  })
  @ApiBody({ type: SignInBodyDto })
  @ApiOkResponse({ type: AuthSessionDto })
  async signIn(
    @Req() request: Request & { user: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    const authenticatedUser = request.user;
    const authSession = await this.authService.createSession(
      authenticatedUser,
      this.getSessionRequestContext(request),
    );

    this.authService.writeSessionCookie(
      response,
      authSession.token,
      authSession.expiresAt,
    );

    return this.authService.toSessionDto(authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Get(AUTH_ROUTES.SESSION)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get the current authenticated session" })
  @ApiOkResponse({ type: AuthSessionDto })
  getSession(@CurrentSession() authSession: AuthenticatedSession) {
    return this.authService.toSessionDto(authSession);
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
