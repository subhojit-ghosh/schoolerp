export const ERROR_MESSAGES = {
  TENANT: {
    SUBDOMAIN_REQUIRED:
      "A tenant subdomain is required for this institution-scoped API.",
    INSTITUTION_NOT_FOUND: "Institution not found for the current subdomain.",
  },
  AUTH: {
    INVALID_CREDENTIALS: "Invalid mobile number, email, or password.",
    SESSION_REQUIRED: "You must be signed in to access this resource.",
    MOBILE_ALREADY_EXISTS: "An account already exists for this mobile number.",
    EMAIL_ALREADY_EXISTS: "An account already exists for this email address.",
    MEMBERSHIP_REQUIRED: "You do not have access to the selected institution.",
    CONTEXT_ACCESS_REQUIRED:
      "You do not have access to the selected context for this institution.",
    CAMPUS_ACCESS_REQUIRED: "You do not have access to the selected campus.",
    PERMISSION_DENIED: "You do not have permission to perform this action.",
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
    CLASS_CAMPUS_MISMATCH:
      "The selected class does not belong to the selected campus.",
  },
  STAFF: {
    STAFF_NOT_FOUND: "The selected staff record was not found.",
    STAFF_MEMBERSHIP_EXISTS:
      "That user already has a staff membership in this institution.",
    STAFF_HAS_ATTENDANCE_RECORDS:
      "Cannot delete a staff record that has already marked attendance. Keep the record inactive instead.",
    ROLE_ASSIGNMENT_NOT_FOUND:
      "The selected staff role assignment was not found.",
    ROLE_ASSIGNMENT_SCOPE_INVALID:
      "Select scopes in order: campus, then class, then section.",
    ROLE_ASSIGNMENT_SCOPE_MISMATCH:
      "The selected scope combination does not belong to the same campus, class, and section.",
    ROLE_ASSIGNMENT_SCOPE_FORBIDDEN:
      "You cannot assign a role scope outside your own visible campus, class, or section access.",
    ROLE_ASSIGNMENT_EXISTS:
      "That staff role assignment already exists for this staff member.",
  },
  ROLES: {
    ROLE_NOT_FOUND: "The selected role was not found for this institution.",
  },
  GUARDIANS: {
    GUARDIAN_NOT_FOUND: "The selected guardian was not found.",
    STUDENT_LINK_NOT_FOUND:
      "The selected guardian-student relationship was not found.",
    LAST_GUARDIAN_LINK: "A student must keep at least one linked guardian.",
  },
  ACADEMIC_YEARS: {
    INVALID_DATE_RANGE: "End date must be after the start date.",
    CURRENT_YEAR_REQUIRED:
      "At least one academic year must remain current for the institution.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
  CLASSES: {
    CLASS_NOT_FOUND: "The selected class was not found.",
    SECTION_NOT_FOUND: "The selected section was not found for this class.",
    CLASS_NAME_EXISTS:
      "That class name is already in use for the selected campus.",
    SECTION_NAME_EXISTS: "Section names must be unique within a class.",
    CLASS_HAS_STUDENTS:
      "Cannot delete a class that has enrolled students. Remove or reassign the students first.",
    CLASS_HAS_CURRENT_ENROLLMENTS:
      "Cannot delete a class that is still used by current enrollments. Update those enrollments first.",
    SECTION_HAS_STUDENTS:
      "Cannot remove a section that has enrolled students. Reassign the students first.",
    SECTION_HAS_CURRENT_ENROLLMENTS:
      "Cannot remove a section that is still used by current enrollments. Update those enrollments first.",
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
  FEES: {
    ACADEMIC_YEAR_NOT_FOUND: "The selected academic year was not found.",
    ACADEMIC_YEAR_ARCHIVED:
      "Fee structures can only be created for active academic years.",
    FEE_STRUCTURE_NOT_FOUND: "The selected fee structure was not found.",
    FEE_STRUCTURE_INACTIVE:
      "Only active fee structures can be assigned to students.",
    FEE_STRUCTURE_NAME_EXISTS:
      "That fee structure already exists for the selected scope.",
    FEE_ASSIGNMENT_NOT_FOUND: "The selected fee assignment was not found.",
    FEE_PAYMENT_NOT_FOUND: "The selected fee payment was not found.",
    FEE_ADJUSTMENT_NOT_FOUND: "The selected fee adjustment was not found.",
    FEE_PAYMENT_REVERSAL_NOT_FOUND:
      "The selected fee payment reversal was not found.",
    FEE_ASSIGNMENT_EXISTS:
      "That student already has an assignment for this installment.",
    FEE_STRUCTURE_AMOUNT_INVALID: "Fee amount must be greater than zero.",
    FEE_ASSIGNMENT_AMOUNT_INVALID: "Assigned amount must be greater than zero.",
    FEE_ADJUSTMENT_AMOUNT_INVALID:
      "Adjustment amount must be greater than zero.",
    FEE_PAYMENT_AMOUNT_INVALID: "Payment amount must be greater than zero.",
    FEE_PAYMENT_EXCEEDS_DUE:
      "Payment amount cannot exceed the outstanding dues for this assignment.",
    FEE_ADJUSTMENT_EXCEEDS_DUE:
      "Adjustment amount cannot exceed the outstanding dues for this assignment.",
    FEE_PAYMENT_ALREADY_REVERSED:
      "That payment has already been reversed.",
    FEE_STRUCTURE_SCOPE_INVALID:
      "Campus-scoped fee structures must target a campus.",
    FEE_STRUCTURE_CAMPUS_MISMATCH:
      "Student campus must match the selected campus-scoped fee structure.",
    FEE_STRUCTURE_HAS_ASSIGNMENTS:
      "Cannot delete a fee structure that has assignments.",
    FEE_ASSIGNMENT_HAS_PAYMENTS:
      "Cannot delete a fee assignment that already has recorded payments.",
    FEE_ASSIGNMENT_HAS_ADJUSTMENTS:
      "Cannot delete a fee assignment that already has recorded adjustments.",
    FEE_ASSIGNMENT_AMOUNT_LOCKED:
      "Assigned amount cannot be changed after a payment has been recorded.",
    FEE_INSTALLMENT_NOT_FOUND: "The selected fee installment was not found.",
    FEE_INSTALLMENTS_REQUIRED:
      "At least one installment is required for a fee structure.",
    FEE_INSTALLMENTS_LOCKED:
      "Installments cannot be modified after assignments exist, including historical records.",
  },
} as const;
