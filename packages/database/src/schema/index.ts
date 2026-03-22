import {
  boolean,
  date,
  integer,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_FORM_FIELD_TYPES,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_STATUS,
  CALENDAR_EVENT_STATUS,
  CALENDAR_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  SUBJECT_STATUS,
  TIMETABLE_ENTRY_STATUS,
  WEEKDAY_KEYS,
} from "@repo/contracts";
import { campus, member, organization, user } from "./auth";

const FEE_STRUCTURE_SCOPE_ENUM = ["institution", "campus"] as const;
const FEE_STRUCTURE_STATUS_ENUM = ["active", "archived", "deleted"] as const;
const FEE_ASSIGNMENT_STATUS_ENUM = ["pending", "partial", "paid"] as const;
const FEE_ADJUSTMENT_TYPE_ENUM = ["waiver", "discount"] as const;
const FEE_PAYMENT_METHOD_ENUM = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
] as const;
const ATTENDANCE_STATUS_ENUM = [
  "present",
  "absent",
  "late",
  "excused",
] as const;
const ADMISSION_ENQUIRY_STATUS_ENUM = [
  "new",
  "in_progress",
  "converted",
  "closed",
] as const;
const ADMISSION_APPLICATION_STATUS_ENUM = [
  "draft",
  "submitted",
  "reviewed",
  "approved",
  "rejected",
] as const;
const ADMISSION_FORM_FIELD_SCOPE_ENUM = [
  ADMISSION_FORM_FIELD_SCOPES.APPLICATION,
  ADMISSION_FORM_FIELD_SCOPES.STUDENT,
  ADMISSION_FORM_FIELD_SCOPES.BOTH,
] as const;
const ADMISSION_FORM_FIELD_TYPE_ENUM = [
  ADMISSION_FORM_FIELD_TYPES.TEXT,
  ADMISSION_FORM_FIELD_TYPES.TEXTAREA,
  ADMISSION_FORM_FIELD_TYPES.NUMBER,
  ADMISSION_FORM_FIELD_TYPES.DATE,
  ADMISSION_FORM_FIELD_TYPES.SELECT,
  ADMISSION_FORM_FIELD_TYPES.EMAIL,
  ADMISSION_FORM_FIELD_TYPES.PHONE,
  ADMISSION_FORM_FIELD_TYPES.URL,
  ADMISSION_FORM_FIELD_TYPES.CHECKBOX,
] as const;
const SUBJECT_STATUS_ENUM = [
  SUBJECT_STATUS.ACTIVE,
  SUBJECT_STATUS.INACTIVE,
  SUBJECT_STATUS.DELETED,
] as const;
const TIMETABLE_ENTRY_STATUS_ENUM = [
  TIMETABLE_ENTRY_STATUS.ACTIVE,
  TIMETABLE_ENTRY_STATUS.INACTIVE,
  TIMETABLE_ENTRY_STATUS.DELETED,
] as const;
const CALENDAR_EVENT_TYPE_ENUM = [
  CALENDAR_EVENT_TYPES.HOLIDAY,
  CALENDAR_EVENT_TYPES.EXAM,
  CALENDAR_EVENT_TYPES.EVENT,
  CALENDAR_EVENT_TYPES.DEADLINE,
] as const;
const CALENDAR_EVENT_STATUS_ENUM = [
  CALENDAR_EVENT_STATUS.ACTIVE,
  CALENDAR_EVENT_STATUS.INACTIVE,
  CALENDAR_EVENT_STATUS.DELETED,
] as const;
const ANNOUNCEMENT_AUDIENCE_ENUM = [
  ANNOUNCEMENT_AUDIENCE.ALL,
  ANNOUNCEMENT_AUDIENCE.STAFF,
  ANNOUNCEMENT_AUDIENCE.GUARDIANS,
  ANNOUNCEMENT_AUDIENCE.STUDENTS,
] as const;
const ANNOUNCEMENT_STATUS_ENUM = [
  ANNOUNCEMENT_STATUS.DRAFT,
  ANNOUNCEMENT_STATUS.PUBLISHED,
  ANNOUNCEMENT_STATUS.ARCHIVED,
  ANNOUNCEMENT_STATUS.DELETED,
] as const;
const NOTIFICATION_CHANNEL_ENUM = [
  NOTIFICATION_CHANNELS.SYSTEM,
  NOTIFICATION_CHANNELS.ACADEMICS,
  NOTIFICATION_CHANNELS.OPERATIONS,
  NOTIFICATION_CHANNELS.FINANCE,
  NOTIFICATION_CHANNELS.COMMUNITY,
] as const;
const NOTIFICATION_TONE_ENUM = [
  NOTIFICATION_TONES.CRITICAL,
  NOTIFICATION_TONES.INFO,
  NOTIFICATION_TONES.POSITIVE,
  NOTIFICATION_TONES.WARNING,
] as const;
const NOTIFICATION_TYPE_ENUM = [
  NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
] as const;
const WEEKDAY_ENUM = [
  WEEKDAY_KEYS.MONDAY,
  WEEKDAY_KEYS.TUESDAY,
  WEEKDAY_KEYS.WEDNESDAY,
  WEEKDAY_KEYS.THURSDAY,
  WEEKDAY_KEYS.FRIDAY,
  WEEKDAY_KEYS.SATURDAY,
  WEEKDAY_KEYS.SUNDAY,
] as const;
const AUDIT_ACTION_ENUM = [
  AUDIT_ACTIONS.CREATE,
  AUDIT_ACTIONS.UPDATE,
  AUDIT_ACTIONS.DELETE,
  AUDIT_ACTIONS.MARK,
  AUDIT_ACTIONS.REPLACE,
  AUDIT_ACTIONS.REVERSE,
  AUDIT_ACTIONS.EXECUTE,
] as const;
const AUDIT_ENTITY_TYPE_ENUM = [
  AUDIT_ENTITY_TYPES.ROLE,
  AUDIT_ENTITY_TYPES.ATTENDANCE_DAY,
  AUDIT_ENTITY_TYPES.EXAM_MARKS,
  AUDIT_ENTITY_TYPES.FEE_PAYMENT,
  AUDIT_ENTITY_TYPES.STUDENT_ROLLOVER,
] as const;

