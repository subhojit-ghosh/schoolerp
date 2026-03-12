import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { ERROR_MESSAGES } from "../../constants";
import { AUTH_FIELDS, AUTH_STRATEGIES } from "./auth.constants";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGIES.LOCAL,
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: AUTH_FIELDS.IDENTIFIER,
      passwordField: AUTH_FIELDS.PASSWORD,
    });
  }

  async validate(identifier: string, password: string) {
    const authenticatedUser = await this.authService.validateUser(
      identifier,
      password,
    );

    if (!authenticatedUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return authenticatedUser;
  }
}
