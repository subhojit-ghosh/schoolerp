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
  INVENTORY_READ: "inventory:read",
  INVENTORY_MANAGE: "inventory:manage",
  HOSTEL_READ: "hostel:read",
  HOSTEL_MANAGE: "hostel:manage",
  STAFF_ATTENDANCE_READ: "staff_attendance:read",
  STAFF_ATTENDANCE_MANAGE: "staff_attendance:manage",
  EXPENSES_READ: "expenses:read",
  EXPENSES_MANAGE: "expenses:manage",
  EXPENSES_APPROVE: "expenses:approve",
  SCHOLARSHIPS_READ: "scholarships:read",
  SCHOLARSHIPS_MANAGE: "scholarships:manage",
  EMERGENCY_BROADCAST_SEND: "emergency_broadcast:send",
  INCOME_READ: "income:read",
  INCOME_MANAGE: "income:manage",
  DPDPA_MANAGE: "dpdpa:manage",
} as const;

export const DATA_EXCHANGE_ENTITY_TYPES = {
  STUDENTS: "students",
  STAFF: "staff",
  GUARDIANS: "guardians",
  FEE_ASSIGNMENTS: "feeAssignments",
  LIBRARY_BOOKS: "libraryBooks",
  CALENDAR_HOLIDAYS: "calendarHolidays",
  INVENTORY_ITEMS: "inventoryItems",
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
  INVENTORY_CATEGORY: "inventory_category",
  INVENTORY_ITEM: "inventory_item",
  STOCK_TRANSACTION: "stock_transaction",
  HOSTEL_BUILDING: "hostel_building",
  HOSTEL_ROOM: "hostel_room",
  BED_ALLOCATION: "bed_allocation",
  MESS_PLAN: "mess_plan",
  STAFF_ATTENDANCE_DAY: "staff_attendance_day",
  LIBRARY_RESERVATION: "library_reservation",
  LIBRARY_FINE: "library_fine",
  ADMISSION_DOCUMENT: "admission_document",
  ADMISSION_CONVERSION: "admission_conversion",
  HOSTEL_MESS_ASSIGNMENT: "hostel_mess_assignment",
  HOSTEL_ROOM_TRANSFER: "hostel_room_transfer",
  TRANSPORT_DRIVER: "transport_driver",
  TRANSPORT_MAINTENANCE: "transport_maintenance",
  VENDOR: "vendor",
  PURCHASE_ORDER: "purchase_order",
  HOMEWORK_SUBMISSION: "homework_submission",
  STUDENT_SIBLING_LINK: "student_sibling_link",
  STUDENT_MEDICAL_RECORD: "student_medical_record",
  STUDENT_DISCIPLINARY: "student_disciplinary",
  TRANSFER_CERTIFICATE: "transfer_certificate",
  STAFF_DOCUMENT: "staff_document",
  STAFF_CAMPUS_TRANSFER: "staff_campus_transfer",
  DOMAIN_EVENT: "domain_event",
  EXPENSE_CATEGORY: "expense_category",
  EXPENSE: "expense",
  SCHOLARSHIP: "scholarship",
  SCHOLARSHIP_APPLICATION: "scholarship_application",
  EMERGENCY_BROADCAST: "emergency_broadcast",
  INCOME_RECORD: "income_record",
  DATA_CONSENT: "data_consent",
  FILE_UPLOAD: "file_upload",
  SENSITIVE_DATA_ACCESS: "sensitive_data_access",
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
  FAIL: "fail",
  WITHDRAW: "withdraw",
} as const;

