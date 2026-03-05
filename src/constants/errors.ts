export const ERROR_MESSAGES = {
  COMMON: {
    UNAUTHORIZED: "You are not authorized to perform this action.",
    VALIDATION_FAILED: "Please review the form and try again.",
    UNEXPECTED: "Something went wrong. Please try again.",
  },
  INSTITUTION: {
    SLUG_ALREADY_EXISTS:
      "This subdomain slug is already in use. Please choose another one.",
  },
} as const;

export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
} as const;
