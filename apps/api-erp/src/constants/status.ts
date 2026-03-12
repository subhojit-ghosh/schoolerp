export const STATUS = {
  ORG: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
  },
  ACADEMIC_YEAR: {
    ACTIVE: "active",
    ARCHIVED: "archived",
  },
} as const;

export type OrgStatus = (typeof STATUS.ORG)[keyof typeof STATUS.ORG];
export type AcademicYearStatus =
  (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];