export const STUDENT_ROLLOVER_PREVIEW_STATUS = {
  MAPPED: "mapped",
  FAILED: "failed",
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

// ── Fee categories ──────────────────────────────────────────────────────────
export const FEE_CATEGORIES = {
  TUITION: "tuition",
  TRANSPORT: "transport",
  HOSTEL: "hostel",
  LAB: "lab",
  MISC: "misc",
} as const;
export const FEE_CATEGORY_LABELS = {
  [FEE_CATEGORIES.TUITION]: "Tuition",
  [FEE_CATEGORIES.TRANSPORT]: "Transport",
  [FEE_CATEGORIES.HOSTEL]: "Hostel",
  [FEE_CATEGORIES.LAB]: "Lab",
  [FEE_CATEGORIES.MISC]: "Miscellaneous",
} as const;
export type FeeCategory = (typeof FEE_CATEGORIES)[keyof typeof FEE_CATEGORIES];

// ── Late fee calculation types ──────────────────────────────────────────────
export const LATE_FEE_CALC_TYPES = {
  FLAT: "flat",
  PER_DAY: "per_day",
} as const;
export const LATE_FEE_CALC_TYPE_LABELS = {
  [LATE_FEE_CALC_TYPES.FLAT]: "Flat Amount",
  [LATE_FEE_CALC_TYPES.PER_DAY]: "Per Day",
} as const;
export type LateFeeCalcType =
  (typeof LATE_FEE_CALC_TYPES)[keyof typeof LATE_FEE_CALC_TYPES];

// ── Exam types ──────────────────────────────────────────────────────────────
export const EXAM_TYPES = {
  UNIT_TEST: "unit_test",
  MIDTERM: "midterm",
  FINAL: "final",
  PRACTICAL: "practical",
} as const;
export const EXAM_TYPE_LABELS = {
  [EXAM_TYPES.UNIT_TEST]: "Unit Test",
  [EXAM_TYPES.MIDTERM]: "Mid-Term",
  [EXAM_TYPES.FINAL]: "Final",
  [EXAM_TYPES.PRACTICAL]: "Practical",
} as const;
export type ExamType = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES];

// ── Grading scale statuses ──────────────────────────────────────────────────
export const GRADING_SCALE_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;
export type GradingScaleStatus =
  (typeof GRADING_SCALE_STATUS)[keyof typeof GRADING_SCALE_STATUS];

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
  LEAVE_APPROVED: "leave_approved",
  LEAVE_REJECTED: "leave_rejected",
  ADMISSION_CONVERSION_SUGGESTED: "admission_conversion_suggested",
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

