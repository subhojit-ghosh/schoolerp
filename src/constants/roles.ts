export const ROLES = {
  SUPER_ADMIN: "super_admin",
  INSTITUTION_ADMIN: "institution_admin",
  PRINCIPAL: "principal",
  TEACHER: "teacher",
  ACCOUNTANT: "accountant",
  LIBRARIAN: "librarian",
  RECEPTIONIST: "receptionist",
  STUDENT: "student",
  PARENT: "parent",
} as const;

export const ROLE_TYPES = {
  PLATFORM: "platform",
  SYSTEM: "system",
  STAFF: "staff",
} as const;
