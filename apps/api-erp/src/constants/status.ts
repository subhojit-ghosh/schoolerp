import {
  ACADEMIC_YEAR_STATUS,
  ATTENDANCE_STATUSES,
  GUARDIAN_RELATIONSHIPS,
  type AttendanceStatus,
  type GuardianRelationship,
} from "@repo/contracts";

export { GUARDIAN_RELATIONSHIPS };
export const STATUS = {
  ORG: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
  },
  CAMPUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
  },
  MEMBER: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
  },
  ACADEMIC_YEAR: ACADEMIC_YEAR_STATUS,
  ATTENDANCE: ATTENDANCE_STATUSES,
} as const;

export const MEMBER_TYPES = {
  STAFF: "staff",
  STUDENT: "student",
  GUARDIAN: "guardian",
} as const;

export const ROLE_TYPES = {
  PLATFORM: "platform",
  SYSTEM: "system",
  INSTITUTION: "institution",
} as const;

export const ROLE_SLUGS = {
  INSTITUTION_ADMIN: "institution_admin",
} as const;

export const ROLE_NAMES = {
  INSTITUTION_ADMIN: "Institution Admin",
} as const;

export const SCOPE_TYPES = {
  INSTITUTION: "institution",
  CAMPUS: "campus",
  DEPARTMENT: "department",
  CLASS: "class",
  SECTION: "section",
} as const;

export type OrgStatus = (typeof STATUS.ORG)[keyof typeof STATUS.ORG];
export type CampusStatus = (typeof STATUS.CAMPUS)[keyof typeof STATUS.CAMPUS];
export type MemberStatus = (typeof STATUS.MEMBER)[keyof typeof STATUS.MEMBER];
export type MemberType = (typeof MEMBER_TYPES)[keyof typeof MEMBER_TYPES];
export type AcademicYearStatus =
  (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];
export type { GuardianRelationship };
export type AttendanceRecordStatus = AttendanceStatus;
export type { GuardianRelationship };
