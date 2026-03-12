export const AUTH_COOKIE = {
  NAME: "erp_session",
  MAX_AGE_MS: 1000 * 60 * 60 * 24 * 7,
  SAME_SITE: "lax",
  PATH: "/",
} as const;

export const AUTH_STRATEGY = {
  LOCAL: "local",
} as const;

export const AUTH_FIELD_NAMES = {
  IDENTIFIER: "identifier",
  PASSWORD: "password",
} as const;
