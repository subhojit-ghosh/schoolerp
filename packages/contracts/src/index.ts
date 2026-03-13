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

export const FEE_STRUCTURE_SCOPES = {
  INSTITUTION: "institution",
  CAMPUS: "campus",
} as const;

export const FEE_ASSIGNMENT_STATUSES = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
} as const;

export const FEE_PAYMENT_METHODS = {
  CASH: "cash",
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
  CARD: "card",
} as const;

export const AUTH_CONTEXT_LABELS = {
  [AUTH_CONTEXT_KEYS.STAFF]: "Staff",
  [AUTH_CONTEXT_KEYS.PARENT]: "Parent",
  [AUTH_CONTEXT_KEYS.STUDENT]: "Student",
} as const;

export const authContextKeySchema = z.enum([
  AUTH_CONTEXT_KEYS.STAFF,
  AUTH_CONTEXT_KEYS.PARENT,
  AUTH_CONTEXT_KEYS.STUDENT,
]);

export const feeStructureScopeSchema = z.enum([
  FEE_STRUCTURE_SCOPES.INSTITUTION,
  FEE_STRUCTURE_SCOPES.CAMPUS,
]);

export const feeAssignmentStatusSchema = z.enum([
  FEE_ASSIGNMENT_STATUSES.PENDING,
  FEE_ASSIGNMENT_STATUSES.PARTIAL,
  FEE_ASSIGNMENT_STATUSES.PAID,
]);

export const feePaymentMethodSchema = z.enum([
  FEE_PAYMENT_METHODS.CASH,
  FEE_PAYMENT_METHODS.UPI,
  FEE_PAYMENT_METHODS.BANK_TRANSFER,
  FEE_PAYMENT_METHODS.CARD,
]);

export type AuthContextKey = z.infer<typeof authContextKeySchema>;
export type FeeStructureScope = z.infer<typeof feeStructureScopeSchema>;
export type FeeAssignmentStatus = z.infer<typeof feeAssignmentStatusSchema>;
export type FeePaymentMethod = z.infer<typeof feePaymentMethodSchema>;

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
