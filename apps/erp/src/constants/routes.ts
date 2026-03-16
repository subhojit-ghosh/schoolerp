export const ERP_ROUTE_SEGMENTS = {
  NEW: "new",
  EDIT: "edit",
  BULK: "bulk",
  COLLECT: "collect",
  ADJUSTMENT: "adjustment",
} as const;

export const ERP_ROUTES = {
  ROOT: "/",
  DASHBOARD: "/dashboard",
  NOTIFICATIONS: "/notifications",
  // Admissions
  ADMISSIONS_ENQUIRIES: "/admissions/enquiries",
  ADMISSIONS_APPLICATIONS: "/admissions/applications",
  // People
  STUDENTS: "/students",
  STUDENT_CREATE: `/students/${ERP_ROUTE_SEGMENTS.NEW}`,
  STUDENT_DETAIL: "/students/:studentId",
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
  TIMETABLE: "/timetable",
  CALENDAR: "/calendar",
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
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
  FEE_DUES: "/fees/dues",
  FEE_REPORTS: "/fees/reports",
  // Communication
  ANNOUNCEMENTS: "/announcements",
  // Reports
  REPORTS_ATTENDANCE: "/reports/attendance",
  REPORTS_EXAMS: "/reports/exams",
  REPORTS_FEES: "/reports/fees",
  // Settings
  SETTINGS_CAMPUSES: "/settings/campuses",
  SETTINGS_CAMPUSES_CREATE: `/settings/campuses/${ERP_ROUTE_SEGMENTS.NEW}`,
  SETTINGS_BRANDING: "/settings/branding",
  SETTINGS_ROLES: "/settings/roles",
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
