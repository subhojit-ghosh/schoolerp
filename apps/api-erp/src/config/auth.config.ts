import { registerAs } from "@nestjs/config";
import { APP_FALLBACKS } from "@repo/contracts";

export const authConfig = registerAs("auth", () => ({
  cookieDomain:
    process.env.AUTH_COOKIE_DOMAIN ??
    process.env.APP_ROOT_HOST ??
    APP_FALLBACKS.ROOT_HOST,
  cookieSecure: process.env.AUTH_COOKIE_SECURE !== "false",
  passwordResetPreviewEnabled:
    process.env.AUTH_PASSWORD_RESET_PREVIEW === "true",
}));