export const SIBLING_RELATIONSHIPS = {
  ELDER_BROTHER: "elder_brother",
  YOUNGER_BROTHER: "younger_brother",
  ELDER_SISTER: "elder_sister",
  YOUNGER_SISTER: "younger_sister",
  ELDER_SIBLING: "elder_sibling",
  YOUNGER_SIBLING: "younger_sibling",
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

export const siblingRelationshipSchema = z.enum([
  SIBLING_RELATIONSHIPS.ELDER_BROTHER,
  SIBLING_RELATIONSHIPS.YOUNGER_BROTHER,
  SIBLING_RELATIONSHIPS.ELDER_SISTER,
  SIBLING_RELATIONSHIPS.YOUNGER_SISTER,
  SIBLING_RELATIONSHIPS.ELDER_SIBLING,
  SIBLING_RELATIONSHIPS.YOUNGER_SIBLING,
]);
export const dataExchangeEntityTypeSchema = z.enum([
  DATA_EXCHANGE_ENTITY_TYPES.STUDENTS,
  DATA_EXCHANGE_ENTITY_TYPES.STAFF,
  DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS,
  DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS,
  DATA_EXCHANGE_ENTITY_TYPES.LIBRARY_BOOKS,
  DATA_EXCHANGE_ENTITY_TYPES.CALENDAR_HOLIDAYS,
  DATA_EXCHANGE_ENTITY_TYPES.INVENTORY_ITEMS,
]);
export const ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  HALF_DAY: "half_day",
  EXCUSED: "excused",
} as const;
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUSES.PRESENT]: "Present",
  [ATTENDANCE_STATUSES.ABSENT]: "Absent",
  [ATTENDANCE_STATUSES.LATE]: "Late",
  [ATTENDANCE_STATUSES.HALF_DAY]: "Half Day",
  [ATTENDANCE_STATUSES.EXCUSED]: "Excused",
} as const;
export const attendanceStatusSchema = z.enum([
  ATTENDANCE_STATUSES.PRESENT,
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.LATE,
  ATTENDANCE_STATUSES.HALF_DAY,
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
export type SiblingRelationship = z.infer<typeof siblingRelationshipSchema>;
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

export const INVENTORY_CATEGORY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const INVENTORY_ITEM_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const STOCK_TRANSACTION_TYPES = {
  PURCHASE: "purchase",
  ISSUE: "issue",
  RETURN: "return",
  ADJUSTMENT: "adjustment",
} as const;

export const INVENTORY_UNITS = {
  PIECE: "piece",
  BOX: "box",
  PACK: "pack",
  SET: "set",
  KG: "kg",
  LITER: "liter",
} as const;

export const inventoryCategoryStatusSchema = z.enum([
  INVENTORY_CATEGORY_STATUS.ACTIVE,
  INVENTORY_CATEGORY_STATUS.INACTIVE,
  INVENTORY_CATEGORY_STATUS.DELETED,
]);

export const inventoryItemStatusSchema = z.enum([
  INVENTORY_ITEM_STATUS.ACTIVE,
  INVENTORY_ITEM_STATUS.INACTIVE,
  INVENTORY_ITEM_STATUS.DELETED,
]);

export const stockTransactionTypeSchema = z.enum([
  STOCK_TRANSACTION_TYPES.PURCHASE,
  STOCK_TRANSACTION_TYPES.ISSUE,
  STOCK_TRANSACTION_TYPES.RETURN,
  STOCK_TRANSACTION_TYPES.ADJUSTMENT,
]);

export const inventoryUnitSchema = z.enum([
  INVENTORY_UNITS.PIECE,
  INVENTORY_UNITS.BOX,
  INVENTORY_UNITS.PACK,
  INVENTORY_UNITS.SET,
  INVENTORY_UNITS.KG,
  INVENTORY_UNITS.LITER,
]);

export type InventoryCategoryStatus = z.infer<
  typeof inventoryCategoryStatusSchema
>;
export type InventoryItemStatus = z.infer<typeof inventoryItemStatusSchema>;
export type StockTransactionType = z.infer<typeof stockTransactionTypeSchema>;
export type InventoryUnit = z.infer<typeof inventoryUnitSchema>;

// ── Hostel ──────────────────────────────────────────────────────────────────

export const HOSTEL_BUILDING_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const HOSTEL_BUILDING_TYPES = {
  BOYS: "boys",
  GIRLS: "girls",
  CO_ED: "co_ed",
} as const;

export const HOSTEL_ROOM_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const HOSTEL_ROOM_TYPES = {
  SINGLE: "single",
  DOUBLE: "double",
  DORMITORY: "dormitory",
} as const;

export const BED_ALLOCATION_STATUS = {
  ACTIVE: "active",
  VACATED: "vacated",
} as const;

export const MESS_PLAN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// ── Library depth ──────────────────────────────────────────────────────────

export const LIBRARY_RESERVATION_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
} as const;

export const libraryReservationStatusSchema = z.enum([
  LIBRARY_RESERVATION_STATUS.PENDING,
  LIBRARY_RESERVATION_STATUS.FULFILLED,
  LIBRARY_RESERVATION_STATUS.CANCELLED,
]);

export type LibraryReservationStatus = z.infer<
  typeof libraryReservationStatusSchema
>;

// ── Announcement depth ─────────────────────────────────────────────────────

export const ANNOUNCEMENT_CATEGORIES = {
  ACADEMIC: "academic",
  DISCIPLINARY: "disciplinary",
  GENERAL: "general",
  URGENT: "urgent",
} as const;

export const announcementCategorySchema = z.enum([
  ANNOUNCEMENT_CATEGORIES.ACADEMIC,
  ANNOUNCEMENT_CATEGORIES.DISCIPLINARY,
  ANNOUNCEMENT_CATEGORIES.GENERAL,
  ANNOUNCEMENT_CATEGORIES.URGENT,
]);

export type AnnouncementCategory = z.infer<typeof announcementCategorySchema>;

// ── Homework depth ─────────────────────────────────────────────────────────

export const HOMEWORK_SUBMISSION_STATUS = {
  SUBMITTED: "submitted",
  NOT_SUBMITTED: "not_submitted",
  LATE: "late",
} as const;

export const homeworkSubmissionStatusSchema = z.enum([
  HOMEWORK_SUBMISSION_STATUS.SUBMITTED,
  HOMEWORK_SUBMISSION_STATUS.NOT_SUBMITTED,
  HOMEWORK_SUBMISSION_STATUS.LATE,
]);

export type HomeworkSubmissionStatus = z.infer<
  typeof homeworkSubmissionStatusSchema
>;

// ── Admissions depth ───────────────────────────────────────────────────────

export const ADMISSION_APPLICATION_STATUSES_EXTENDED = {
  ...ADMISSION_APPLICATION_STATUSES,
  WAITLISTED: "waitlisted",
  CONVERTED: "converted",
} as const;

export const ADMISSION_DOCUMENT_STATUS = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export const admissionDocumentStatusSchema = z.enum([
  ADMISSION_DOCUMENT_STATUS.PENDING,
  ADMISSION_DOCUMENT_STATUS.UPLOADED,
  ADMISSION_DOCUMENT_STATUS.VERIFIED,
  ADMISSION_DOCUMENT_STATUS.REJECTED,
]);

export type AdmissionDocumentStatus = z.infer<
  typeof admissionDocumentStatusSchema
>;

// ── Inventory depth ────────────────────────────────────────────────────────

export const PURCHASE_ORDER_STATUS = {
  DRAFT: "draft",
  ORDERED: "ordered",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
  CANCELLED: "cancelled",
} as const;

export const purchaseOrderStatusSchema = z.enum([
  PURCHASE_ORDER_STATUS.DRAFT,
  PURCHASE_ORDER_STATUS.ORDERED,
  PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
  PURCHASE_ORDER_STATUS.RECEIVED,
  PURCHASE_ORDER_STATUS.CANCELLED,
]);

export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusSchema>;

export const VENDOR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const vendorStatusSchema = z.enum([
  VENDOR_STATUS.ACTIVE,
  VENDOR_STATUS.INACTIVE,
]);

export type VendorStatus = z.infer<typeof vendorStatusSchema>;

// ── Transport depth ────────────────────────────────────────────────────────

export const VEHICLE_MAINTENANCE_TYPE = {
  REGULAR: "regular",
  REPAIR: "repair",
  INSPECTION: "inspection",
} as const;

export const vehicleMaintenanceTypeSchema = z.enum([
  VEHICLE_MAINTENANCE_TYPE.REGULAR,
  VEHICLE_MAINTENANCE_TYPE.REPAIR,
  VEHICLE_MAINTENANCE_TYPE.INSPECTION,
]);

export type VehicleMaintenanceType = z.infer<
  typeof vehicleMaintenanceTypeSchema
>;

// ── Student depth ──────────────────────────────────────────────────────────

export const DISCIPLINARY_SEVERITY = {
  MINOR: "minor",
  MODERATE: "moderate",
  MAJOR: "major",
} as const;

export const disciplinarySeveritySchema = z.enum([
  DISCIPLINARY_SEVERITY.MINOR,
  DISCIPLINARY_SEVERITY.MODERATE,
  DISCIPLINARY_SEVERITY.MAJOR,
]);

export type DisciplinarySeverity = z.infer<typeof disciplinarySeveritySchema>;

export const TC_STATUS = {
  ISSUED: "issued",
  CANCELLED: "cancelled",
} as const;

export const tcStatusSchema = z.enum([TC_STATUS.ISSUED, TC_STATUS.CANCELLED]);

export type TcStatus = z.infer<typeof tcStatusSchema>;

// ── Guardian depth ─────────────────────────────────────────────────────────

export const COMMUNICATION_PREFERENCES = {
  SMS: "sms",
  WHATSAPP: "whatsapp",
  EMAIL: "email",
} as const;

export const communicationPreferenceSchema = z.enum([
  COMMUNICATION_PREFERENCES.SMS,
  COMMUNICATION_PREFERENCES.WHATSAPP,
  COMMUNICATION_PREFERENCES.EMAIL,
]);

export type CommunicationPreference = z.infer<
  typeof communicationPreferenceSchema
>;

// ── Phase 2 remaining: Domain events ───────────────────────────────────────

export const DOMAIN_EVENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
} as const;

