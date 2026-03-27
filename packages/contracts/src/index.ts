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
  AUDIT_READ: "audit:read",
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
  COMMUNICATION_READ: "communication:read",
  COMMUNICATION_MANAGE: "communication:manage",
  INSTITUTION_DELIVERY_MANAGE: "institution:delivery:manage",
  INSTITUTION_PAYMENT_MANAGE: "institution:payment:manage",
  FEES_PAYMENT_ONLINE: "fees:payment:online",
  HOMEWORK_READ: "homework:read",
  HOMEWORK_MANAGE: "homework:manage",
  LEAVE_READ: "leave:read",
  LEAVE_MANAGE: "leave:manage",
  LEAVE_APPLY: "leave:apply",
  LIBRARY_READ: "library:read",
  LIBRARY_MANAGE: "library:manage",
  TRANSPORT_READ: "transport:read",
  TRANSPORT_MANAGE: "transport:manage",
  PAYROLL_READ: "payroll:read",
  PAYROLL_MANAGE: "payroll:manage",
} as const;

export const DATA_EXCHANGE_ENTITY_TYPES = {
  STUDENTS: "students",
  STAFF: "staff",
  GUARDIANS: "guardians",
  FEE_ASSIGNMENTS: "feeAssignments",
} as const;

export const DATA_EXCHANGE_ACTIONS = {
  IMPORT: "import",
  EXPORT: "export",
} as const;

export const AUDIT_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  MARK: "mark",
  REPLACE: "replace",
  REVERSE: "reverse",
  EXECUTE: "execute",
} as const;

export const AUDIT_ENTITY_TYPES = {
  ROLE: "role",
  ATTENDANCE_DAY: "attendance_day",
  EXAM_MARKS: "exam_marks",
  FEE_PAYMENT: "fee_payment",
  STUDENT_ROLLOVER: "student_rollover",
  STUDENT: "student",
  STAFF: "staff",
  GUARDIAN: "guardian",
  CLASS: "class",
  SECTION: "section",
  SUBJECT: "subject",
  CAMPUS: "campus",
  INSTITUTION_SETTINGS: "institution_settings",
  FEE_STRUCTURE: "fee_structure",
  FEE_ASSIGNMENT: "fee_assignment",
  ADMISSION_ENQUIRY: "admission_enquiry",
  ADMISSION_APPLICATION: "admission_application",
  ANNOUNCEMENT: "announcement",
  CALENDAR_EVENT: "calendar_event",
  TIMETABLE: "timetable",
  BELL_SCHEDULE: "bell_schedule",
  ACADEMIC_YEAR: "academic_year",
  DELIVERY_CONFIG: "delivery_config",
  PAYMENT_CONFIG: "payment_config",
  PAYMENT_ORDER: "payment_order",
  HOMEWORK: "homework",
  LEAVE_TYPE: "leave_type",
  LEAVE_APPLICATION: "leave_application",
  LIBRARY_BOOK: "library_book",
  LIBRARY_TRANSACTION: "library_transaction",
  TRANSPORT_ROUTE: "transport_route",
  TRANSPORT_STOP: "transport_stop",
  TRANSPORT_VEHICLE: "transport_vehicle",
  TRANSPORT_ASSIGNMENT: "transport_assignment",
  SALARY_COMPONENT: "salary_component",
  SALARY_TEMPLATE: "salary_template",
  STAFF_SALARY_ASSIGNMENT: "staff_salary_assignment",
  PAYROLL_RUN: "payroll_run",
  PAYSLIP: "payslip",
} as const;

export const DELIVERY_PROVIDERS = {
  MSG91: "msg91",
  TWILIO: "twilio",
  RESEND: "resend",
  SENDGRID: "sendgrid",
  SMTP: "smtp",
  DISABLED: "disabled",
} as const;

export type DeliveryProvider =
  (typeof DELIVERY_PROVIDERS)[keyof typeof DELIVERY_PROVIDERS];

export const DELIVERY_CHANNELS = {
  SMS: "sms",
  EMAIL: "email",
} as const;

export type DeliveryChannelType =
  (typeof DELIVERY_CHANNELS)[keyof typeof DELIVERY_CHANNELS];

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type DataExchangeEntityType =
  (typeof DATA_EXCHANGE_ENTITY_TYPES)[keyof typeof DATA_EXCHANGE_ENTITY_TYPES];
export type DataExchangeAction =
  (typeof DATA_EXCHANGE_ACTIONS)[keyof typeof DATA_EXCHANGE_ACTIONS];
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

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

