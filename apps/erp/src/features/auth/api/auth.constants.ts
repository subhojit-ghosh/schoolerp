export const AUTH_API_PATHS = {
  ME: "/auth/me",
  SESSION: "/auth/session",
  SIGN_IN: "/auth/sign-in",
  SIGN_OUT: "/auth/sign-out",
  SIGN_UP: "/auth/sign-up",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  SELECT_CONTEXT: "/auth/context/select",
  SELECT_CAMPUS: "/auth/context/campus",
} as const;

export const ONBOARDING_API_PATHS = {
  CREATE_INSTITUTION: "/onboarding/institutions",
} as const;

export const STUDENTS_API_PATHS = {
  LIST: "/students",
  OPTIONS: "/students/options",
  CREATE: "/students",
  DETAIL: "/students/{studentId}",
  SUMMARY: "/students/{studentId}/summary",
  UPDATE: "/students/{studentId}",
  ROLLOVER_PREVIEW: "/students/rollover/preview",
  ROLLOVER_EXECUTE: "/students/rollover/execute",
} as const;

export const ADMISSIONS_API_PATHS = {
  LIST_FORM_FIELDS: "/admissions/form-fields",
  CREATE_FORM_FIELD: "/admissions/form-fields",
  UPDATE_FORM_FIELD: "/admissions/form-fields/{fieldId}",
  LIST_ENQUIRIES: "/admissions/enquiries",
  CREATE_ENQUIRY: "/admissions/enquiries",
  DETAIL_ENQUIRY: "/admissions/enquiries/{enquiryId}",
  UPDATE_ENQUIRY: "/admissions/enquiries/{enquiryId}",
  LIST_APPLICATIONS: "/admissions/applications",
  CREATE_APPLICATION: "/admissions/applications",
  DETAIL_APPLICATION: "/admissions/applications/{applicationId}",
  UPDATE_APPLICATION: "/admissions/applications/{applicationId}",
} as const;

export const STAFF_API_PATHS = {
  LIST: "/staff",
  CREATE: "/staff",
  DETAIL: "/staff/{staffId}",
  UPDATE: "/staff/{staffId}",
  SET_STATUS: "/staff/{staffId}/status",
  DELETE: "/staff/{staffId}",
  ROLES: "/staff/roles",
  LIST_ASSIGNMENTS: "/staff/{staffId}/roles",
  CREATE_ASSIGNMENT: "/staff/{staffId}/roles",
  DELETE_ASSIGNMENT: "/staff/{staffId}/roles/{assignmentId}",
} as const;

export const GUARDIANS_API_PATHS = {
  LIST: "/guardians",
  DETAIL: "/guardians/{guardianId}",
  UPDATE: "/guardians/{guardianId}",
  LINK_STUDENT: "/guardians/{guardianId}/students",
  UPDATE_STUDENT_LINK: "/guardians/{guardianId}/students/{studentId}",
  UNLINK_STUDENT: "/guardians/{guardianId}/students/{studentId}",
} as const;

export const ACADEMIC_YEARS_API_PATHS = {
  LIST: "/academic-years",
  CREATE: "/academic-years",
  DETAIL: "/academic-years/{academicYearId}",
  UPDATE: "/academic-years/{academicYearId}",
} as const;

export const CLASSES_API_PATHS = {
  LIST: "/classes",
  CREATE: "/classes",
  DETAIL: "/classes/{classId}",
  UPDATE: "/classes/{classId}",
  SET_STATUS: "/classes/{classId}/status",
  DELETE: "/classes/{classId}",
} as const;

export const SUBJECTS_API_PATHS = {
  LIST: "/subjects",
  CREATE: "/subjects",
  DETAIL: "/subjects/{subjectId}",
  UPDATE: "/subjects/{subjectId}",
  SET_STATUS: "/subjects/{subjectId}/status",
  DELETE: "/subjects/{subjectId}",
} as const;

export const TIMETABLE_API_PATHS = {
  VIEW: "/timetable",
  REPLACE_SECTION: "/timetable/sections/{sectionId}",
  DELETE_ENTRY: "/timetable/{entryId}",
} as const;

export const CALENDAR_API_PATHS = {
  LIST_EVENTS: "/calendar/events",
  CREATE_EVENT: "/calendar/events",
  DETAIL_EVENT: "/calendar/events/{eventId}",
  UPDATE_EVENT: "/calendar/events/{eventId}",
  SET_EVENT_STATUS: "/calendar/events/{eventId}/status",
  DELETE_EVENT: "/calendar/events/{eventId}",
} as const;

