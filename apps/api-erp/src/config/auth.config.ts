import { registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => ({
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN ?? ".erp.test",
  cookieSecure: process.env.AUTH_COOKIE_SECURE !== "false",
  passwordResetPreviewEnabled:
    process.env.AUTH_PASSWORD_RESET_PREVIEW === "true",
}));