export const domainEventStatusSchema = z.enum([
  DOMAIN_EVENT_STATUS.PENDING,
  DOMAIN_EVENT_STATUS.PROCESSING,
  DOMAIN_EVENT_STATUS.PROCESSED,
  DOMAIN_EVENT_STATUS.FAILED,
]);

export type DomainEventStatus = z.infer<typeof domainEventStatusSchema>;

export const DOMAIN_EVENT_TYPES = {
  ATTENDANCE_MARKED: "attendance.marked",
  ATTENDANCE_ABSENT: "attendance.absent",
  ATTENDANCE_ABSENT_STREAK: "attendance.absent.streak",
  FEE_PAYMENT_RECEIVED: "fee.payment.received",
  FEE_OVERDUE: "fee.overdue",
  ADMISSION_APPROVED: "admission.approved",
  STUDENT_CREATED: "student.created",
  ANNOUNCEMENT_PUBLISHED: "announcement.published",
  LEAVE_APPROVED: "leave.approved",
  LEAVE_REJECTED: "leave.rejected",
  EMERGENCY_BROADCAST: "emergency.broadcast",
} as const;

export type DomainEventType =
  (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

// ── Phase 2 remaining: Expense management ──────────────────────────────────

export const EXPENSE_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const;

export const expenseStatusSchema = z.enum([
  EXPENSE_STATUS.DRAFT,
  EXPENSE_STATUS.SUBMITTED,
  EXPENSE_STATUS.APPROVED,
  EXPENSE_STATUS.REJECTED,
  EXPENSE_STATUS.PAID,
]);

export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;

export const EXPENSE_CATEGORY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const expenseCategoryStatusSchema = z.enum([
  EXPENSE_CATEGORY_STATUS.ACTIVE,
  EXPENSE_CATEGORY_STATUS.INACTIVE,
]);

export type ExpenseCategoryStatus = z.infer<typeof expenseCategoryStatusSchema>;

// ── Phase 2 remaining: Scholarship management ──────────────────────────────

export const SCHOLARSHIP_TYPES = {
  MERIT: "merit",
  NEED_BASED: "need_based",
  SPORTS: "sports",
  GOVERNMENT_PRE_MATRIC: "government_pre_matric",
  GOVERNMENT_POST_MATRIC: "government_post_matric",
  MINORITY: "minority",
  SC_ST: "sc_st",
  OTHER: "other",
} as const;

export const scholarshipTypeSchema = z.enum([
  SCHOLARSHIP_TYPES.MERIT,
  SCHOLARSHIP_TYPES.NEED_BASED,
  SCHOLARSHIP_TYPES.SPORTS,
  SCHOLARSHIP_TYPES.GOVERNMENT_PRE_MATRIC,
  SCHOLARSHIP_TYPES.GOVERNMENT_POST_MATRIC,
  SCHOLARSHIP_TYPES.MINORITY,
  SCHOLARSHIP_TYPES.SC_ST,
  SCHOLARSHIP_TYPES.OTHER,
]);

export type ScholarshipType = z.infer<typeof scholarshipTypeSchema>;

export const SCHOLARSHIP_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
} as const;

