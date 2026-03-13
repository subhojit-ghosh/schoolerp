export const API_DOCS = {
  OPENAPI_PATH: "openapi",
  OPENAPI_JSON_PATH: "/openapi.json",
  OPENAPI_OUTPUT_FILE_NAME: "openapi.json",
  REFERENCE_PATH: "/reference",
  TITLE: "Academic Platform ERP API",
  DESCRIPTION:
    "NestJS backend for ERP authentication, onboarding, tenant branding, and school operations.",
  VERSION: "0.1.0",
  TAGS: {
    HEALTH: "health",
    PUBLIC: "public",
    AUTH: "auth",
    ONBOARDING: "onboarding",
    INSTITUTIONS: "institutions",
    CAMPUSES: "campuses",
    STUDENTS: "students",
    ACADEMIC_YEARS: "academic-years",
    ATTENDANCE: "attendance",
  },
  THEMES: {
    NEST: "nest",
  },
} as const;
