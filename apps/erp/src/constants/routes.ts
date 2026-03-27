export const ERP_ROUTE_SEGMENTS = {
  NEW: "new",
  EDIT: "edit",
  BULK: "bulk",
  COLLECT: "collect",
  ADJUSTMENT: "adjustment",
  RECEIPT: "receipt",
  ACKNOWLEDGEMENT: "acknowledgement",
  REPORT_CARD: "report-card",
  TRANSFER_CERTIFICATE: "transfer-certificate",
  BONAFIDE_CERTIFICATE: "bonafide-certificate",
  CHARACTER_CERTIFICATE: "character-certificate",
  STOPS: "stops",
} as const;

export const ERP_ROUTES = {
  ROOT: "/",
  SETUP: "/setup",
  DASHBOARD: "/dashboard",
  ACCOUNT: "/account",
  NOTIFICATIONS: "/notifications",
  // Admissions
  ADMISSIONS_ENQUIRIES: "/admissions/enquiries",
  ADMISSIONS_ENQUIRY_CREATE: `/admissions/enquiries/${ERP_ROUTE_SEGMENTS.NEW}`,
  ADMISSIONS_ENQUIRY_EDIT: `/admissions/enquiries/:enquiryId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  ADMISSIONS_APPLICATIONS: "/admissions/applications",
  ADMISSIONS_APPLICATION_CREATE: `/admissions/applications/${ERP_ROUTE_SEGMENTS.NEW}`,
  ADMISSIONS_APPLICATION_EDIT: `/admissions/applications/:applicationId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  ADMISSIONS_APPLICATION_ACKNOWLEDGEMENT: `/admissions/applications/:applicationId/${ERP_ROUTE_SEGMENTS.ACKNOWLEDGEMENT}`,
  // People
  STUDENTS: "/students",
  STUDENT_CREATE: `/students/${ERP_ROUTE_SEGMENTS.NEW}`,
  STUDENT_DETAIL: "/students/:studentId",
  STUDENT_TRANSFER_CERTIFICATE: `/students/:studentId/${ERP_ROUTE_SEGMENTS.TRANSFER_CERTIFICATE}`,
  STUDENT_BONAFIDE_CERTIFICATE: `/students/:studentId/${ERP_ROUTE_SEGMENTS.BONAFIDE_CERTIFICATE}`,
  STUDENT_CHARACTER_CERTIFICATE: `/students/:studentId/${ERP_ROUTE_SEGMENTS.CHARACTER_CERTIFICATE}`,
  STUDENT_ROLLOVER: "/student-rollover",
  GUARDIANS: "/guardians",
  GUARDIAN_DETAIL: "/guardians/:guardianId",
  STAFF: "/staff",
  STAFF_CREATE: `/staff/${ERP_ROUTE_SEGMENTS.NEW}`,
  STAFF_DETAIL: "/staff/:staffId",
  // Academics
  ACADEMIC_YEARS: "/academic-years",
  ACADEMIC_YEAR_CREATE: `/academic-years/${ERP_ROUTE_SEGMENTS.NEW}`,
  ACADEMIC_YEAR_EDIT: `/academic-years/:academicYearId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  CLASSES: "/classes",
  CLASS_CREATE: `/classes/${ERP_ROUTE_SEGMENTS.NEW}`,
  CLASS_EDIT: `/classes/:classId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  SUBJECTS: "/subjects",
  SUBJECT_CREATE: `/subjects/${ERP_ROUTE_SEGMENTS.NEW}`,
  SUBJECT_EDIT: `/subjects/:subjectId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  BELL_SCHEDULES: "/bell-schedules",
  BELL_SCHEDULE_CREATE: `/bell-schedules/${ERP_ROUTE_SEGMENTS.NEW}`,
  BELL_SCHEDULE_EDIT: `/bell-schedules/:scheduleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  TIMETABLE: "/timetable",
  TIMETABLE_TEACHER: "/timetable/teacher",
  CALENDAR: "/calendar",
  CALENDAR_EVENT_CREATE: `/calendar/${ERP_ROUTE_SEGMENTS.NEW}`,
  CALENDAR_EVENT_EDIT: `/calendar/:eventId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
  EXAM_REPORT_CARD: `/exams/${ERP_ROUTE_SEGMENTS.REPORT_CARD}`,
  HOMEWORK: "/homework",
  HOMEWORK_CREATE: `/homework/${ERP_ROUTE_SEGMENTS.NEW}`,
  HOMEWORK_EDIT: `/homework/:homeworkId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  LEAVE_TYPES: "/leave/types",
  LEAVE_TYPES_CREATE: `/leave/types/${ERP_ROUTE_SEGMENTS.NEW}`,
  LEAVE_TYPES_EDIT: `/leave/types/:leaveTypeId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  LEAVE_APPLICATIONS: "/leave/applications",
  LEAVE_APPLICATIONS_CREATE: `/leave/applications/${ERP_ROUTE_SEGMENTS.NEW}`,
  DISCIPLINE: "/discipline",
  // Finance
  FEES: "/fees",
  FEE_STRUCTURES: "/fees/structures",
  FEE_STRUCTURE_CREATE: `/fees/structures/new`,
  FEE_STRUCTURE_EDIT: `/fees/structures/:feeStructureId/edit`,
  FEE_ASSIGNMENTS: "/fees/assignments",
  FEE_ASSIGNMENT_CREATE: `/fees/assignments/${ERP_ROUTE_SEGMENTS.NEW}`,
  FEE_ASSIGNMENT_BULK: `/fees/assignments/${ERP_ROUTE_SEGMENTS.BULK}`,
  FEE_ASSIGNMENT_EDIT: `/fees/assignments/:feeAssignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  FEE_ASSIGNMENT_COLLECT: `/fees/assignments/:feeAssignmentId/${ERP_ROUTE_SEGMENTS.COLLECT}`,
  FEE_ASSIGNMENT_ADJUSTMENT: `/fees/assignments/:feeAssignmentId/${ERP_ROUTE_SEGMENTS.ADJUSTMENT}`,
  FEE_ASSIGNMENT_RECEIPT: `/fees/assignments/:feeAssignmentId/${ERP_ROUTE_SEGMENTS.RECEIPT}`,
  FEE_DUES: "/fees/dues",
  FEE_REPORTS: "/fees/reports",
  FEE_LEDGER: "/fees/ledger",
  // Communication
  MESSAGES: "/messages",
  ANNOUNCEMENTS: "/announcements",
  ANNOUNCEMENT_CREATE: `/announcements/${ERP_ROUTE_SEGMENTS.NEW}`,
  ANNOUNCEMENT_EDIT: `/announcements/:announcementId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  // Reports
  REPORTS_ATTENDANCE: "/reports/attendance",
  REPORTS_EXAMS: "/reports/exams",
  REPORTS_FEES: "/reports/fees",
  REPORTS_ADMISSIONS: "/reports/admissions",
  REPORTS_STUDENTS: "/reports/students",
  // Library
  LIBRARY: "/library",
  LIBRARY_BOOKS: "/library/books",
  LIBRARY_BOOKS_CREATE: `/library/books/${ERP_ROUTE_SEGMENTS.NEW}`,
  LIBRARY_BOOKS_EDIT: `/library/books/:bookId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  LIBRARY_TRANSACTIONS: "/library/transactions",
  LIBRARY_TRANSACTIONS_ISSUE: `/library/transactions/${ERP_ROUTE_SEGMENTS.NEW}`,
  TRANSPORT: "/transport",
  TRANSPORT_ROUTES: "/transport/routes",
  TRANSPORT_ROUTES_CREATE: `/transport/routes/${ERP_ROUTE_SEGMENTS.NEW}`,
  TRANSPORT_ROUTES_EDIT: `/transport/routes/:routeId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  TRANSPORT_ROUTE_DETAIL: "/transport/routes/:routeId",
  TRANSPORT_ROUTE_STOP_CREATE: `/transport/routes/:routeId/${ERP_ROUTE_SEGMENTS.STOPS}/${ERP_ROUTE_SEGMENTS.NEW}`,
  TRANSPORT_ROUTE_STOP_EDIT: `/transport/routes/:routeId/${ERP_ROUTE_SEGMENTS.STOPS}/:stopId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  TRANSPORT_VEHICLES: "/transport/vehicles",
  TRANSPORT_VEHICLES_CREATE: `/transport/vehicles/${ERP_ROUTE_SEGMENTS.NEW}`,
  TRANSPORT_VEHICLES_EDIT: `/transport/vehicles/:vehicleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  TRANSPORT_ASSIGNMENTS: "/transport/assignments",
  TRANSPORT_ASSIGNMENTS_CREATE: `/transport/assignments/${ERP_ROUTE_SEGMENTS.NEW}`,
  TRANSPORT_ASSIGNMENTS_EDIT: `/transport/assignments/:assignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  STAFF_LEAVE: "/staff/leave",
  STAFF_ATTENDANCE: "/staff/attendance",
  INVENTORY: "/inventory",
  PAYROLL: "/payroll",
  PAYROLL_SALARY_COMPONENTS: "/payroll/salary-components",
  PAYROLL_SALARY_COMPONENT_CREATE: `/payroll/salary-components/${ERP_ROUTE_SEGMENTS.NEW}`,
  PAYROLL_SALARY_COMPONENT_EDIT: `/payroll/salary-components/:componentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  PAYROLL_SALARY_TEMPLATES: "/payroll/salary-templates",
  PAYROLL_SALARY_TEMPLATE_CREATE: `/payroll/salary-templates/${ERP_ROUTE_SEGMENTS.NEW}`,
  PAYROLL_SALARY_TEMPLATE_EDIT: `/payroll/salary-templates/:templateId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  PAYROLL_SALARY_TEMPLATE_DETAIL: "/payroll/salary-templates/:templateId",
  PAYROLL_SALARY_ASSIGNMENTS: "/payroll/salary-assignments",
  PAYROLL_SALARY_ASSIGNMENT_CREATE: `/payroll/salary-assignments/${ERP_ROUTE_SEGMENTS.NEW}`,
  PAYROLL_SALARY_ASSIGNMENT_EDIT: `/payroll/salary-assignments/:assignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  PAYROLL_RUNS: "/payroll/runs",
  PAYROLL_RUN_CREATE: `/payroll/runs/${ERP_ROUTE_SEGMENTS.NEW}`,
  PAYROLL_RUN_DETAIL: "/payroll/runs/:runId",
  PAYROLL_PAYSLIP_DETAIL: "/payroll/payslips/:payslipId",
  PAYROLL_PAYSLIP_PRINT: "/payroll/payslips/:payslipId/print",
  PAYROLL_REPORTS: "/payroll/reports",
  HOSTEL: "/hostel",
  DOCUMENTS: "/documents",
  CERTIFICATES: "/certificates",
  // Parent portal
  FAMILY_CHILDREN: "/family/children",
  FAMILY_ATTENDANCE: "/family/attendance",
  FAMILY_TIMETABLE: "/family/timetable",
  FAMILY_HOMEWORK: "/family/homework",
  FAMILY_EXAMS: "/family/exams",
  FAMILY_FEES: "/family/fees",
  FAMILY_DOCUMENTS: "/family/documents",
  FAMILY_ANNOUNCEMENTS: "/family/announcements",
  FAMILY_MESSAGES: "/family/messages",
  FAMILY_CALENDAR: "/family/calendar",
  FAMILY_TRANSPORT: "/family/transport",
  FAMILY_LIBRARY: "/family/library",
  // Student portal
  STUDENT_TIMETABLE: "/me/timetable",
  STUDENT_ATTENDANCE: "/me/attendance",
  STUDENT_HOMEWORK: "/me/homework",
  STUDENT_EXAMS: "/me/exams",
  STUDENT_RESULTS: "/me/results",
  STUDENT_CALENDAR: "/me/calendar",
  STUDENT_ANNOUNCEMENTS: "/me/announcements",
  STUDENT_MESSAGES: "/me/messages",
  STUDENT_LIBRARY: "/me/library",
  STUDENT_TRANSPORT: "/me/transport",
  STUDENT_HOSTEL: "/me/hostel",
  // Settings
  SETTINGS_CAMPUSES: "/settings/campuses",
  SETTINGS_CAMPUSES_CREATE: `/settings/campuses/${ERP_ROUTE_SEGMENTS.NEW}`,
  SETTINGS_BRANDING: "/settings/branding",
  SETTINGS_ADMISSION_FIELDS: "/settings/admission-fields",
  SETTINGS_ROLES: "/settings/roles",
  SETTINGS_AUDIT: "/settings/audit",
  SETTINGS_DELIVERY: "/settings/delivery",
  SETTINGS_PAYMENT: "/settings/payment",
  SETTINGS_ROLES_CREATE: `/settings/roles/${ERP_ROUTE_SEGMENTS.NEW}`,
  SETTINGS_ROLES_EDIT: `/settings/roles/:roleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
  // Auth
  SIGN_IN: "/sign-in",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const WEB_ROUTES = {
  HOME: "/",
  SIGN_UP: "/sign-up",
} as const;

export function buildClassEditRoute(classId: string) {
  return `${ERP_ROUTES.CLASSES}/${classId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildAcademicYearEditRoute(academicYearId: string) {
  return `${ERP_ROUTES.ACADEMIC_YEARS}/${academicYearId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildStudentDetailRoute(studentId: string) {
  return `${ERP_ROUTES.STUDENTS}/${studentId}`;
}

export function buildAdmissionEnquiryEditRoute(enquiryId: string) {
  return `${ERP_ROUTES.ADMISSIONS_ENQUIRIES}/${enquiryId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildAdmissionApplicationEditRoute(applicationId: string) {
  return `${ERP_ROUTES.ADMISSIONS_APPLICATIONS}/${applicationId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildAdmissionApplicationAcknowledgementRoute(
  applicationId: string,
) {
  return `${ERP_ROUTES.ADMISSIONS_APPLICATIONS}/${applicationId}/${ERP_ROUTE_SEGMENTS.ACKNOWLEDGEMENT}`;
}

export function buildGuardianDetailRoute(guardianId: string) {
  return `${ERP_ROUTES.GUARDIANS}/${guardianId}`;
}

export function buildStaffDetailRoute(staffId: string) {
  return `${ERP_ROUTES.STAFF}/${staffId}`;
}

export function buildRoleEditRoute(roleId: string) {
  return `/settings/roles/${roleId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildFeeStructureEditRoute(feeStructureId: string) {
  return `/fees/structures/${feeStructureId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildFeeAssignmentEditRoute(feeAssignmentId: string) {
  return `/fees/assignments/${feeAssignmentId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildFeeAssignmentCollectRoute(feeAssignmentId: string) {
  return `/fees/assignments/${feeAssignmentId}/${ERP_ROUTE_SEGMENTS.COLLECT}`;
}

export function buildFeeAssignmentAdjustmentRoute(feeAssignmentId: string) {
  return `/fees/assignments/${feeAssignmentId}/${ERP_ROUTE_SEGMENTS.ADJUSTMENT}`;
}

export function buildFeeAssignmentReceiptRoute(feeAssignmentId: string) {
  return `/fees/assignments/${feeAssignmentId}/${ERP_ROUTE_SEGMENTS.RECEIPT}`;
}

export function buildSubjectEditRoute(subjectId: string) {
  return `${ERP_ROUTES.SUBJECTS}/${subjectId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildCalendarEventEditRoute(eventId: string) {
  return `${ERP_ROUTES.CALENDAR}/${eventId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildAnnouncementEditRoute(announcementId: string) {
  return `${ERP_ROUTES.ANNOUNCEMENTS}/${announcementId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildHomeworkEditRoute(homeworkId: string) {
  return `${ERP_ROUTES.HOMEWORK}/${homeworkId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildLibraryBookEditRoute(bookId: string) {
  return `/library/books/${bookId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildStudentTransferCertificateRoute(studentId: string) {
  return `/students/${studentId}/${ERP_ROUTE_SEGMENTS.TRANSFER_CERTIFICATE}`;
}

export function buildStudentBonafideCertificateRoute(studentId: string) {
  return `/students/${studentId}/${ERP_ROUTE_SEGMENTS.BONAFIDE_CERTIFICATE}`;
}

export function buildStudentCharacterCertificateRoute(studentId: string) {
  return `/students/${studentId}/${ERP_ROUTE_SEGMENTS.CHARACTER_CERTIFICATE}`;
}

export function buildTransportRouteDetailRoute(routeId: string) {
  return `/transport/routes/${routeId}`;
}

export function buildTransportRouteEditRoute(routeId: string) {
  return `/transport/routes/${routeId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildTransportRouteStopCreateRoute(routeId: string) {
  return `/transport/routes/${routeId}/${ERP_ROUTE_SEGMENTS.STOPS}/${ERP_ROUTE_SEGMENTS.NEW}`;
}

export function buildTransportRouteStopEditRoute(routeId: string, stopId: string) {
  return `/transport/routes/${routeId}/${ERP_ROUTE_SEGMENTS.STOPS}/${stopId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildTransportVehicleEditRoute(vehicleId: string) {
  return `/transport/vehicles/${vehicleId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildTransportAssignmentEditRoute(assignmentId: string) {
  return `/transport/assignments/${assignmentId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildSalaryComponentEditRoute(componentId: string) {
  return `/payroll/salary-components/${componentId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildSalaryTemplateDetailRoute(templateId: string) {
  return `/payroll/salary-templates/${templateId}`;
}

export function buildSalaryTemplateEditRoute(templateId: string) {
  return `/payroll/salary-templates/${templateId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildSalaryAssignmentEditRoute(assignmentId: string) {
  return `/payroll/salary-assignments/${assignmentId}/${ERP_ROUTE_SEGMENTS.EDIT}`;
}

export function buildPayrollRunDetailRoute(runId: string) {
  return `/payroll/runs/${runId}`;
}

export function buildPayslipDetailRoute(payslipId: string) {
  return `/payroll/payslips/${payslipId}`;
}

export function buildPayslipPrintRoute(payslipId: string) {
  return `/payroll/payslips/${payslipId}/print`;
}
