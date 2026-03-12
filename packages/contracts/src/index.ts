import { z } from "zod";

export const APP_FALLBACKS = {
  API_URL: "/api",
  ROOT_HOST: "erp.test",
  ROOT_DOMAIN: "erp.test",
} as const;

export const healthResponseSchema = z.object({
  status: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const tenantBrandingSchema = z.object({
  institutionName: z.string(),
  shortName: z.string(),
  tenantSlug: z.string(),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  primaryColor: z.string(),
  accentColor: z.string(),
  sidebarColor: z.string(),
  fontHeading: z.string().nullable(),
  fontBody: z.string().nullable(),
  fontMono: z.string().nullable(),
  borderRadius: z.enum(["sharp", "default", "rounded", "pill"]).nullable(),
  uiDensity: z.enum(["compact", "default", "comfortable"]).nullable(),
});

export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
