export const API_ROUTES = {
  HEALTH: "/health",
  TENANT_BRANDING: "/public/tenant-branding",
} as const;

export const APP_FALLBACKS = {
  API_URL: "http://localhost:4000",
  LOCALHOST_TENANT_SLUG: "springfield-high",
} as const;
