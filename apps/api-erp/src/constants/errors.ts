export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid mobile number, email, or password.",
    SESSION_REQUIRED: "You must be signed in to access this resource.",
    MOBILE_ALREADY_EXISTS: "An account already exists for this mobile number.",
    EMAIL_ALREADY_EXISTS: "An account already exists for this email address.",
  },
  ACADEMIC_YEARS: {
    INVALID_DATE_RANGE: "End date must be after the start date.",
    CURRENT_YEAR_REQUIRED:
      "Select another academic year as current before archiving this one.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
} as const;
