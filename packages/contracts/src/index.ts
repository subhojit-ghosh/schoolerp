import { z } from "zod";

export const APP_FALLBACKS = {
  API_URL: "/api",
  ROOT_HOST: "erp.test",
  ROOT_DOMAIN: "erp.test",
} as const;

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

export function isRootHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);

  return normalizedHostname === normalizedRootHost;
}

export function getTenantSlugFromHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);
  const normalizedRootDomain = normalizeHostname(APP_FALLBACKS.ROOT_DOMAIN);

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === normalizedRootHost
  ) {
    return null;
  }

  const tenantSuffix = `.${normalizedRootDomain}`;
  if (!normalizedHostname.endsWith(tenantSuffix)) {
    return null;
  }

  const tenantSlug = normalizedHostname.slice(0, -tenantSuffix.length);

  return tenantSlug || null;
}

export function getCurrentTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  return getTenantSlugFromHostname(window.location.hostname);
}

export function buildTenantAppUrl(tenantSlug: string, path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  const normalizedRootDomain = normalizeHostname(APP_FALLBACKS.ROOT_DOMAIN);

  return `${protocol}//${tenantSlug}.${normalizedRootDomain}${portSuffix}${path}`;
}

export function buildRootAppUrl(path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  const normalizedRootHost = normalizeHostname(APP_FALLBACKS.ROOT_HOST);

  return `${protocol}//${normalizedRootHost}${portSuffix}${path}`;
}

