export const AUTH_API_PATHS = {
  ME: "/auth/me",
  SESSION: "/auth/session",
  SIGN_IN: "/auth/sign-in",
  SIGN_OUT: "/auth/sign-out",
  SIGN_UP: "/auth/sign-up",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  CHANGE_PASSWORD: "/auth/change-password",
  SELECT_CONTEXT: "/auth/context/select",
  SELECT_CAMPUS: "/auth/context/campus",
} as const;

export const ONBOARDING_API_PATHS = {
  CHECK_SLUG: "/onboarding/check-slug",
  CREATE_INSTITUTION: "/onboarding/institutions",
  SETUP_STATUS: "/onboarding/setup-status",
} as const;

export const STUDENTS_API_PATHS = {
  LIST: "/students",
  OPTIONS: "/students/options",
  CREATE: "/students",
  DETAIL: "/students/{studentId}",
  SUMMARY: "/students/{studentId}/summary",
  UPDATE: "/students/{studentId}",
  DELETE: "/students/{studentId}",
  ROLLOVER_PREVIEW: "/students/rollover/preview",
  ROLLOVER_EXECUTE: "/students/rollover/execute",
  // Phase 2 depth
  LIST_SIBLINGS: "/students/{studentId}/siblings",
  CREATE_SIBLING_LINK: "/students/{studentId}/siblings",
  DELETE_SIBLING_LINK: "/students/{studentId}/siblings/{linkId}",
  GET_MEDICAL_RECORD: "/students/{studentId}/medical",
  UPSERT_MEDICAL_RECORD: "/students/{studentId}/medical",
  LIST_DISCIPLINARY: "/students/{studentId}/disciplinary",
  CREATE_DISCIPLINARY: "/students/{studentId}/disciplinary",
  LIST_TRANSFER_CERTIFICATES: "/students/{studentId}/transfer-certificate",
  ISSUE_TRANSFER_CERTIFICATE: "/students/{studentId}/transfer-certificate",
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
  // Phase 2 depth
  LIST_DOCUMENT_CHECKLIST: "/admissions/document-checklist",
  CREATE_DOCUMENT_CHECKLIST: "/admissions/document-checklist",
  UPDATE_DOCUMENT_CHECKLIST: "/admissions/document-checklist/{itemId}",
  LIST_APPLICATION_DOCUMENTS:
    "/admissions/applications/{applicationId}/application-documents",
  UPSERT_APPLICATION_DOCUMENT:
    "/admissions/applications/{applicationId}/application-documents",
  VERIFY_APPLICATION_DOCUMENT:
    "/admissions/applications/{applicationId}/application-documents/{documentId}",
  CONVERT_TO_STUDENT:
    "/admissions/applications/{applicationId}/convert-to-student",
  WAITLIST_APPLICATION: "/admissions/applications/{applicationId}/waitlist",
  PROMOTE_WAITLISTED: "/admissions/promote",
  RECORD_REGISTRATION_FEE:
    "/admissions/applications/{applicationId}/registration-fee",
} as const;

export const STAFF_API_PATHS = {
  LIST: "/staff",
  CREATE: "/staff",
  DETAIL: "/staff/{staffId}",
  UPDATE: "/staff/{staffId}",
  SET_STATUS: "/staff/{staffId}/status",
  DELETE: "/staff/{staffId}",
  RESET_PASSWORD: "/staff/{staffId}/reset-password",
  ROLES: "/staff/roles",
  LIST_ASSIGNMENTS: "/staff/{staffId}/roles",
  CREATE_ASSIGNMENT: "/staff/{staffId}/roles",
  DELETE_ASSIGNMENT: "/staff/{staffId}/roles/{assignmentId}",
  LIST_SUBJECTS: "/staff/{staffId}/subjects",
  CREATE_SUBJECT: "/staff/{staffId}/subjects",
  DELETE_SUBJECT: "/staff/{staffId}/subjects/{assignmentId}",
  // Phase 2 depth
  LIST_DOCUMENTS: "/staff/{staffId}/staff-documents",
  CREATE_DOCUMENT: "/staff/{staffId}/staff-documents",
  UPDATE_DOCUMENT: "/staff/{staffId}/staff-documents/{documentId}",
  DELETE_DOCUMENT: "/staff/{staffId}/staff-documents/{documentId}",
  TEACHING_LOAD: "/staff/{staffId}/teaching-load",
  LIST_CAMPUS_TRANSFERS: "/staff/{staffId}/campus-transfer",
  CREATE_CAMPUS_TRANSFER: "/staff/{staffId}/campus-transfer",
} as const;

