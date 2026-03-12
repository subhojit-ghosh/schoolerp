export const ERP_ROUTES = {
  ROOT: "/",
  DASHBOARD: "/dashboard",
  // People
  STUDENTS: "/students",
  STAFF: "/staff",
  // Academics
  CLASSES: "/classes",
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
  // Finance
  FEES: "/fees",
  // Auth
  SIGN_IN: "/sign-in",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const WEB_ROUTES = {
  HOME: "/",
  SIGN_UP: "/sign-up",
} as const;
