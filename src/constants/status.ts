export const STATUS = {
  ORG: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
  },
  MEMBER: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
  },
  INVITATION: {
    PENDING: "pending",
  },
  ACADEMIC_YEAR: {
    ACTIVE: "active",
    ARCHIVED: "archived",
  },
} as const;

export type OrgStatus = (typeof STATUS.ORG)[keyof typeof STATUS.ORG];
