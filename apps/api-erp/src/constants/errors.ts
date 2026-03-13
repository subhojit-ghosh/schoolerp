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
  STAFF: {
    STAFF_NOT_FOUND: "The selected staff record was not found.",
    STAFF_MEMBERSHIP_EXISTS:
      "That user already has a staff membership in this institution.",
  },
  ROLES: {
    ROLE_NOT_FOUND: "The selected role was not found for this institution.",
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
      "At least one academic year must remain current for the institution.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
  CLASSES: {
    CLASS_NOT_FOUND: "The selected class was not found.",
    CLASS_NAME_EXISTS:
      "That class name is already in use for the selected campus.",
    CLASS_CODE_EXISTS: "That class code is already in use for this institution.",
    SECTION_NAME_EXISTS: "Section names must be unique within a class.",
  },
  ATTENDANCE: {
    CLASS_SECTION_REQUIRED: "Class and section are required for attendance.",
    NO_STUDENTS_FOUND:
      "No students were found for the selected campus, class, and section.",
    ROSTER_MISMATCH:
      "Attendance must be submitted for the full class roster returned by the API.",
  },
  EXAMS: {
    TERM_NOT_FOUND: "The selected exam term was not found.",
    ACADEMIC_YEAR_REQUIRED:
      "The selected academic year was not found for this institution.",
    INVALID_TERM_DATE_RANGE: "Exam term end date must be after the start date.",
    INVALID_MARK_RANGE:
      "Obtained marks must be between zero and the maximum marks.",
    DUPLICATE_MARK_ENTRY:
      "Each student can only have one mark entry per subject in the same exam term.",
    STUDENT_REQUIRED:
      "Every marks entry must belong to a student in the selected institution.",
  },
} as const;