export const scholarshipStatusSchema = z.enum([
  SCHOLARSHIP_STATUS.ACTIVE,
  SCHOLARSHIP_STATUS.INACTIVE,
  SCHOLARSHIP_STATUS.DELETED,
]);

export type ScholarshipStatus = z.infer<typeof scholarshipStatusSchema>;

export const SCHOLARSHIP_APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export const scholarshipApplicationStatusSchema = z.enum([
  SCHOLARSHIP_APPLICATION_STATUS.PENDING,
  SCHOLARSHIP_APPLICATION_STATUS.APPROVED,
  SCHOLARSHIP_APPLICATION_STATUS.REJECTED,
  SCHOLARSHIP_APPLICATION_STATUS.EXPIRED,
]);

export type ScholarshipApplicationStatus = z.infer<
  typeof scholarshipApplicationStatusSchema
>;

export const DBT_STATUS = {
  NOT_APPLIED: "not_applied",
  APPLIED: "applied",
  SANCTIONED: "sanctioned",
  DISBURSED: "disbursed",
  REJECTED: "rejected",
} as const;

export const dbtStatusSchema = z.enum([
  DBT_STATUS.NOT_APPLIED,
  DBT_STATUS.APPLIED,
  DBT_STATUS.SANCTIONED,
  DBT_STATUS.DISBURSED,
  DBT_STATUS.REJECTED,
]);

