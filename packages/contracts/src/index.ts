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

export const authContextKeySchema = z.enum([
  AUTH_CONTEXT_KEYS.STAFF,
  AUTH_CONTEXT_KEYS.PARENT,
  AUTH_CONTEXT_KEYS.STUDENT,
]);

export type AuthContextKey = z.infer<typeof authContextKeySchema>;

export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EXCUSED: "excused",
} as const;

export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUSES.PRESENT]: "Present",
  [ATTENDANCE_STATUSES.ABSENT]: "Absent",
  [ATTENDANCE_STATUSES.LATE]: "Late",
  [ATTENDANCE_STATUSES.EXCUSED]: "Excused",
} as const;

export const attendanceStatusSchema = z.enum([
  ATTENDANCE_STATUSES.PRESENT,
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.LATE,
  ATTENDANCE_STATUSES.EXCUSED,
]);

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

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
