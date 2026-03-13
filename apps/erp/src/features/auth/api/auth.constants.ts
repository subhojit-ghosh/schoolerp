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
  LIST: "/institutions/{institutionId}/students",
  CREATE: "/institutions/{institutionId}/students",
  DETAIL: "/institutions/{institutionId}/students/{studentId}",
  UPDATE: "/institutions/{institutionId}/students/{studentId}",
} as const;

export const GUARDIANS_API_PATHS = {
  LIST: "/institutions/{institutionId}/guardians",
  DETAIL: "/institutions/{institutionId}/guardians/{guardianId}",
  UPDATE: "/institutions/{institutionId}/guardians/{guardianId}",
  LINK_STUDENT:
    "/institutions/{institutionId}/guardians/{guardianId}/students",
  UPDATE_STUDENT_LINK:
    "/institutions/{institutionId}/guardians/{guardianId}/students/{studentId}",
  UNLINK_STUDENT:
    "/institutions/{institutionId}/guardians/{guardianId}/students/{studentId}",
} as const;

export const ACADEMIC_YEARS_API_PATHS = {
  LIST: "/institutions/{institutionId}/academic-years",
  CREATE: "/institutions/{institutionId}/academic-years",
  SET_CURRENT:
    "/institutions/{institutionId}/academic-years/{academicYearId}/current",
  ARCHIVE:
    "/institutions/{institutionId}/academic-years/{academicYearId}/archive",
  RESTORE:
    "/institutions/{institutionId}/academic-years/{academicYearId}/restore",
} as const;

export const INSTITUTIONS_API_PATHS = {
  UPDATE_BRANDING: "/institutions/{id}/branding",
} as const;