export type DbtStatus = z.infer<typeof dbtStatusSchema>;

// ── Phase 2 remaining: Emergency broadcast ─────────────────────────────────

export const BROADCAST_STATUS = {
  DRAFT: "draft",
  SENDING: "sending",
  SENT: "sent",
  FAILED: "failed",
} as const;

export const broadcastStatusSchema = z.enum([
  BROADCAST_STATUS.DRAFT,
  BROADCAST_STATUS.SENDING,
  BROADCAST_STATUS.SENT,
  BROADCAST_STATUS.FAILED,
]);

export type BroadcastStatus = z.infer<typeof broadcastStatusSchema>;

export const BROADCAST_TARGET_TYPES = {
  ALL: "all",
  CAMPUS: "campus",
  CLASS: "class",
  SECTION: "section",
  TRANSPORT_ROUTE: "transport_route",
} as const;

export const broadcastTargetTypeSchema = z.enum([
  BROADCAST_TARGET_TYPES.ALL,
  BROADCAST_TARGET_TYPES.CAMPUS,
  BROADCAST_TARGET_TYPES.CLASS,
  BROADCAST_TARGET_TYPES.SECTION,
  BROADCAST_TARGET_TYPES.TRANSPORT_ROUTE,
]);

export type BroadcastTargetType = z.infer<typeof broadcastTargetTypeSchema>;