export const academicYears = pgTable(
  "academic_years",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    name: text().notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    isCurrent: boolean().notNull().default(false),
    // active = in use; archived = lifecycle ended naturally; deleted = admin correction (only if no data)
    status: text({ enum: ["active", "archived", "deleted"] })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (t) => [
    index("academic_years_institution_idx").on(t.institutionId),
    index("academic_years_institution_current_idx").on(
      t.institutionId,
      t.isCurrent,
    ),
    uniqueIndex("academic_years_single_current_per_institution_idx")
      .on(t.institutionId)
      .where(sql`${t.isCurrent} IS TRUE AND ${t.status} != 'deleted'`),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    roleType: text({
      enum: ["platform", "system", "institution"],
    }).notNull(),
    institutionId: text().references(() => organization.id, {
      onDelete: "restrict",
    }),
    isSystem: boolean().notNull().default(false),
    isConfigurable: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (t) => [
    unique("roles_slug_institution_unique").on(t.slug, t.institutionId),
    uniqueIndex("roles_slug_global_unique_idx")
      .on(t.slug)
      .where(sql`institution_id IS NULL`),
  ],
);

export const permissions = pgTable("permissions", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  description: text(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text()
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    permissionId: text()
      .notNull()
      .references(() => permissions.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: text().primaryKey(),
    membershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    roleId: text()
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    validFrom: date().notNull(),
    validTo: date(),
    academicYearId: text().references(() => academicYears.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (t) => [
    index("membership_roles_membership_idx").on(t.membershipId),
    index("membership_roles_role_idx").on(t.roleId),
    index("membership_roles_valid_to_idx").on(t.validTo),
  ],
);

export const membershipRoleScopes = pgTable("membership_role_scopes", {
  id: text().primaryKey(),
  membershipRoleId: text()
    .notNull()
    .references(() => membershipRoles.id, { onDelete: "restrict" }),
  scopeType: text({
    enum: ["institution", "campus", "department", "class", "section"],
  }).notNull(),
  scopeId: text().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorUserId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    actorCampusId: text().references(() => campus.id, {
      onDelete: "set null",
    }),
    actorContextKey: text({
      enum: ["staff", "parent", "student"],
    }),
    action: text({ enum: AUDIT_ACTION_ENUM }).notNull(),
    entityType: text({ enum: AUDIT_ENTITY_TYPE_ENUM }).notNull(),
    entityId: text(),
    entityLabel: text(),
    summary: text().notNull(),
    metadata: jsonb().$type<Record<string, unknown> | null>(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_institution_created_at_idx").on(
      table.institutionId,
      table.createdAt,
    ),
    index("audit_logs_institution_entity_idx").on(
      table.institutionId,
      table.entityType,
      table.createdAt,
    ),
    index("audit_logs_institution_action_idx").on(
      table.institutionId,
      table.action,
      table.createdAt,
    ),
    index("audit_logs_actor_user_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const campusMemberships = pgTable(
  "campus_memberships",
  {
    id: text().primaryKey(),
    membershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("campus_membership_membership_idx").on(table.membershipId),
    index("campus_membership_campus_idx").on(table.campusId),
    uniqueIndex("campus_membership_active_unique_idx")
      .on(table.membershipId, table.campusId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const students = pgTable(
  "students",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    membershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    admissionNumber: text().notNull(),
    firstName: text().notNull(),
    lastName: text(),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "restrict" }),
    sectionId: text()
      .notNull()
      .references(() => classSections.id, { onDelete: "restrict" }),
    customFieldValues: jsonb().$type<Record<string, unknown> | null>(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("students_institution_idx").on(table.institutionId),
    index("students_membership_idx").on(table.membershipId),
    uniqueIndex("students_membership_active_unique_idx")
      .on(table.membershipId)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("students_admission_number_unique_idx")
      .on(table.institutionId, table.admissionNumber)
      .where(sql`${table.deletedAt} IS NULL`),
    index("students_class_section_idx").on(
      table.institutionId,
      table.classId,
      table.sectionId,
    ),
  ],
);

export const admissionEnquiries = pgTable(
  "admission_enquiries",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    studentName: text().notNull(),
    guardianName: text().notNull(),
    mobile: text().notNull(),
    email: text(),
    source: text(),
    status: text({
      enum: ADMISSION_ENQUIRY_STATUS_ENUM,
    })
      .notNull()
      .default("new"),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("admission_enquiries_institution_idx").on(table.institutionId),
    index("admission_enquiries_campus_idx").on(table.campusId),
    index("admission_enquiries_status_idx").on(table.status),
  ],
);

export const admissionFormFields = pgTable(
  "admission_form_fields",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    key: text().notNull(),
    label: text().notNull(),
    scope: text({
      enum: ADMISSION_FORM_FIELD_SCOPE_ENUM,
    })
      .notNull()
      .default(ADMISSION_FORM_FIELD_SCOPES.APPLICATION),
    fieldType: text({
      enum: ADMISSION_FORM_FIELD_TYPE_ENUM,
    })
      .notNull()
      .default(ADMISSION_FORM_FIELD_TYPES.TEXT),
    placeholder: text(),
    helpText: text(),
    required: boolean().notNull().default(false),
    active: boolean().notNull().default(true),
    options: jsonb().$type<Array<{ label: string; value: string }> | null>(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    index("admission_form_fields_institution_idx").on(table.institutionId),
    index("admission_form_fields_scope_idx").on(table.scope),
    uniqueIndex("admission_form_fields_key_unique_idx").on(
      table.institutionId,
      table.key,
    ),
  ],
);

export const admissionApplications = pgTable(
  "admission_applications",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    enquiryId: text().references(() => admissionEnquiries.id, {
      onDelete: "restrict",
    }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    studentFirstName: text().notNull(),
    studentLastName: text(),
    guardianName: text().notNull(),
    mobile: text().notNull(),
    email: text(),
    desiredClassName: text(),
    desiredSectionName: text(),
    status: text({
      enum: ADMISSION_APPLICATION_STATUS_ENUM,
    })
      .notNull()
      .default("draft"),
    notes: text(),
    customFieldValues: jsonb().$type<Record<string, unknown> | null>(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("admission_applications_institution_idx").on(table.institutionId),
    index("admission_applications_enquiry_idx").on(table.enquiryId),
    index("admission_applications_campus_idx").on(table.campusId),
    index("admission_applications_status_idx").on(table.status),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    studentId: text()
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    attendanceDate: date().notNull(),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "restrict" }),
    sectionId: text()
      .notNull()
      .references(() => classSections.id, { onDelete: "restrict" }),
    status: text({
      enum: ATTENDANCE_STATUS_ENUM,
    }).notNull(),
    markedByMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    unique("attendance_records_student_date_unique").on(
      table.institutionId,
      table.studentId,
      table.attendanceDate,
    ),
    index("attendance_records_day_idx").on(
      table.institutionId,
      table.attendanceDate,
    ),
    index("attendance_records_scope_idx").on(
      table.institutionId,
      table.campusId,
      table.attendanceDate,
      table.classId,
      table.sectionId,
    ),
  ],
);

export const studentCurrentEnrollments = pgTable(
  "student_current_enrollments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    studentMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    academicYearId: text()
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "restrict" }),
    sectionId: text()
      .notNull()
      .references(() => classSections.id, { onDelete: "restrict" }),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("student_current_enrollments_institution_idx").on(
      table.institutionId,
    ),
    index("student_current_enrollments_student_membership_idx").on(
      table.studentMembershipId,
    ),
    index("student_current_enrollments_academic_year_idx").on(
      table.academicYearId,
    ),
    uniqueIndex("student_current_enrollments_active_unique_idx")
      .on(table.studentMembershipId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const studentGuardianLinks = pgTable(
  "student_guardian_links",
  {
    id: text().primaryKey(),
    studentMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    parentMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    relationship: text({
      enum: ["father", "mother", "guardian"],
    }).notNull(),
    isPrimary: boolean().notNull().default(false),
    deletedAt: timestamp(),
  },
  (t) => [
    index("sgl_student_idx").on(t.studentMembershipId),
    index("sgl_parent_idx").on(t.parentMembershipId),
  ],
);

export const schoolClasses = pgTable(
  "classes",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    name: text().notNull(),
    // active = in use; inactive = suspended; deleted = admin correction (only if no students)
    status: text({ enum: ["active", "inactive", "deleted"] })
      .notNull()
      .default("active"),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (table) => [
    index("classes_institution_idx").on(table.institutionId),
    index("classes_campus_idx").on(table.campusId),
    uniqueIndex("classes_name_per_campus_unique_idx")
      .on(table.campusId, table.name)
      .where(sql`${table.status} != 'deleted'`),
  ],
);

export const classSections = pgTable(
  "sections",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "cascade" }),
    name: text().notNull(),
    // active = in use; inactive = archived (never deleted — sections preserve identity for historical records)
    status: text({ enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("sections_institution_idx").on(table.institutionId),
    index("sections_class_idx").on(table.classId),
    index("sections_class_status_idx").on(table.classId, table.status),
    uniqueIndex("sections_name_per_class_unique_idx")
      .on(table.classId, table.name)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const subjects = pgTable(
  "subjects",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    name: text().notNull(),
    code: text(),
    status: text({ enum: SUBJECT_STATUS_ENUM }).notNull().default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (table) => [
    index("subjects_institution_idx").on(table.institutionId),
    index("subjects_campus_idx").on(table.campusId),
    index("subjects_status_idx").on(table.status),
    uniqueIndex("subjects_name_per_campus_unique_idx")
      .on(table.campusId, table.name)
      .where(sql`${table.status} != 'deleted'`),
  ],
);

export const timetableEntries = pgTable(
  "timetable_entries",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "restrict" }),
    sectionId: text()
      .notNull()
      .references(() => classSections.id, { onDelete: "restrict" }),
    subjectId: text()
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    dayOfWeek: text({ enum: WEEKDAY_ENUM }).notNull(),
    periodIndex: integer().notNull(),
    startTime: text().notNull(),
    endTime: text().notNull(),
    room: text(),
    status: text({ enum: TIMETABLE_ENTRY_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (table) => [
    index("timetable_entries_institution_idx").on(table.institutionId),
    index("timetable_entries_scope_idx").on(
      table.campusId,
      table.classId,
      table.sectionId,
    ),
    index("timetable_entries_subject_idx").on(table.subjectId),
    uniqueIndex("timetable_entries_section_slot_unique_idx")
      .on(table.sectionId, table.dayOfWeek, table.periodIndex)
      .where(sql`${table.status} != 'deleted'`),
  ],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text().references(() => campus.id, { onDelete: "restrict" }),
    title: text().notNull(),
    description: text(),
    eventDate: date().notNull(),
    startTime: text(),
    endTime: text(),
    isAllDay: boolean().notNull().default(true),
    eventType: text({ enum: CALENDAR_EVENT_TYPE_ENUM })
      .notNull()
      .default("event"),
    status: text({ enum: CALENDAR_EVENT_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (table) => [
    index("calendar_events_institution_idx").on(table.institutionId),
    index("calendar_events_campus_idx").on(table.campusId),
    index("calendar_events_event_date_idx").on(table.eventDate),
    index("calendar_events_status_idx").on(table.status),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text().references(() => campus.id, { onDelete: "restrict" }),
    createdByUserId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    title: text().notNull(),
    summary: text(),
    body: text().notNull(),
    audience: text({ enum: ANNOUNCEMENT_AUDIENCE_ENUM })
      .notNull()
      .default("all"),
    status: text({ enum: ANNOUNCEMENT_STATUS_ENUM }).notNull().default("draft"),
    publishedAt: timestamp(),
    publishedNotificationId: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("announcements_institution_idx").on(table.institutionId),
    index("announcements_campus_idx").on(table.campusId),
    index("announcements_status_idx").on(table.status),
    index("announcements_published_at_idx").on(table.publishedAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text().references(() => campus.id, { onDelete: "restrict" }),
    announcementId: text().references(() => announcements.id, {
      onDelete: "set null",
    }),
    createdByUserId: text().references(() => user.id, {
      onDelete: "set null",
    }),
    type: text({ enum: NOTIFICATION_TYPE_ENUM }).notNull(),
    channel: text({ enum: NOTIFICATION_CHANNEL_ENUM }).notNull(),
    tone: text({ enum: NOTIFICATION_TONE_ENUM }).notNull().default("info"),
    audience: text({ enum: ANNOUNCEMENT_AUDIENCE_ENUM })
      .notNull()
      .default("all"),
    title: text().notNull(),
    message: text().notNull(),
    senderLabel: text().notNull(),
    actionLabel: text(),
    actionHref: text(),
    actionRequired: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("notifications_institution_idx").on(table.institutionId),
    index("notifications_campus_idx").on(table.campusId),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_announcement_idx").on(table.announcementId),
  ],
);

export const notificationReads = pgTable(
  "notification_reads",
  {
    notificationId: text()
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.notificationId, table.userId] }),
    index("notification_reads_user_idx").on(table.userId, table.readAt),
  ],
);

export const feeStructures = pgTable(
  "fee_structures",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    academicYearId: text()
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    campusId: text().references(() => campus.id, {
      onDelete: "restrict",
    }),
    name: text().notNull(),
    description: text(),
    scope: text({
      enum: FEE_STRUCTURE_SCOPE_ENUM,
    }).notNull(),
    status: text({
      enum: FEE_STRUCTURE_STATUS_ENUM,
    })
      .notNull()
      .default("active"),
    amountInPaise: integer().notNull(),
    dueDate: date().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(), // audit timestamp — set when status = deleted
  },
  (table) => [
    index("fee_structures_institution_idx").on(table.institutionId),
    index("fee_structures_academic_year_idx").on(table.academicYearId),
    index("fee_structures_campus_idx").on(table.campusId),
    index("fee_structures_status_idx").on(table.status),
    uniqueIndex("fee_structures_name_scope_unique_idx")
      .on(table.institutionId, table.academicYearId, table.campusId, table.name)
      .where(sql`${table.status} != 'deleted'`),
  ],
);

export const examTerms = pgTable(
  "exam_terms",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    academicYearId: text()
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    name: text().notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("exam_terms_institution_idx").on(table.institutionId),
    index("exam_terms_academic_year_idx").on(table.academicYearId),
    uniqueIndex("exam_terms_name_unique_idx")
      .on(table.institutionId, table.academicYearId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const examMarks = pgTable(
  "exam_marks",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    examTermId: text()
      .notNull()
      .references(() => examTerms.id, { onDelete: "cascade" }),
    studentId: text()
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectName: text().notNull(),
    maxMarks: integer().notNull(),
    obtainedMarks: integer().notNull(),
    remarks: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("exam_marks_term_idx").on(table.examTermId),
    index("exam_marks_student_idx").on(table.studentId),
    uniqueIndex("exam_marks_subject_unique_idx").on(
      table.examTermId,
      table.studentId,
      table.subjectName,
    ),
  ],
);

export const feeStructureInstallments = pgTable(
  "fee_structure_installments",
  {
    id: text().primaryKey(),
    feeStructureId: text()
      .notNull()
      .references(() => feeStructures.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull(),
    label: text().notNull(),
    amountInPaise: integer().notNull(),
    dueDate: date().notNull(),
  },
  (table) => [
    index("fee_structure_installments_structure_idx").on(table.feeStructureId),
  ],
);

export const feeAssignments = pgTable(
  "fee_assignments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    feeStructureId: text()
      .notNull()
      .references(() => feeStructures.id, { onDelete: "restrict" }),
    installmentId: text().references(() => feeStructureInstallments.id, {
      onDelete: "restrict",
    }),
    studentId: text()
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    assignedAmountInPaise: integer().notNull(),
    dueDate: date().notNull(),
    status: text({
      enum: FEE_ASSIGNMENT_STATUS_ENUM,
    }).notNull(),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("fee_assignments_institution_idx").on(table.institutionId),
    index("fee_assignments_structure_idx").on(table.feeStructureId),
    index("fee_assignments_student_idx").on(table.studentId),
    index("fee_assignments_due_date_idx").on(table.dueDate),
    uniqueIndex("fee_assignments_student_installment_unique_idx")
      .on(table.studentId, table.installmentId)
      .where(
        sql`${table.installmentId} IS NOT NULL AND ${table.deletedAt} IS NULL`,
      ),
  ],
);

export const feePayments = pgTable(
  "fee_payments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    feeAssignmentId: text()
      .notNull()
      .references(() => feeAssignments.id, { onDelete: "restrict" }),
    amountInPaise: integer().notNull(),
    paymentDate: date().notNull(),
    paymentMethod: text({
      enum: FEE_PAYMENT_METHOD_ENUM,
    }).notNull(),
    referenceNumber: text(),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("fee_payments_institution_idx").on(table.institutionId),
    index("fee_payments_assignment_idx").on(table.feeAssignmentId),
    index("fee_payments_payment_date_idx").on(table.paymentDate),
  ],
);

export const feeAssignmentAdjustments = pgTable(
  "fee_assignment_adjustments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    feeAssignmentId: text()
      .notNull()
      .references(() => feeAssignments.id, { onDelete: "restrict" }),
    adjustmentType: text({
      enum: FEE_ADJUSTMENT_TYPE_ENUM,
    }).notNull(),
    amountInPaise: integer().notNull(),
    reason: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("fee_assignment_adjustments_institution_idx").on(table.institutionId),
    index("fee_assignment_adjustments_assignment_idx").on(
      table.feeAssignmentId,
    ),
  ],
);

export const feePaymentReversals = pgTable(
  "fee_payment_reversals",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    feePaymentId: text()
      .notNull()
      .references(() => feePayments.id, { onDelete: "restrict" }),
    reason: text(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("fee_payment_reversals_institution_idx").on(table.institutionId),
    uniqueIndex("fee_payment_reversals_payment_unique_idx").on(
      table.feePaymentId,
    ),
  ],
);
