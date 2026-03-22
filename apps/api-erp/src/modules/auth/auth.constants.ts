import { AUTH_COOKIE, AUTH_FIELD_NAMES, AUTH_STRATEGY } from "../../constants";

export const AUTH_ROUTES = {
  SIGN_UP: "sign-up",
  SIGN_IN: "sign-in",
  SIGN_OUT: "sign-out",
  SESSION: "session",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",
  COMPLETE_SETUP: "complete-setup",
  CHANGE_PASSWORD: "change-password",
} as const;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: AUTH_COOKIE.SAME_SITE,
  path: AUTH_COOKIE.PATH,
} as const;

export const AUTH_FIELDS = AUTH_FIELD_NAMES;
export const AUTH_STRATEGIES = AUTH_STRATEGY;
