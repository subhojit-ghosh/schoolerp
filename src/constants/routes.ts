export const ROUTES = {
  DASHBOARD: "/dashboard",
  APP_PREFIX: "/app",
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SIGN_UP: "/auth/sign-up",
    TWO_FA: "/auth/2fa",
  },
  ADMIN: {
    PREFIX: "/admin",
    SIGN_IN: "/admin/auth/sign-in",
    TWO_FA: "/admin/auth/2fa",
    SETUP: "/admin/setup",
  },
  API: {
    AUTH_PREFIX: "/api/auth",
    SETUP_PREFIX: "/api/setup/",
  },
} as const;
