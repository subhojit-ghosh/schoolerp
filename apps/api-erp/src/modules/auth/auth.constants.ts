import { AUTH_COOKIE, AUTH_FIELD_NAMES, AUTH_STRATEGY } from "../../constants";

export const AUTH_ROUTES = {
  SIGN_UP: "sign-up",
  SIGN_IN: "sign-in",
  SIGN_OUT: "sign-out",
  SESSION: "session",
} as const;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: AUTH_COOKIE.SAME_SITE,
  path: AUTH_COOKIE.PATH,
  domain: AUTH_COOKIE.DOMAIN,
} as const;

export const AUTH_FIELDS = AUTH_FIELD_NAMES;
export const AUTH_STRATEGIES = AUTH_STRATEGY;
