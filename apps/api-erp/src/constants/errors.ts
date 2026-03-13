export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid mobile number, email, or password.",
    SESSION_REQUIRED: "You must be signed in to access this resource.",
    MOBILE_ALREADY_EXISTS: "An account already exists for this mobile number.",
    EMAIL_ALREADY_EXISTS: "An account already exists for this email address.",
    MEMBERSHIP_REQUIRED: "You do not have access to the selected institution.",
    CONTEXT_ACCESS_REQUIRED:
      "You do not have access to the selected context for this institution.",
    CAMPUS_ACCESS_REQUIRED: "You do not have access to the selected campus.",
    PASSWORD_RESET_REQUEST_BLOCKED:
      "Too many password reset attempts. Try again later.",
    PASSWORD_RESET_TOKEN_INVALID: "The password reset link is invalid.",
    PASSWORD_RESET_TOKEN_EXPIRED: "The password reset link has expired.",
  },
  ONBOARDING: {
    ORGANIZATION_SLUG_EXISTS: "That institution slug is already in use.",
    CAMPUS_SLUG_EXISTS:
      "That campus slug is already in use for this institution.",
  },
  CAMPUSES: {
    CAMPUS_NOT_FOUND: "The selected campus was not found.",
  },
  STUDENTS: {
    STUDENT_NOT_FOUND: "The selected student was not found.",
    ADMISSION_NUMBER_EXISTS:
      "That admission number is already in use for this institution.",
    GUARDIAN_MEMBERSHIP_REQUIRED:
      "Each guardian must belong to the selected institution.",
  },
  GUARDIANS: {
    GUARDIAN_NOT_FOUND: "The selected guardian was not found.",
    STUDENT_LINK_NOT_FOUND:
      "The selected guardian-student relationship was not found.",
    LAST_GUARDIAN_LINK:
      "A student must keep at least one linked guardian.",
  },
  ACADEMIC_YEARS: {
    INVALID_DATE_RANGE: "End date must be after the start date.",
    CURRENT_YEAR_REQUIRED:
      "Select another academic year as current before archiving this one.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
} as const;
