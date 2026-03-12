export const AUTH_COOKIE = {
  NAME: "erp_session",
  MAX_AGE_MS: 1000 * 60 * 60 * 24 * 7,
  SAME_SITE: "lax",
  PATH: "/",
  DOMAIN: process.env.AUTH_COOKIE_DOMAIN ?? ".erp.test",
  SECURE: process.env.AUTH_COOKIE_SECURE !== "false",
} as const;

export const AUTH_STRATEGY = {
  LOCAL: "local",
} as const;

export const AUTH_FIELD_NAMES = {
  IDENTIFIER: "identifier",
  PASSWORD: "password",
  TOKEN: "token",
} as const;

export const AUTH_PASSWORD_RESET = {
  TOKEN_BYTE_LENGTH: 32,
  TOKEN_TTL_MS: 1000 * 60 * 30,
  PREVIEW_ENABLED: process.env.AUTH_PASSWORD_RESET_PREVIEW === "true",
  RATE_LIMIT_WINDOW_MS: 1000 * 60 * 15,
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  RATE_LIMIT_ACTION: "forgot-password",
} as const;

export const AUTH_RECOVERY_CHANNELS = {
  MOBILE: "mobile",
  EMAIL: "email",
} as const;

export type AuthRecoveryChannel =
  (typeof AUTH_RECOVERY_CHANNELS)[keyof typeof AUTH_RECOVERY_CHANNELS];