export const COMMUNICATIONS_API_PATHS = {
  LIST_ANNOUNCEMENTS: "/communications/announcements",
  CREATE_ANNOUNCEMENT: "/communications/announcements",
  DETAIL_ANNOUNCEMENT: "/communications/announcements/{announcementId}",
  UPDATE_ANNOUNCEMENT: "/communications/announcements/{announcementId}",
  SET_ANNOUNCEMENT_STATUS:
    "/communications/announcements/{announcementId}/status",
  PUBLISH_ANNOUNCEMENT:
    "/communications/announcements/{announcementId}/publish",
  LIST_NOTIFICATIONS: "/communications/notifications",
  MARK_ALL_NOTIFICATIONS_READ: "/communications/notifications/mark-all-read",
} as const;

export const FAMILY_API_PATHS = {
  OVERVIEW: "/family/overview",
} as const;

export const CAMPUSES_API_PATHS = {
  LIST: "/campuses",
  CREATE: "/campuses",
} as const;

export const ATTENDANCE_API_PATHS = {
  CLASS_SECTIONS: "/attendance/class-sections",
  DAY: "/attendance/day",
  DAY_VIEW: "/attendance/day-view",
  OVERVIEW: "/attendance/overview",
  CLASS_REPORT: "/attendance/class-report",
  STUDENT_REPORT: "/attendance/student-report",
} as const;

export const EXAMS_API_PATHS = {
  LIST_TERMS: "/exams/terms",
  CREATE_TERM: "/exams/terms",
  LIST_MARKS: "/exams/terms/{examTermId}/marks",
  REPLACE_MARKS: "/exams/terms/{examTermId}/marks",
  REPORT_CARD: "/exams/terms/{examTermId}/report-card",
} as const;

export const INSTITUTIONS_API_PATHS = {
  UPDATE_BRANDING: "/institutions/current/branding",
} as const;

export const FEES_API_PATHS = {
  LIST_STRUCTURES: "/fees/structures",
  CREATE_STRUCTURE: "/fees/structures",
  GET_STRUCTURE: "/fees/structures/{feeStructureId}",
  UPDATE_STRUCTURE: "/fees/structures/{feeStructureId}",
  SET_STRUCTURE_STATUS: "/fees/structures/{feeStructureId}/status",
  DELETE_STRUCTURE: "/fees/structures/{feeStructureId}",
  DUPLICATE_STRUCTURE: "/fees/structures/{feeStructureId}/duplicate",
  CREATE_NEXT_STRUCTURE_VERSION:
    "/fees/structures/{feeStructureId}/create-next-version",
  LIST_ASSIGNMENTS: "/fees/assignments",
  CREATE_ASSIGNMENT: "/fees/assignments",
  BULK_ASSIGN: "/fees/assignments/bulk",
  GET_ASSIGNMENT: "/fees/assignments/{feeAssignmentId}",
  CREATE_ADJUSTMENT: "/fees/assignments/{feeAssignmentId}/adjustments",
  UPDATE_ASSIGNMENT: "/fees/assignments/{feeAssignmentId}",
  DELETE_ASSIGNMENT: "/fees/assignments/{feeAssignmentId}",
  CREATE_PAYMENT: "/fees/payments",
  REVERSE_PAYMENT: "/fees/payments/{feePaymentId}/reverse",
  LIST_DUES: "/fees/dues",
  COLLECTION_SUMMARY: "/fees/reports/collection-summary",
} as const;

export const DATA_EXCHANGE_API_PATHS = {
  CAPABILITIES: "/data-exchange/capabilities",
  TEMPLATE: "/data-exchange/templates/{entityType}",
  PREVIEW_IMPORT: "/data-exchange/imports/preview",
  EXECUTE_IMPORT: "/data-exchange/imports/execute",
  EXPORT: "/data-exchange/exports/{entityType}",
} as const;

export const ROLES_API_PATHS = {
  LIST: "/roles",
  CREATE: "/roles",
  DETAIL: "/roles/{roleId}",
  UPDATE: "/roles/{roleId}",
  DELETE: "/roles/{roleId}",
} as const;

export const PERMISSIONS_API_PATHS = {
  LIST: "/permissions",
} as const;

export const AUDIT_API_PATHS = {
  LIST: "/audit-logs",
} as const;
