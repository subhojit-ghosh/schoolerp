export const PERMISSIONS = {
  FEES: {
    READ: "fees:read",
    WRITE: "fees:write",
    DELETE: "fees:delete",
  },
  ATTENDANCE: {
    READ: "attendance:read",
    WRITE: "attendance:write",
  },
  STUDENTS: {
    READ: "students:read",
    WRITE: "students:write",
    DELETE: "students:delete",
  },
  GRADES: {
    READ: "grades:read",
    WRITE: "grades:write",
  },
  ROLES: {
    MANAGE: "roles:manage",
  },
  MEMBERS: {
    INVITE: "members:invite",
  },
  REPORTS: {
    EXPORT: "reports:export",
  },
  LIBRARY: {
    READ: "library:read",
    WRITE: "library:write",
  },
  ADMISSIONS: {
    READ: "admissions:read",
    WRITE: "admissions:write",
  },
} as const;