export const BROADCAST_PRIORITY = {
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const broadcastPrioritySchema = z.enum([
  BROADCAST_PRIORITY.NORMAL,
  BROADCAST_PRIORITY.HIGH,
  BROADCAST_PRIORITY.CRITICAL,
]);

export type BroadcastPriority = z.infer<typeof broadcastPrioritySchema>;

// ── Phase 2 remaining: Income tracking ─────────────────────────────────────

export const INCOME_CATEGORIES = {
  DONATION: "donation",
  GRANT: "grant",
  GOVERNMENT_AID: "government_aid",
  RENTAL: "rental",
  CANTEEN: "canteen",
  ADMISSION_FEE: "admission_fee",
  OTHER: "other",
} as const;

export const incomeCategorySchema = z.enum([
  INCOME_CATEGORIES.DONATION,
  INCOME_CATEGORIES.GRANT,
  INCOME_CATEGORIES.GOVERNMENT_AID,
  INCOME_CATEGORIES.RENTAL,
  INCOME_CATEGORIES.CANTEEN,
  INCOME_CATEGORIES.ADMISSION_FEE,
  INCOME_CATEGORIES.OTHER,
]);

export type IncomeCategory = z.infer<typeof incomeCategorySchema>;

// ── Phase 2 remaining: DPDPA compliance ────────────────────────────────────

export const CONSENT_PURPOSES = {
  DATA_COLLECTION: "data_collection",
  COMMUNICATION: "communication",
  THIRD_PARTY_SHARING: "third_party_sharing",
  MARKETING: "marketing",
} as const;

export const consentPurposeSchema = z.enum([
  CONSENT_PURPOSES.DATA_COLLECTION,
  CONSENT_PURPOSES.COMMUNICATION,
  CONSENT_PURPOSES.THIRD_PARTY_SHARING,
  CONSENT_PURPOSES.MARKETING,
]);

export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;

export const CONSENT_STATUS = {
  GRANTED: "granted",
  WITHDRAWN: "withdrawn",
} as const;

export const consentStatusSchema = z.enum([
  CONSENT_STATUS.GRANTED,
  CONSENT_STATUS.WITHDRAWN,
]);

export type ConsentStatus = z.infer<typeof consentStatusSchema>;

// ── Phase 2 remaining: File uploads ────────────────────────────────────────

export const UPLOAD_ENTITY_TYPES = {
  STUDENT_PHOTO: "student_photo",
  HOMEWORK_ATTACHMENT: "homework_attachment",
  HOMEWORK_SUBMISSION: "homework_submission",
  STAFF_DOCUMENT: "staff_document",
  ADMISSION_DOCUMENT: "admission_document",
  EXPENSE_RECEIPT: "expense_receipt",
  GENERAL: "general",
} as const;

export const uploadEntityTypeSchema = z.enum([
  UPLOAD_ENTITY_TYPES.STUDENT_PHOTO,
  UPLOAD_ENTITY_TYPES.HOMEWORK_ATTACHMENT,
  UPLOAD_ENTITY_TYPES.HOMEWORK_SUBMISSION,
  UPLOAD_ENTITY_TYPES.STAFF_DOCUMENT,
  UPLOAD_ENTITY_TYPES.ADMISSION_DOCUMENT,
  UPLOAD_ENTITY_TYPES.EXPENSE_RECEIPT,
  UPLOAD_ENTITY_TYPES.GENERAL,
]);

export type UploadEntityType = z.infer<typeof uploadEntityTypeSchema>;

export const hostelBuildingStatusSchema = z.enum([
  HOSTEL_BUILDING_STATUS.ACTIVE,
  HOSTEL_BUILDING_STATUS.INACTIVE,
  HOSTEL_BUILDING_STATUS.DELETED,
]);

export const hostelBuildingTypeSchema = z.enum([
  HOSTEL_BUILDING_TYPES.BOYS,
  HOSTEL_BUILDING_TYPES.GIRLS,
  HOSTEL_BUILDING_TYPES.CO_ED,
]);

export const hostelRoomStatusSchema = z.enum([
  HOSTEL_ROOM_STATUS.ACTIVE,
  HOSTEL_ROOM_STATUS.INACTIVE,
]);

export const hostelRoomTypeSchema = z.enum([
  HOSTEL_ROOM_TYPES.SINGLE,
  HOSTEL_ROOM_TYPES.DOUBLE,
  HOSTEL_ROOM_TYPES.DORMITORY,
]);

export const bedAllocationStatusSchema = z.enum([
  BED_ALLOCATION_STATUS.ACTIVE,
  BED_ALLOCATION_STATUS.VACATED,
]);

export const messPlanStatusSchema = z.enum([
  MESS_PLAN_STATUS.ACTIVE,
  MESS_PLAN_STATUS.INACTIVE,
]);

export type HostelBuildingStatus = z.infer<typeof hostelBuildingStatusSchema>;
export type HostelBuildingType = z.infer<typeof hostelBuildingTypeSchema>;
export type HostelRoomStatus = z.infer<typeof hostelRoomStatusSchema>;
export type HostelRoomType = z.infer<typeof hostelRoomTypeSchema>;
export type BedAllocationStatus = z.infer<typeof bedAllocationStatusSchema>;
export type MessPlanStatus = z.infer<typeof messPlanStatusSchema>;

// ── Staff Attendance ──────────────────────────────────────────────────────

export const STAFF_ATTENDANCE_STATUSES = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  ON_LEAVE: "on_leave",
} as const;

export const STAFF_ATTENDANCE_STATUS_LABELS = {
  [STAFF_ATTENDANCE_STATUSES.PRESENT]: "Present",
  [STAFF_ATTENDANCE_STATUSES.ABSENT]: "Absent",
  [STAFF_ATTENDANCE_STATUSES.HALF_DAY]: "Half Day",
  [STAFF_ATTENDANCE_STATUSES.ON_LEAVE]: "On Leave",
} as const;

export const staffAttendanceStatusSchema = z.enum([
  STAFF_ATTENDANCE_STATUSES.PRESENT,
  STAFF_ATTENDANCE_STATUSES.ABSENT,
  STAFF_ATTENDANCE_STATUSES.HALF_DAY,
  STAFF_ATTENDANCE_STATUSES.ON_LEAVE,
]);

export type StaffAttendanceStatus = z.infer<typeof staffAttendanceStatusSchema>;

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