export const STUDENT_ROLLOVER_ACTIONS = {
  CONTINUE: "continue",
  WITHDRAW: "withdraw",
} as const;

export const STUDENT_ROLLOVER_PREVIEW_STATUS = {
  MAPPED: "mapped",
  UNMAPPED: "unmapped",
  WITHDRAWN: "withdrawn",
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
  ONLINE: "online",
} as const;

export const PAYMENT_PROVIDERS = {
  RAZORPAY: "razorpay",
  PAYU: "payu",
  CASHFREE: "cashfree",
  CUSTOM: "custom",
  DISABLED: "disabled",
} as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export const PAYMENT_ORDER_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  EXPIRED: "expired",
} as const;

export type PaymentOrderStatus =
  (typeof PAYMENT_ORDER_STATUSES)[keyof typeof PAYMENT_ORDER_STATUSES];

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

export const SUBJECT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const TIMETABLE_ENTRY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const TIMETABLE_VERSION_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const TIMETABLE_ASSIGNMENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const BELL_SCHEDULE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const BELL_SCHEDULE_PERIOD_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const WEEKDAY_KEYS = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

export const CALENDAR_EVENT_TYPES = {
  HOLIDAY: "holiday",
  EXAM: "exam",
  EVENT: "event",
  DEADLINE: "deadline",
} as const;

export const CALENDAR_EVENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const ANNOUNCEMENT_AUDIENCE = {
  ALL: "all",
  STAFF: "staff",
  GUARDIANS: "guardians",
  STUDENTS: "students",
} as const;

export const ANNOUNCEMENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const NOTIFICATION_CHANNELS = {
  SYSTEM: "system",
  ACADEMICS: "academics",
  OPERATIONS: "operations",
  FINANCE: "finance",
  COMMUNITY: "community",
} as const;

export const NOTIFICATION_TONES = {
  CRITICAL: "critical",
  INFO: "info",
  POSITIVE: "positive",
  WARNING: "warning",
} as const;

export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT_PUBLISHED: "announcement_published",
  FEE_PAYMENT_RECEIVED: "fee_payment_received",
  FEE_PAYMENT_REVERSED: "fee_payment_reversed",
  ATTENDANCE_ABSENT: "attendance_absent",
  ATTENDANCE_ABSENT_STREAK: "attendance_absent_streak",
  PASSWORD_SETUP_REQUIRED: "password_setup_required",
  ADMISSION_APPLICATION_RECEIVED: "admission_application_received",
  ADMISSION_STATUS_CHANGED: "admission_status_changed",
  EXAM_RESULTS_PUBLISHED: "exam_results_published",
  FEE_REMINDER_SENT: "fee_reminder_sent",
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

export const ADMISSION_FORM_FIELD_SCOPES = {
  APPLICATION: "application",
  STUDENT: "student",
  BOTH: "both",
} as const;

export const ADMISSION_FORM_FIELD_TYPES = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  DATE: "date",
  SELECT: "select",
  EMAIL: "email",
  PHONE: "phone",
  URL: "url",
  CHECKBOX: "checkbox",
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

export type SubjectStatus =
  (typeof SUBJECT_STATUS)[keyof typeof SUBJECT_STATUS];
export type TimetableEntryStatus =
  (typeof TIMETABLE_ENTRY_STATUS)[keyof typeof TIMETABLE_ENTRY_STATUS];
export type TimetableVersionStatus =
  (typeof TIMETABLE_VERSION_STATUS)[keyof typeof TIMETABLE_VERSION_STATUS];
export type TimetableAssignmentStatus =
  (typeof TIMETABLE_ASSIGNMENT_STATUS)[keyof typeof TIMETABLE_ASSIGNMENT_STATUS];
export type BellScheduleStatus =
  (typeof BELL_SCHEDULE_STATUS)[keyof typeof BELL_SCHEDULE_STATUS];
export type BellSchedulePeriodStatus =
  (typeof BELL_SCHEDULE_PERIOD_STATUS)[keyof typeof BELL_SCHEDULE_PERIOD_STATUS];
