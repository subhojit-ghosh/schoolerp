import {
  ACADEMIC_YEAR_STATUS,
  ADMISSION_APPLICATION_STATUSES,
  ADMISSION_ENQUIRY_STATUSES,
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUS,
  ATTENDANCE_STATUSES,
  BELL_SCHEDULE_PERIOD_STATUS,
  BELL_SCHEDULE_STATUS,
  CALENDAR_EVENT_STATUS,
  CLASS_STATUS,
  COMMUNICATION_PREFERENCES,
  FEE_STRUCTURE_STATUSES,
  GRADING_SCALE_STATUS,
  GUARDIAN_RELATIONSHIPS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  ROLE_NAMES,
  ROLE_SLUGS,
  ROLE_TYPES,
  SCOPE_TYPES,
  SECTION_STATUS,
  SUBJECT_STATUS,
  TIMETABLE_ASSIGNMENT_STATUS,
  TIMETABLE_ENTRY_STATUS,
  TIMETABLE_VERSION_STATUS,
  type AttendanceStatus,
  type CalendarEventStatus,
  type ClassStatus,
  type CommunicationPreference,
  type GuardianRelationship,
  type SectionStatus,
  type SubjectStatus,
  type TimetableAssignmentStatus,
  type TimetableEntryStatus,
  type TimetableVersionStatus,
} from "@repo/contracts";

export {
  COMMUNICATION_PREFERENCES,
  GUARDIAN_RELATIONSHIPS,
  ROLE_NAMES,
  ROLE_SLUGS,
  ROLE_TYPES,
  SCOPE_TYPES,
};
export const STATUS = {
  ORG: {
    ACTIVE: "active",
    DELETED: "deleted",
    SUSPENDED: "suspended",
  },
  CAMPUS: {
    ACTIVE: "active",
    DELETED: "deleted",
    INACTIVE: "inactive",
  },
  MEMBER: {
    ACTIVE: "active",
    DELETED: "deleted",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
  },
  ACADEMIC_YEAR: ACADEMIC_YEAR_STATUS,
  CLASS: CLASS_STATUS,
  SUBJECT: SUBJECT_STATUS,
  BELL_SCHEDULE: BELL_SCHEDULE_STATUS,
  BELL_SCHEDULE_PERIOD: BELL_SCHEDULE_PERIOD_STATUS,
  TIMETABLE_VERSION: TIMETABLE_VERSION_STATUS,
  TIMETABLE_ASSIGNMENT: TIMETABLE_ASSIGNMENT_STATUS,
  TIMETABLE: TIMETABLE_ENTRY_STATUS,
  CALENDAR_EVENT: CALENDAR_EVENT_STATUS,
  FEE_STRUCTURE: FEE_STRUCTURE_STATUSES,
  SECTION: SECTION_STATUS,
  ATTENDANCE: ATTENDANCE_STATUSES,
  ADMISSION_ENQUIRY: ADMISSION_ENQUIRY_STATUSES,
  ADMISSION_APPLICATION: ADMISSION_APPLICATION_STATUSES,
  ANNOUNCEMENT: ANNOUNCEMENT_STATUS,
  GRADING_SCALE: GRADING_SCALE_STATUS,
} as const;

export const MEMBER_TYPES = {
  STAFF: "staff",
  STUDENT: "student",
  GUARDIAN: "guardian",
} as const;

export type OrgStatus = (typeof STATUS.ORG)[keyof typeof STATUS.ORG];
export type CampusStatus = (typeof STATUS.CAMPUS)[keyof typeof STATUS.CAMPUS];
export type MemberStatus = (typeof STATUS.MEMBER)[keyof typeof STATUS.MEMBER];
export type MemberType = (typeof MEMBER_TYPES)[keyof typeof MEMBER_TYPES];
export type AcademicYearStatus =
  (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];
export type {
  CalendarEventStatus,
  SubjectStatus,
  TimetableAssignmentStatus,
  TimetableEntryStatus,
  TimetableVersionStatus,
};
export type {
  ClassStatus,
  CommunicationPreference,
  GuardianRelationship,
  SectionStatus,
};
export type AttendanceRecordStatus = AttendanceStatus;
export const HONORIFICS = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Shri",
  "Smt.",
  "Prof.",
] as const;

export type Honorific = (typeof HONORIFICS)[number];

export {
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_CATEGORIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
};
