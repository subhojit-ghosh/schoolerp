import { z } from "zod";

export const APP_FALLBACKS = {
  API_URL: "/api",
  ROOT_HOST: "erp.test",
  ROOT_DOMAIN: "erp.test",
} as const;

export const AUTH_CONTEXT_KEYS = {
  STAFF: "staff",
  PARENT: "parent",
  STUDENT: "student",
} as const;

export const AUTH_CONTEXT_LABELS = {
  [AUTH_CONTEXT_KEYS.STAFF]: "Staff",
  [AUTH_CONTEXT_KEYS.PARENT]: "Parent",
  [AUTH_CONTEXT_KEYS.STUDENT]: "Student",
} as const;

export const ACADEMIC_YEAR_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const ACADEMIC_YEAR_NAME_MAX_LENGTH = 100;
export const GUARDIAN_RELATIONSHIPS = {
  FATHER: "father",
  MOTHER: "mother",
  GUARDIAN: "guardian",
} as const;
export const authContextKeySchema = z.enum([
  AUTH_CONTEXT_KEYS.STAFF,
  AUTH_CONTEXT_KEYS.PARENT,
  AUTH_CONTEXT_KEYS.STUDENT,
]);

export const academicYearStatusSchema = z.enum([
  ACADEMIC_YEAR_STATUS.ACTIVE,
  ACADEMIC_YEAR_STATUS.ARCHIVED,
]);
export const guardianRelationshipSchema = z.enum([
  GUARDIAN_RELATIONSHIPS.FATHER,
  GUARDIAN_RELATIONSHIPS.MOTHER,
  GUARDIAN_RELATIONSHIPS.GUARDIAN,
]);

export type AuthContextKey = z.infer<typeof authContextKeySchema>;
export type AcademicYearStatus = z.infer<typeof academicYearStatusSchema>;
export type GuardianRelationship = z.infer<typeof guardianRelationshipSchema>;

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
