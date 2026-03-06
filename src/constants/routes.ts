export const ROUTES = {
  DASHBOARD: "/dashboard",
  APP_PREFIX: "/app",
  ROOT: "/",
  ORG: {
    ROOT: "/",
    ATTENDANCE: "/attendance",
    GRADES: "/grades",
    STUDENTS: "/students",
    FEES: "/fees",
    REPORTS: "/reports",
    MEMBERS: "/members",
    ROLES: "/roles",
    ADMISSIONS: "/admissions",
  },
  AUTH: {
    PREFIX: "/auth",
    SIGN_IN: "/auth/sign-in",
    TWO_FA: "/auth/2fa",
  },
  ADMIN: {
    PREFIX: "/admin",
    DASHBOARD: "/admin/dashboard",
    INSTITUTIONS: "/admin/institutions",
    NEW_INSTITUTION: "/admin/institutions/new",
    SIGN_IN: "/admin/auth/sign-in",
    TWO_FA: "/admin/auth/2fa",
    SETUP: "/admin/setup",
  },
  API: {
    AUTH_PREFIX: "/api/auth",
    INNGEST: "/api/inngest",
    SETUP_PREFIX: "/api/setup/",
    SETUP_SUPER_ADMIN: "/api/setup/super-admin",
  },
} as const;

export const ROUTE_BUILDERS = {
  ADMIN: {
    INSTITUTION_BY_ID: (id: string) => `${ROUTES.ADMIN.INSTITUTIONS}/${id}`,
  },
} as const;
