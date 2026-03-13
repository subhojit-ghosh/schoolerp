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
  CREATE: "/students",
  DETAIL: "/students/{studentId}",
  UPDATE: "/students/{studentId}",
} as const;

export const STAFF_API_PATHS = {
  LIST: "/staff",
  CREATE: "/staff",
  DETAIL: "/staff/{staffId}",
  UPDATE: "/staff/{staffId}",
  ROLES: "/staff/roles",
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

export const ATTENDANCE_API_PATHS = {
  CLASS_SECTIONS: "/attendance/class-sections",
  DAY: "/attendance/day",
  DAY_VIEW: "/attendance/day-view",
} as const;

export const EXAMS_API_PATHS = {
  LIST_TERMS: "/exams/terms",
  CREATE_TERM: "/exams/terms",
  LIST_MARKS: "/exams/terms/{examTermId}/marks",
  REPLACE_MARKS: "/exams/terms/{examTermId}/marks",
} as const;

export const INSTITUTIONS_API_PATHS = {
  UPDATE_BRANDING: "/institutions/current/branding",
} as const;

export const FEES_API_PATHS = {
  LIST_STRUCTURES: "/fees/structures",
  CREATE_STRUCTURE: "/fees/structures",
  LIST_ASSIGNMENTS: "/fees/assignments",
  CREATE_ASSIGNMENT: "/fees/assignments",
  CREATE_PAYMENT: "/fees/payments",
  LIST_DUES: "/fees/dues",
} as const;
