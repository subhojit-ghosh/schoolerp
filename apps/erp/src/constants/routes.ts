export const ERP_ROUTES = {
  ROOT: "/",
  DASHBOARD: "/dashboard",
  // People
  STUDENTS: "/students",
  STUDENT_DETAIL: "/students/:studentId",
  STAFF: "/staff",
  STAFF_DETAIL: "/staff/:staffId",
  // Academics
  ACADEMIC_YEARS: "/academic-years",
  CLASSES: "/classes",
  CLASS_DETAIL: "/classes/:classId",
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
  // Finance
  FEES: "/fees",
  // Settings
  SETTINGS_BRANDING: "/settings/branding",
  // Auth
  SIGN_IN: "/sign-in",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const WEB_ROUTES = {
  HOME: "/",
  SIGN_UP: "/sign-up",
} as const;