export const GUARDIANS_API_PATHS = {
  LIST: "/guardians",
  DETAIL: "/guardians/{guardianId}",
  UPDATE: "/guardians/{guardianId}",
  LINK_STUDENT: "/guardians/{guardianId}/students",
  UPDATE_STUDENT_LINK: "/guardians/{guardianId}/students/{studentId}",
  UNLINK_STUDENT: "/guardians/{guardianId}/students/{studentId}",
  // Phase 2 depth
  CROSS_STUDENT_FEES: "/guardians/{guardianId}/cross-student-fees",
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

export const BELL_SCHEDULES_API_PATHS = {
  LIST: "/bell-schedules",
  CREATE: "/bell-schedules",
  DETAIL: "/bell-schedules/{scheduleId}",
  UPDATE: "/bell-schedules/{scheduleId}",
  SET_STATUS: "/bell-schedules/{scheduleId}/status",
  REPLACE_PERIODS: "/bell-schedules/{scheduleId}/periods",
} as const;

export const TIMETABLE_API_PATHS = {
  VIEW: "/timetable",
  VERSIONS: "/timetable/versions",
  UPDATE_VERSION: "/timetable/versions/{versionId}",
  PUBLISH_VERSION: "/timetable/versions/{versionId}/publish",
  SET_VERSION_STATUS: "/timetable/versions/{versionId}/status",
  STAFF_OPTIONS: "/timetable/options",
  TEACHER_VIEW: "/timetable/teacher",
  REPLACE_SECTION: "/timetable/sections/{sectionId}",
  COPY_SECTION: "/timetable/sections/{sectionId}/copy-from",
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
  // Phase 2 depth
  MARK_ANNOUNCEMENT_READ:
    "/communications/announcements/{announcementId}/read-receipts",
  ANNOUNCEMENT_READ_COUNT:
    "/communications/announcements/{announcementId}/read-receipts",
} as const;

export const FAMILY_API_PATHS = {
  OVERVIEW: "/family/overview",
} as const;

export const STUDENT_PORTAL_API_PATHS = {
  OVERVIEW: "/student-portal/overview",
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
  MONTHLY_REGISTER: "/attendance/monthly-register",
  CONSOLIDATED_REPORT: "/attendance/reports/consolidated",
  CHRONIC_ABSENTEES: "/attendance/reports/chronic-absentees",
} as const;

export const EXAMS_API_PATHS = {
  LIST_TERMS: "/exams/terms",
  CREATE_TERM: "/exams/terms",
  LIST_MARKS: "/exams/terms/{examTermId}/marks",
  REPLACE_MARKS: "/exams/terms/{examTermId}/marks",
  REPORT_CARD: "/exams/terms/{examTermId}/report-card",
  RANKS: "/exams/terms/{examTermId}/ranks",
  CLASS_ANALYSIS: "/exams/terms/{examTermId}/class-analysis",
  BATCH_REPORT_CARDS: "/exams/terms/{examTermId}/batch-report-cards",
  LIST_GRADING_SCALES: "/exams/grading-scales",
  CREATE_GRADING_SCALE: "/exams/grading-scales",
  UPDATE_GRADING_SCALE: "/exams/grading-scales/{scaleId}",
  SET_DEFAULT_GRADING_SCALE: "/exams/grading-scales/{scaleId}/default",
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
  REMIND_ASSIGNMENT: "/fees/assignments/{feeAssignmentId}/remind",
  LIST_DUES: "/fees/dues",
  COLLECTION_SUMMARY: "/fees/reports/collection-summary",
  DEFAULTERS: "/fees/reports/defaulters",
  MODE_WISE_COLLECTION: "/fees/reports/mode-wise",
  LIST_LATE_FEE_RULES: "/fees/late-fee-rules",
  CREATE_LATE_FEE_RULE: "/fees/late-fee-rules",
  UPDATE_LATE_FEE_RULE: "/fees/late-fee-rules/{ruleId}",
  DEMAND_NOTICE: "/fees/demand-notice",
  BATCH_RECEIPTS: "/fees/batch-receipts",
} as const;

export const DOCUMENTS_API_PATHS = {
  LIST_SIGNATORIES: "/documents/signatories",
  CREATE_SIGNATORY: "/documents/signatories",
  UPDATE_SIGNATORY: "/documents/signatories/{signatoryId}",
  GET_CONFIG: "/documents/config",
  UPDATE_CONFIG: "/documents/config",
} as const;

export const DATA_EXCHANGE_API_PATHS = {
  CAPABILITIES: "/data-exchange/capabilities",
  TEMPLATE: "/data-exchange/templates/{entityType}",
  PREVIEW_IMPORT: "/data-exchange/imports/preview",
  EXECUTE_IMPORT: "/data-exchange/imports/execute",
  EXPORT: "/data-exchange/exports/{entityType}",
  FULL_DUMP: "/data-exchange/exports/full-dump",
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

export const HOMEWORK_API_PATHS = {
  LIST: "/homework",
  CREATE: "/homework",
  DETAIL: "/homework/{homeworkId}",
  UPDATE: "/homework/{homeworkId}",
  PUBLISH: "/homework/{homeworkId}/publish",
  DELETE: "/homework/{homeworkId}",
  // Phase 2 depth
  LIST_SUBMISSIONS: "/homework/{homeworkId}/submissions",
  UPSERT_SUBMISSIONS: "/homework/{homeworkId}/submissions",
  HOMEWORK_ANALYTICS: "/homework/{homeworkId}/analytics",
  CLASS_ANALYTICS: "/homework/analytics/{classId}",
} as const;

export const LEAVE_API_PATHS = {
  LIST_TYPES: "/leave/leave-types",
  CREATE_TYPE: "/leave/leave-types",
  UPDATE_TYPE: "/leave/leave-types/{leaveTypeId}",
  LIST_APPLICATIONS: "/leave/leave-applications",
  DETAIL_APPLICATION: "/leave/leave-applications/{applicationId}",
  APPLY: "/leave/leave-applications",
  APPLY_FOR_STAFF: "/leave/leave-applications/staff/{staffMemberId}",
  REVIEW: "/leave/leave-applications/{applicationId}/review",
  CANCEL: "/leave/leave-applications/{applicationId}/cancel",
  LIST_BALANCES: "/leave/balances",
  ALLOCATE_BALANCES: "/leave/balances/allocate",
  TEAM_CALENDAR: "/leave/team-calendar",
} as const;

export const LIBRARY_API_PATHS = {
  LIST_BOOKS: "/library/books",
  CREATE_BOOK: "/library/books",
  UPDATE_BOOK: "/library/books/{bookId}",
  LIST_TRANSACTIONS: "/library/transactions",
  ISSUE: "/library/transactions",
  RETURN: "/library/transactions/{transactionId}/return",
  // Phase 2 depth
  COLLECT_FINE: "/library/transactions/{transactionId}/fine",
  LIST_RESERVATIONS: "/library/reservations",
  CREATE_RESERVATION: "/library/reservations",
  FULFILL_RESERVATION: "/library/reservations/{reservationId}/fulfill",
  CANCEL_RESERVATION: "/library/reservations/{reservationId}/cancel",
  BORROWING_HISTORY: "/library/borrowing-history/{memberId}",
  LIST_OVERDUE: "/library/overdue",
  MARK_OVERDUE: "/library/overdue",
  DASHBOARD: "/library/dashboard",
} as const;

export const TRANSPORT_API_PATHS = {
  LIST_ROUTES: "/transport/routes",
  CREATE_ROUTE: "/transport/routes",
  GET_ROUTE: "/transport/routes/{routeId}",
  UPDATE_ROUTE: "/transport/routes/{routeId}",
  CREATE_STOP: "/transport/routes/{routeId}/stops",
  UPDATE_STOP: "/transport/routes/{routeId}/stops/{stopId}",
  LIST_VEHICLES: "/transport/vehicles",
  CREATE_VEHICLE: "/transport/vehicles",
  UPDATE_VEHICLE: "/transport/vehicles/{vehicleId}",
  LIST_ASSIGNMENTS: "/transport/assignments",
  CREATE_ASSIGNMENT: "/transport/assignments",
  UPDATE_ASSIGNMENT: "/transport/assignments/{assignmentId}",
  // Phase 2 depth
  LIST_DRIVERS: "/transport/drivers",
  CREATE_DRIVER: "/transport/drivers",
  GET_DRIVER: "/transport/drivers/{driverId}",
  UPDATE_DRIVER: "/transport/drivers/{driverId}",
  LIST_MAINTENANCE: "/transport/maintenance",
  CREATE_MAINTENANCE: "/transport/maintenance",
  ROUTE_STUDENTS: "/transport/route-students/{routeId}",
  DEACTIVATE_ROUTE: "/transport/routes/{routeId}",
  DEACTIVATE_VEHICLE: "/transport/vehicles/{vehicleId}",
} as const;

export const INVENTORY_API_PATHS = {
  LIST_CATEGORIES: "/inventory/categories",
  CREATE_CATEGORY: "/inventory/categories",
  UPDATE_CATEGORY: "/inventory/categories/{categoryId}",
  UPDATE_CATEGORY_STATUS: "/inventory/categories/{categoryId}/status",
  LIST_ITEMS: "/inventory/items",
  CREATE_ITEM: "/inventory/items",
  GET_ITEM: "/inventory/items/{itemId}",
  UPDATE_ITEM: "/inventory/items/{itemId}",
  UPDATE_ITEM_STATUS: "/inventory/items/{itemId}/status",
  LIST_ITEM_TRANSACTIONS: "/inventory/items/{itemId}/transactions",
  LIST_TRANSACTIONS: "/inventory/transactions",
  CREATE_TRANSACTION: "/inventory/transactions",
  LOW_STOCK: "/inventory/low-stock",
  // Phase 2 depth
  LIST_VENDORS: "/inventory/vendors",
  CREATE_VENDOR: "/inventory/vendors",
  UPDATE_VENDOR: "/inventory/vendors/{vendorId}",
  UPDATE_VENDOR_STATUS: "/inventory/vendors/{vendorId}/status",
  LIST_PURCHASE_ORDERS: "/inventory/purchase-orders",
  CREATE_PURCHASE_ORDER: "/inventory/purchase-orders",
  GET_PURCHASE_ORDER: "/inventory/purchase-orders/{orderId}",
  UPDATE_PURCHASE_ORDER: "/inventory/purchase-orders/{orderId}",
  UPDATE_PURCHASE_ORDER_STATUS: "/inventory/purchase-orders/{orderId}/status",
  RECEIVE_PURCHASE_ORDER: "/inventory/purchase-orders/{orderId}/receive",
} as const;

export const HOSTEL_API_PATHS = {
  LIST_BUILDINGS: "/hostel/buildings",
  CREATE_BUILDING: "/hostel/buildings",
  GET_BUILDING: "/hostel/buildings/{buildingId}",
  UPDATE_BUILDING: "/hostel/buildings/{buildingId}",
  UPDATE_BUILDING_STATUS: "/hostel/buildings/{buildingId}/status",
  LIST_ROOMS: "/hostel/rooms",
  CREATE_ROOM: "/hostel/rooms",
  UPDATE_ROOM: "/hostel/rooms/{roomId}",
  UPDATE_ROOM_STATUS: "/hostel/rooms/{roomId}/status",
  LIST_ALLOCATIONS: "/hostel/allocations",
  CREATE_ALLOCATION: "/hostel/allocations",
  VACATE_ALLOCATION: "/hostel/allocations/{allocationId}/vacate",
  LIST_MESS_PLANS: "/hostel/mess-plans",
  CREATE_MESS_PLAN: "/hostel/mess-plans",
  UPDATE_MESS_PLAN: "/hostel/mess-plans/{planId}",
  UPDATE_MESS_PLAN_STATUS: "/hostel/mess-plans/{planId}/status",
  // Phase 2 depth
  LIST_MESS_ASSIGNMENTS: "/hostel/mess-assignments",
  CREATE_MESS_ASSIGNMENT: "/hostel/mess-assignments",
  DEACTIVATE_MESS_ASSIGNMENT:
    "/hostel/mess-assignments/{assignmentId}/deactivate",
  LIST_ROOM_TRANSFERS: "/hostel/room-transfers",
  CREATE_ROOM_TRANSFER: "/hostel/room-transfers",
  OCCUPANCY_DASHBOARD: "/hostel/occupancy",
  BATCH_ALLOCATE: "/hostel/allocations/batch",
} as const;

export const REPORTS_API_PATHS = {
  STUDENT_STRENGTH: "/reports/student-strength",
} as const;

export const DPDPA_API_PATHS = {
  LIST_CONSENTS: "/dpdpa/consents",
  GRANT_CONSENT: "/dpdpa/consents",
  WITHDRAW_CONSENT: "/dpdpa/consents/{purpose}",
  LIST_ACCESS_LOGS: "/dpdpa/sensitive-access",
  GET_SESSION_CONFIG: "/dpdpa/session-config",
  UPDATE_SESSION_CONFIG: "/dpdpa/session-config",
} as const;

export const DASHBOARD_API_PATHS = {
  NEEDS_ATTENTION: "/dashboard/needs-attention",
  TRENDS: "/dashboard/trends",
  DISMISS_ITEM: "/dashboard/needs-attention/{itemId}/dismiss",
} as const;

export const FILE_UPLOADS_API_PATHS = {
  UPLOAD: "/file-uploads",
  LIST: "/file-uploads",
  GET: "/file-uploads/{fileId}",
  DOWNLOAD: "/file-uploads/{fileId}/download",
  DELETE: "/file-uploads/{fileId}",
} as const;

export const STAFF_ATTENDANCE_API_PATHS = {
  ROSTER: "/staff-attendance/roster",
  DAY: "/staff-attendance/day",
  DAY_VIEW: "/staff-attendance/day-view",
  REPORT: "/staff-attendance/report",
} as const;

export const EXPENSES_API_PATHS = {
  LIST_CATEGORIES: "/expense-categories",
  CREATE_CATEGORY: "/expense-categories",
  UPDATE_CATEGORY: "/expense-categories/{categoryId}",
  UPDATE_CATEGORY_STATUS: "/expense-categories/{categoryId}/status",
  LIST: "/expenses",
  CREATE: "/expenses",
  GET: "/expenses/{expenseId}",
  UPDATE: "/expenses/{expenseId}",
  SUBMIT: "/expenses/{expenseId}/submit",
  APPROVE: "/expenses/{expenseId}/approve",
  REJECT: "/expenses/{expenseId}/reject",
  MARK_PAID: "/expenses/{expenseId}/mark-paid",
  SUMMARY: "/expenses/reports/summary",
} as const;

export const INCOME_API_PATHS = {
  LIST: "/income/records",
  CREATE: "/income/records",
  GET: "/income/records/{recordId}",
  UPDATE: "/income/records/{recordId}",
  DELETE: "/income/records/{recordId}",
  SUMMARY: "/income/income-summary",
} as const;

export const SCHOLARSHIPS_API_PATHS = {
  LIST: "/scholarships",
  CREATE: "/scholarships",
  GET: "/scholarships/{scholarshipId}",
  UPDATE: "/scholarships/{scholarshipId}",
  UPDATE_STATUS: "/scholarships/{scholarshipId}/status",
  LIST_APPLICATIONS: "/scholarship-applications",
  CREATE_APPLICATION: "/scholarship-applications",
  APPROVE_APPLICATION: "/scholarship-applications/{applicationId}/approve",
  REJECT_APPLICATION: "/scholarship-applications/{applicationId}/reject",
  UPDATE_DBT: "/scholarship-applications/{applicationId}/dbt",
  RENEW_APPLICATION: "/scholarship-applications/{applicationId}/renew",
} as const;

export const EMERGENCY_BROADCASTS_API_PATHS = {
  LIST: "/emergency-broadcasts",
  CREATE: "/emergency-broadcasts",
  GET: "/emergency-broadcasts/{broadcastId}",
  UPDATE: "/emergency-broadcasts/{broadcastId}",
  SEND: "/emergency-broadcasts/{broadcastId}/send",
  DELIVERY_LOGS: "/emergency-broadcasts/{broadcastId}/delivery-logs",
  TEMPLATES: "/broadcast-templates",
} as const;

export const PAYROLL_API_PATHS = {
  LIST_SALARY_COMPONENTS: "/payroll/salary-components",
  CREATE_SALARY_COMPONENT: "/payroll/salary-components",
  UPDATE_SALARY_COMPONENT: "/payroll/salary-components/{componentId}",
  UPDATE_SALARY_COMPONENT_STATUS:
    "/payroll/salary-components/{componentId}/status",
  LIST_SALARY_TEMPLATES: "/payroll/templates",
  CREATE_SALARY_TEMPLATE: "/payroll/templates",
  GET_SALARY_TEMPLATE: "/payroll/templates/{templateId}",
  UPDATE_SALARY_TEMPLATE: "/payroll/templates/{templateId}",
  UPDATE_SALARY_TEMPLATE_STATUS: "/payroll/templates/{templateId}/status",
  LIST_SALARY_ASSIGNMENTS: "/payroll/assignments",
  CREATE_SALARY_ASSIGNMENT: "/payroll/assignments",
  GET_SALARY_ASSIGNMENT: "/payroll/assignments/{assignmentId}",
  UPDATE_SALARY_ASSIGNMENT: "/payroll/assignments/{assignmentId}",
  UPDATE_SALARY_ASSIGNMENT_STATUS: "/payroll/assignments/{assignmentId}/status",
  LIST_PAYROLL_RUNS: "/payroll/runs",
  CREATE_PAYROLL_RUN: "/payroll/runs",
  GET_PAYROLL_RUN: "/payroll/runs/{runId}",
  PROCESS_PAYROLL_RUN: "/payroll/runs/{runId}/process",
  APPROVE_PAYROLL_RUN: "/payroll/runs/{runId}/approve",
  MARK_PAID_PAYROLL_RUN: "/payroll/runs/{runId}/mark-paid",
  LIST_PAYSLIPS: "/payroll/runs/{runId}/payslips",
  GET_PAYSLIP: "/payroll/payslips/{payslipId}",
  MONTHLY_SUMMARY: "/payroll/reports/monthly-summary",
  STAFF_HISTORY: "/payroll/reports/staff-history/{staffProfileId}",
} as const;
