export const ERROR_MESSAGES = {
  COMMON: {
    UNAUTHORIZED: "You are not authorized to perform this action.",
    VALIDATION_FAILED: "Please review the form and try again.",
    UNEXPECTED: "Something went wrong. Please try again.",
  },
  INSTITUTION: {
    SLUG_ALREADY_EXISTS:
      "This subdomain slug is already in use. Please choose another one.",
    ADMIN_CREATION_FAILED: "Failed to create admin user for this institution.",
  },
  MEMBERS: {
    EMAIL_ALREADY_EXISTS:
      "This user is already an active member of this institution.",
    ROLE_NOT_FOUND: "Select a valid role for this member.",
    CANNOT_MODIFY_SELF: "You cannot change your own membership from this screen.",
    LAST_ADMIN_REQUIRED:
      "This institution must keep at least one active institution admin.",
  },
  ACADEMIC_YEARS: {
    INVALID_DATE_RANGE: "End date must be after the start date.",
    CURRENT_YEAR_REQUIRED:
      "Select another academic year as current before archiving this one.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
  ROLES: {
    PERMISSION_REQUIRED: "Select at least one permission for this role.",
    ROLE_NAME_EXISTS: "A role with this name already exists in this institution.",
    ROLE_NOT_FOUND: "The selected role was not found.",
    BUILT_IN_ROLE_READ_ONLY:
      "Built-in roles are read-only. Create a custom role to customize permissions.",
    ROLE_IN_USE:
      "Reassign members using this role before archiving it.",
  },
} as const;

export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
} as const;