export type CalendarEventStatus =
  (typeof CALENDAR_EVENT_STATUS)[keyof typeof CALENDAR_EVENT_STATUS];

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
export const admissionFormFieldScopeSchema = z.enum([
  ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
  ADMISSION_FORM_FIELD_SCOPES.STUDENT,
  ADMISSION_FORM_FIELD_SCOPES.BOTH,
]);
export const admissionFormFieldTypeSchema = z.enum([
  ADMISSION_FORM_FIELD_TYPES.TEXT,
  ADMISSION_FORM_FIELD_TYPES.TEXTAREA,
  ADMISSION_FORM_FIELD_TYPES.NUMBER,
  ADMISSION_FORM_FIELD_TYPES.DATE,
  ADMISSION_FORM_FIELD_TYPES.SELECT,
  ADMISSION_FORM_FIELD_TYPES.EMAIL,
  ADMISSION_FORM_FIELD_TYPES.PHONE,
  ADMISSION_FORM_FIELD_TYPES.URL,
  ADMISSION_FORM_FIELD_TYPES.CHECKBOX,
]);
export const admissionFormFieldOptionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});
export const guardianRelationshipSchema = z.enum([
  GUARDIAN_RELATIONSHIPS.FATHER,
  GUARDIAN_RELATIONSHIPS.MOTHER,
  GUARDIAN_RELATIONSHIPS.GUARDIAN,
]);
export const dataExchangeEntityTypeSchema = z.enum([
  DATA_EXCHANGE_ENTITY_TYPES.STUDENTS,
  DATA_EXCHANGE_ENTITY_TYPES.STAFF,
  DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS,
  DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS,
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
export type AdmissionEnquiryStatus = z.infer<
  typeof admissionEnquiryStatusSchema
>;
export type AdmissionApplicationStatus = z.infer<
  typeof admissionApplicationStatusSchema
>;
export type AdmissionFormFieldScope = z.infer<
  typeof admissionFormFieldScopeSchema
>;
export type AdmissionFormFieldType = z.infer<
  typeof admissionFormFieldTypeSchema
>;
export type AdmissionFormFieldOption = z.infer<
  typeof admissionFormFieldOptionSchema
>;
export type GuardianRelationship = z.infer<typeof guardianRelationshipSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const SALARY_COMPONENT_TYPES = {
  EARNING: "earning",
  DEDUCTION: "deduction",
} as const;

export const SALARY_CALCULATION_TYPES = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
} as const;

export const SALARY_COMPONENT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const SALARY_TEMPLATE_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const SALARY_ASSIGNMENT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export const PAYROLL_RUN_STATUS = {
  DRAFT: "draft",
  PROCESSED: "processed",
  APPROVED: "approved",
  PAID: "paid",
} as const;

export const salaryComponentTypeSchema = z.enum([
  SALARY_COMPONENT_TYPES.EARNING,
  SALARY_COMPONENT_TYPES.DEDUCTION,
]);

export const salaryCalculationTypeSchema = z.enum([
  SALARY_CALCULATION_TYPES.FIXED,
  SALARY_CALCULATION_TYPES.PERCENTAGE,
]);

export const salaryComponentStatusSchema = z.enum([
  SALARY_COMPONENT_STATUS.ACTIVE,
  SALARY_COMPONENT_STATUS.ARCHIVED,
  SALARY_COMPONENT_STATUS.DELETED,
]);

export const salaryTemplateStatusSchema = z.enum([
  SALARY_TEMPLATE_STATUS.ACTIVE,
  SALARY_TEMPLATE_STATUS.ARCHIVED,
  SALARY_TEMPLATE_STATUS.DELETED,
]);

export const salaryAssignmentStatusSchema = z.enum([
  SALARY_ASSIGNMENT_STATUS.ACTIVE,
  SALARY_ASSIGNMENT_STATUS.ARCHIVED,
  SALARY_ASSIGNMENT_STATUS.DELETED,
]);

export const payrollRunStatusSchema = z.enum([
  PAYROLL_RUN_STATUS.DRAFT,
  PAYROLL_RUN_STATUS.PROCESSED,
  PAYROLL_RUN_STATUS.APPROVED,
  PAYROLL_RUN_STATUS.PAID,
]);

export type SalaryComponentType = z.infer<typeof salaryComponentTypeSchema>;
export type SalaryCalculationType = z.infer<typeof salaryCalculationTypeSchema>;
export type SalaryComponentStatus = z.infer<typeof salaryComponentStatusSchema>;
export type SalaryTemplateStatus = z.infer<typeof salaryTemplateStatusSchema>;
export type SalaryAssignmentStatus = z.infer<
  typeof salaryAssignmentStatusSchema
>;
export type PayrollRunStatus = z.infer<typeof payrollRunStatusSchema>;

export const DEFAULT_WORKING_DAYS_PER_MONTH = 26;

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
  brandingVersion: z.number().int().default(0),
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
