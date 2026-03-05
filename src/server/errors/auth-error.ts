import { ERROR_MESSAGES } from "@/constants";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 500,
  ) {
    super(message);
    this.name = "AuthError";
  }

  static unauthorized(message: string = ERROR_MESSAGES.COMMON.UNAUTHORIZED) {
    return new AuthError(message, 401);
  }

  static forbidden(message: string = ERROR_MESSAGES.COMMON.UNAUTHORIZED) {
    return new AuthError(message, 403);
  }
}