export const PERMISSIONS = {
  INSTITUTION_SETTINGS_READ: "institution:settings:read",
  INSTITUTION_SETTINGS_MANAGE: "institution:settings:manage",
  INSTITUTION_ROLES_MANAGE: "institution:roles:manage",
  INSTITUTION_USERS_MANAGE: "institution:users:manage",
  CAMPUS_READ: "campus:read",
  CAMPUS_MANAGE: "campus:manage",
  ACADEMICS_READ: "academics:read",
  ACADEMICS_MANAGE: "academics:manage",
  STUDENTS_READ: "students:read",
  STUDENTS_MANAGE: "students:manage",
  GUARDIANS_READ: "guardians:read",
  GUARDIANS_MANAGE: "guardians:manage",
  STAFF_READ: "staff:read",
  STAFF_MANAGE: "staff:manage",
  ADMISSIONS_READ: "admissions:read",
  ADMISSIONS_MANAGE: "admissions:manage",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_WRITE: "attendance:write",
  EXAMS_READ: "exams:read",
  EXAMS_MANAGE: "exams:manage",
  MARKS_WRITE: "marks:write",
  FEES_READ: "fees:read",
  FEES_MANAGE: "fees:manage",
  FEES_COLLECT: "fees:collect",
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_TYPES = {
  PLATFORM: "platform",
  SYSTEM: "system",
  INSTITUTION: "institution",
} as const;

export const ROLE_SLUGS = {
  INSTITUTION_ADMIN: "institution_admin",
  SCHOOL_ADMIN: "school_admin",
  ACADEMIC_COORDINATOR: "academic_coordinator",
  FINANCE_MANAGER: "finance_manager",
  CLASS_TEACHER: "class_teacher",
  SUBJECT_TEACHER: "subject_teacher",
} as const;

export const ROLE_NAMES = {
  INSTITUTION_ADMIN: "Institution Admin",
  SCHOOL_ADMIN: "School Admin",
  ACADEMIC_COORDINATOR: "Academic Coordinator",
  FINANCE_MANAGER: "Finance Manager",
  CLASS_TEACHER: "Class Teacher",
  SUBJECT_TEACHER: "Subject Teacher",
} as const;

export const SCOPE_TYPES = {
  INSTITUTION: "institution",
  CAMPUS: "campus",
  DEPARTMENT: "department",
  CLASS: "class",
  SECTION: "section",
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

export const FEE_STRUCTURE_STATUSES = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const FEE_ASSIGNMENT_STATUSES = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
} as const;

export const FEE_ADJUSTMENT_TYPES = {
  WAIVER: "waiver",
  DISCOUNT: "discount",
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

export const ACADEMIC_YEAR_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const CLASS_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const SECTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const ADMISSION_ENQUIRY_STATUSES = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  CONVERTED: "converted",
  CLOSED: "closed",
} as const;

export const ADMISSION_APPLICATION_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  APPROVED: "approved",
  REJECTED: "rejected",
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

export const feeStructureScopeSchema = z.enum([
  FEE_STRUCTURE_SCOPES.INSTITUTION,
  FEE_STRUCTURE_SCOPES.CAMPUS,
]);

export const feeStructureStatusSchema = z.enum([
  FEE_STRUCTURE_STATUSES.ACTIVE,
  FEE_STRUCTURE_STATUSES.ARCHIVED,
  FEE_STRUCTURE_STATUSES.DELETED,
]);

export const feeAssignmentStatusSchema = z.enum([
  FEE_ASSIGNMENT_STATUSES.PENDING,
  FEE_ASSIGNMENT_STATUSES.PARTIAL,
  FEE_ASSIGNMENT_STATUSES.PAID,
]);

export const feeAdjustmentTypeSchema = z.enum([
  FEE_ADJUSTMENT_TYPES.WAIVER,
  FEE_ADJUSTMENT_TYPES.DISCOUNT,
]);

export const feePaymentMethodSchema = z.enum([
  FEE_PAYMENT_METHODS.CASH,
  FEE_PAYMENT_METHODS.UPI,
  FEE_PAYMENT_METHODS.BANK_TRANSFER,
  FEE_PAYMENT_METHODS.CARD,
]);

export type AuthContextKey = z.infer<typeof authContextKeySchema>;
export type FeeStructureScope = z.infer<typeof feeStructureScopeSchema>;
export type FeeStructureStatus = z.infer<typeof feeStructureStatusSchema>;
export type FeeAssignmentStatus = z.infer<typeof feeAssignmentStatusSchema>;
export type FeeAdjustmentType = z.infer<typeof feeAdjustmentTypeSchema>;
export type FeePaymentMethod = z.infer<typeof feePaymentMethodSchema>;
export const academicYearStatusSchema = z.enum([
  ACADEMIC_YEAR_STATUS.ACTIVE,
  ACADEMIC_YEAR_STATUS.ARCHIVED,
  ACADEMIC_YEAR_STATUS.DELETED,
]);

export const classStatusSchema = z.enum([
  CLASS_STATUS.ACTIVE,
  CLASS_STATUS.INACTIVE,
]);

export const sectionStatusSchema = z.enum([
  SECTION_STATUS.ACTIVE,
  SECTION_STATUS.INACTIVE,
]);
export const admissionEnquiryStatusSchema = z.enum([
  ADMISSION_ENQUIRY_STATUSES.NEW,
  ADMISSION_ENQUIRY_STATUSES.IN_PROGRESS,
  ADMISSION_ENQUIRY_STATUSES.CONVERTED,
  ADMISSION_ENQUIRY_STATUSES.CLOSED,
]);

export const admissionApplicationStatusSchema = z.enum([
  ADMISSION_APPLICATION_STATUSES.DRAFT,
  ADMISSION_APPLICATION_STATUSES.SUBMITTED,
  ADMISSION_APPLICATION_STATUSES.REVIEWED,
  ADMISSION_APPLICATION_STATUSES.APPROVED,
  ADMISSION_APPLICATION_STATUSES.REJECTED,
]);
export const guardianRelationshipSchema = z.enum([
  GUARDIAN_RELATIONSHIPS.FATHER,
  GUARDIAN_RELATIONSHIPS.MOTHER,
  GUARDIAN_RELATIONSHIPS.GUARDIAN,
]);
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

export type AcademicYearStatus = z.infer<typeof academicYearStatusSchema>;
export type ClassStatus = z.infer<typeof classStatusSchema>;
export type SectionStatus = z.infer<typeof sectionStatusSchema>;
export type AdmissionEnquiryStatus = z.infer<typeof admissionEnquiryStatusSchema>;
export type AdmissionApplicationStatus = z.infer<
  typeof admissionApplicationStatusSchema
>;
export type GuardianRelationship = z.infer<typeof guardianRelationshipSchema>;
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

export type ColorPreset = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
};

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "prestige",
    name: "Prestige",
    primaryColor: "#1e3a5f",
    accentColor: "#c8a84a",
    sidebarColor: "#0c1a2e",
  },
  {
    id: "crimson",
    name: "Crimson",
    primaryColor: "#7c1c2e",
    accentColor: "#e07c5a",
    sidebarColor: "#18060f",
  },
  {
    id: "sage",
    name: "Sage",
    primaryColor: "#14573a",
    accentColor: "#4daf9e",
    sidebarColor: "#0a2214",
  },
  {
    id: "sapphire",
    name: "Sapphire",
    primaryColor: "#1a3fa8",
    accentColor: "#4db8e8",
    sidebarColor: "#091525",
  },
  {
    id: "indigo",
    name: "Indigo",
    primaryColor: "#3730a3",
    accentColor: "#8b83f7",
    sidebarColor: "#14123a",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    primaryColor: "#8a5a44",
    accentColor: "#6aad72",
    sidebarColor: "#32241c",
  },
  {
    id: "violet",
    name: "Violet",
    primaryColor: "#581c87",
    accentColor: "#c084fc",
    sidebarColor: "#1a0a2e",
  },
  {
    id: "ocean",
    name: "Ocean",
    primaryColor: "#0e7490",
    accentColor: "#22d3ee",
    sidebarColor: "#042f3d",
  },
];

export const DEFAULT_COLOR_PRESET_ID = "indigo";

export function findPresetById(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((p) => p.id === id);
}

export function findPresetByColors(
  primaryColor: string,
  accentColor: string,
  sidebarColor: string,
): ColorPreset | undefined {
  return COLOR_PRESETS.find(
    (p) =>
      p.primaryColor === primaryColor &&
      p.accentColor === accentColor &&
      p.sidebarColor === sidebarColor,
  );
}
