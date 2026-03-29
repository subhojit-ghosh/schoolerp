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
  BELL_SCHEDULE_PERIOD_STATUS,
  BELL_SCHEDULE_STATUS,
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_STATUS,
  CALENDAR_EVENT_STATUS,
  CALENDAR_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  SALARY_COMPONENT_TYPES,
  SALARY_CALCULATION_TYPES,
  SALARY_COMPONENT_STATUS,
  SALARY_TEMPLATE_STATUS,
  SALARY_ASSIGNMENT_STATUS,
  PAYROLL_RUN_STATUS,
  SUBJECT_STATUS,
  TIMETABLE_ASSIGNMENT_STATUS,
  TIMETABLE_ENTRY_STATUS,
  TIMETABLE_VERSION_STATUS,
  WEEKDAY_KEYS,
  INVENTORY_CATEGORY_STATUS,
  INVENTORY_ITEM_STATUS,
  STOCK_TRANSACTION_TYPES,
  INVENTORY_UNITS,
  HOSTEL_BUILDING_STATUS,
  HOSTEL_BUILDING_TYPES,
  HOSTEL_ROOM_STATUS,
  HOSTEL_ROOM_TYPES,
  BED_ALLOCATION_STATUS,
  MESS_PLAN_STATUS,
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
  "online",
] as const;
const ATTENDANCE_STATUS_ENUM = [
  "present",
  "absent",
  "late",
  "excused",
] as const;
const STAFF_ATTENDANCE_STATUS_ENUM = [
  "present",
  "absent",
  "half_day",
  "on_leave",
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
const TIMETABLE_VERSION_STATUS_ENUM = [
  TIMETABLE_VERSION_STATUS.DRAFT,
  TIMETABLE_VERSION_STATUS.PUBLISHED,
  TIMETABLE_VERSION_STATUS.ARCHIVED,
] as const;
const TIMETABLE_ASSIGNMENT_STATUS_ENUM = [
  TIMETABLE_ASSIGNMENT_STATUS.ACTIVE,
  TIMETABLE_ASSIGNMENT_STATUS.INACTIVE,
] as const;
const BELL_SCHEDULE_STATUS_ENUM = [
  BELL_SCHEDULE_STATUS.DRAFT,
  BELL_SCHEDULE_STATUS.ACTIVE,
  BELL_SCHEDULE_STATUS.ARCHIVED,
  BELL_SCHEDULE_STATUS.DELETED,
] as const;
const BELL_SCHEDULE_PERIOD_STATUS_ENUM = [
  BELL_SCHEDULE_PERIOD_STATUS.ACTIVE,
  BELL_SCHEDULE_PERIOD_STATUS.INACTIVE,
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
  NOTIFICATION_TYPES.FEE_PAYMENT_RECEIVED,
  NOTIFICATION_TYPES.FEE_PAYMENT_REVERSED,
  NOTIFICATION_TYPES.ATTENDANCE_ABSENT,
  NOTIFICATION_TYPES.ATTENDANCE_ABSENT_STREAK,
  NOTIFICATION_TYPES.PASSWORD_SETUP_REQUIRED,
  NOTIFICATION_TYPES.ADMISSION_APPLICATION_RECEIVED,
  NOTIFICATION_TYPES.ADMISSION_STATUS_CHANGED,
  NOTIFICATION_TYPES.EXAM_RESULTS_PUBLISHED,
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
  AUDIT_ENTITY_TYPES.STUDENT,
  AUDIT_ENTITY_TYPES.STAFF,
  AUDIT_ENTITY_TYPES.GUARDIAN,
  AUDIT_ENTITY_TYPES.CLASS,
  AUDIT_ENTITY_TYPES.SECTION,
  AUDIT_ENTITY_TYPES.SUBJECT,
  AUDIT_ENTITY_TYPES.CAMPUS,
  AUDIT_ENTITY_TYPES.INSTITUTION_SETTINGS,
  AUDIT_ENTITY_TYPES.FEE_STRUCTURE,
  AUDIT_ENTITY_TYPES.FEE_ASSIGNMENT,
  AUDIT_ENTITY_TYPES.ADMISSION_ENQUIRY,
  AUDIT_ENTITY_TYPES.ADMISSION_APPLICATION,
  AUDIT_ENTITY_TYPES.ANNOUNCEMENT,
  AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
  AUDIT_ENTITY_TYPES.TIMETABLE,
  AUDIT_ENTITY_TYPES.BELL_SCHEDULE,
  AUDIT_ENTITY_TYPES.ACADEMIC_YEAR,
  AUDIT_ENTITY_TYPES.DELIVERY_CONFIG,
  AUDIT_ENTITY_TYPES.PAYMENT_CONFIG,
  AUDIT_ENTITY_TYPES.PAYMENT_ORDER,
  AUDIT_ENTITY_TYPES.HOMEWORK,
  AUDIT_ENTITY_TYPES.LEAVE_TYPE,
  AUDIT_ENTITY_TYPES.LEAVE_APPLICATION,
  AUDIT_ENTITY_TYPES.LIBRARY_BOOK,
  AUDIT_ENTITY_TYPES.LIBRARY_TRANSACTION,
  AUDIT_ENTITY_TYPES.TRANSPORT_ROUTE,
  AUDIT_ENTITY_TYPES.TRANSPORT_STOP,
  AUDIT_ENTITY_TYPES.TRANSPORT_VEHICLE,
  AUDIT_ENTITY_TYPES.TRANSPORT_ASSIGNMENT,
  AUDIT_ENTITY_TYPES.SALARY_COMPONENT,
  AUDIT_ENTITY_TYPES.SALARY_TEMPLATE,
  AUDIT_ENTITY_TYPES.STAFF_SALARY_ASSIGNMENT,
  AUDIT_ENTITY_TYPES.PAYROLL_RUN,
  AUDIT_ENTITY_TYPES.PAYSLIP,
  AUDIT_ENTITY_TYPES.INVENTORY_CATEGORY,
  AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
  AUDIT_ENTITY_TYPES.STOCK_TRANSACTION,
  AUDIT_ENTITY_TYPES.HOSTEL_BUILDING,
  AUDIT_ENTITY_TYPES.HOSTEL_ROOM,
  AUDIT_ENTITY_TYPES.BED_ALLOCATION,
  AUDIT_ENTITY_TYPES.MESS_PLAN,
  AUDIT_ENTITY_TYPES.STAFF_ATTENDANCE_DAY,
] as const;

const SALARY_COMPONENT_TYPE_ENUM = [
  SALARY_COMPONENT_TYPES.EARNING,
  SALARY_COMPONENT_TYPES.DEDUCTION,
] as const;
const SALARY_CALCULATION_TYPE_ENUM = [
  SALARY_CALCULATION_TYPES.FIXED,
  SALARY_CALCULATION_TYPES.PERCENTAGE,
] as const;
const SALARY_COMPONENT_STATUS_ENUM = [
  SALARY_COMPONENT_STATUS.ACTIVE,
  SALARY_COMPONENT_STATUS.ARCHIVED,
  SALARY_COMPONENT_STATUS.DELETED,
] as const;
const SALARY_TEMPLATE_STATUS_ENUM = [
  SALARY_TEMPLATE_STATUS.ACTIVE,
  SALARY_TEMPLATE_STATUS.ARCHIVED,
  SALARY_TEMPLATE_STATUS.DELETED,
] as const;
const SALARY_ASSIGNMENT_STATUS_ENUM = [
  SALARY_ASSIGNMENT_STATUS.ACTIVE,
  SALARY_ASSIGNMENT_STATUS.ARCHIVED,
  SALARY_ASSIGNMENT_STATUS.DELETED,
] as const;
const PAYROLL_RUN_STATUS_ENUM = [
  PAYROLL_RUN_STATUS.DRAFT,
  PAYROLL_RUN_STATUS.PROCESSED,
  PAYROLL_RUN_STATUS.APPROVED,
  PAYROLL_RUN_STATUS.PAID,
] as const;

const INVENTORY_CATEGORY_STATUS_ENUM = [
  INVENTORY_CATEGORY_STATUS.ACTIVE,
  INVENTORY_CATEGORY_STATUS.INACTIVE,
  INVENTORY_CATEGORY_STATUS.DELETED,
] as const;
const INVENTORY_ITEM_STATUS_ENUM = [
  INVENTORY_ITEM_STATUS.ACTIVE,
  INVENTORY_ITEM_STATUS.INACTIVE,
  INVENTORY_ITEM_STATUS.DELETED,
] as const;
const STOCK_TRANSACTION_TYPE_ENUM = [
  STOCK_TRANSACTION_TYPES.PURCHASE,
  STOCK_TRANSACTION_TYPES.ISSUE,
  STOCK_TRANSACTION_TYPES.RETURN,
  STOCK_TRANSACTION_TYPES.ADJUSTMENT,
] as const;
const INVENTORY_UNIT_ENUM = [
  INVENTORY_UNITS.PIECE,
  INVENTORY_UNITS.BOX,
  INVENTORY_UNITS.PACK,
  INVENTORY_UNITS.SET,
  INVENTORY_UNITS.KG,
  INVENTORY_UNITS.LITER,
] as const;

const HOSTEL_BUILDING_STATUS_ENUM = [
  HOSTEL_BUILDING_STATUS.ACTIVE,
  HOSTEL_BUILDING_STATUS.INACTIVE,
  HOSTEL_BUILDING_STATUS.DELETED,
] as const;
const HOSTEL_BUILDING_TYPE_ENUM = [
  HOSTEL_BUILDING_TYPES.BOYS,
  HOSTEL_BUILDING_TYPES.GIRLS,
  HOSTEL_BUILDING_TYPES.CO_ED,
] as const;
const HOSTEL_ROOM_STATUS_ENUM = [
  HOSTEL_ROOM_STATUS.ACTIVE,
  HOSTEL_ROOM_STATUS.INACTIVE,
] as const;
const HOSTEL_ROOM_TYPE_ENUM = [
  HOSTEL_ROOM_TYPES.SINGLE,
  HOSTEL_ROOM_TYPES.DOUBLE,
  HOSTEL_ROOM_TYPES.DORMITORY,
] as const;
const BED_ALLOCATION_STATUS_ENUM = [
  BED_ALLOCATION_STATUS.ACTIVE,
  BED_ALLOCATION_STATUS.VACATED,
] as const;
const MESS_PLAN_STATUS_ENUM = [
  MESS_PLAN_STATUS.ACTIVE,
  MESS_PLAN_STATUS.INACTIVE,
] as const;

const TRANSPORT_ROUTE_STATUS_ENUM = ["active", "inactive"] as const;
const TRANSPORT_STOP_STATUS_ENUM = ["active", "inactive"] as const;
const TRANSPORT_VEHICLE_TYPE_ENUM = ["bus", "van", "auto"] as const;
const TRANSPORT_VEHICLE_STATUS_ENUM = ["active", "inactive"] as const;
const TRANSPORT_ASSIGNMENT_TYPE_ENUM = ["pickup", "dropoff", "both"] as const;
const TRANSPORT_ASSIGNMENT_STATUS_ENUM = ["active", "inactive"] as const;

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
    classTeacherMembershipId: text().references(() => member.id, {
      onDelete: "set null",
    }),
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

export const bellSchedules = pgTable(
  "bell_schedules",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    name: text().notNull(),
    isDefault: boolean().notNull().default(false),
    status: text({ enum: BELL_SCHEDULE_STATUS_ENUM })
      .notNull()
      .default("draft"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("bell_schedules_institution_idx").on(table.institutionId),
    index("bell_schedules_campus_idx").on(table.campusId),
    uniqueIndex("bell_schedules_default_per_campus_idx")
      .on(table.campusId)
      .where(sql`${table.isDefault} IS TRUE AND ${table.status} != 'deleted'`),
    uniqueIndex("bell_schedules_name_per_campus_unique_idx")
      .on(table.campusId, table.name)
      .where(sql`${table.status} != 'deleted'`),
  ],
);

export const timetableVersions = pgTable(
  "timetable_versions",
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
    academicYearId: text().references(() => academicYears.id, {
      onDelete: "restrict",
    }),
    bellScheduleId: text()
      .notNull()
      .references(() => bellSchedules.id, { onDelete: "restrict" }),
    name: text().notNull(),
    notes: text(),
    status: text({ enum: TIMETABLE_VERSION_STATUS_ENUM })
      .notNull()
      .default("draft"),
    publishedAt: timestamp(),
    createdByUserId: text().references(() => user.id, { onDelete: "set null" }),
    updatedByUserId: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    index("timetable_versions_institution_idx").on(table.institutionId),
    index("timetable_versions_scope_idx").on(
      table.campusId,
      table.classId,
      table.sectionId,
    ),
    index("timetable_versions_status_idx").on(table.status),
    uniqueIndex("timetable_versions_name_per_scope_unique_idx")
      .on(table.sectionId, table.name)
      .where(sql`${table.status} != 'archived'`),
  ],
);

export const bellSchedulePeriods = pgTable(
  "bell_schedule_periods",
  {
    id: text().primaryKey(),
    bellScheduleId: text()
      .notNull()
      .references(() => bellSchedules.id, { onDelete: "cascade" }),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    periodIndex: integer().notNull(),
    label: text(),
    startTime: text().notNull(),
    endTime: text().notNull(),
    isBreak: boolean().notNull().default(false),
    status: text({ enum: BELL_SCHEDULE_PERIOD_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    index("bell_schedule_periods_schedule_idx").on(table.bellScheduleId),
    uniqueIndex("bell_schedule_periods_slot_unique_idx")
      .on(table.bellScheduleId, table.periodIndex)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const timetableAssignments = pgTable(
  "timetable_assignments",
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
    timetableVersionId: text()
      .notNull()
      .references(() => timetableVersions.id, { onDelete: "restrict" }),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    status: text({ enum: TIMETABLE_ASSIGNMENT_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [
    index("timetable_assignments_institution_idx").on(table.institutionId),
    index("timetable_assignments_scope_idx").on(
      table.campusId,
      table.classId,
      table.sectionId,
    ),
    index("timetable_assignments_version_idx").on(table.timetableVersionId),
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
    timetableVersionId: text().references(() => timetableVersions.id, {
      onDelete: "restrict",
    }),
    subjectId: text()
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    bellSchedulePeriodId: text().references(() => bellSchedulePeriods.id, {
      onDelete: "set null",
    }),
    staffId: text().references(() => member.id, { onDelete: "restrict" }),
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
    index("timetable_entries_version_idx").on(table.timetableVersionId),
    index("timetable_entries_subject_idx").on(table.subjectId),
    index("timetable_entries_staff_idx").on(table.staffId),
    uniqueIndex("timetable_entries_version_slot_unique_idx")
      .on(
        table.timetableVersionId,
        table.sectionId,
        table.dayOfWeek,
        table.periodIndex,
      )
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
    lastReminderSentAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("fee_assignments_institution_idx").on(table.institutionId),
    index("fee_assignments_structure_idx").on(table.feeStructureId),
    index("fee_assignments_student_idx").on(table.studentId),
    index("fee_assignments_due_date_idx").on(table.dueDate),
    index("fee_assignments_last_reminder_idx").on(table.lastReminderSentAt),
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
    // Set when paymentMethod = 'online' — links to the payment_orders record
    onlinePaymentOrderId: text(),
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

// ── Staff profile enums ─────────────────────────────────────────────────
const STAFF_GENDER_ENUM = ["male", "female", "other"] as const;
const BLOOD_GROUP_ENUM = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
const EMPLOYMENT_TYPE_ENUM = ["full_time", "part_time", "contractual"] as const;

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    membershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    employeeId: text(),
    designation: text(),
    department: text(),
    dateOfJoining: date(),
    dateOfBirth: date(),
    gender: text({ enum: STAFF_GENDER_ENUM }),
    bloodGroup: text({ enum: BLOOD_GROUP_ENUM }),
    address: text(),
    emergencyContactName: text(),
    emergencyContactMobile: text(),
    qualification: text(),
    experienceYears: integer(),
    employmentType: text({ enum: EMPLOYMENT_TYPE_ENUM }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("staff_profiles_institution_idx").on(t.institutionId),
    uniqueIndex("staff_profiles_membership_unique_idx").on(t.membershipId),
    uniqueIndex("staff_profiles_employee_id_unique_idx")
      .on(t.institutionId, t.employeeId)
      .where(sql`${t.employeeId} IS NOT NULL`),
  ],
);

export const subjectTeacherAssignments = pgTable(
  "subject_teacher_assignments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    membershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    subjectId: text()
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    classId: text().references(() => schoolClasses.id, {
      onDelete: "restrict",
    }),
    academicYearId: text().references(() => academicYears.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (t) => [
    index("subject_teacher_institution_idx").on(t.institutionId),
    index("subject_teacher_membership_idx").on(t.membershipId),
    index("subject_teacher_subject_idx").on(t.subjectId),
    uniqueIndex("subject_teacher_unique_idx")
      .on(t.membershipId, t.subjectId, t.classId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const homework = pgTable(
  "homework",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    classId: text()
      .notNull()
      .references(() => schoolClasses.id, { onDelete: "restrict" }),
    sectionId: text()
      .notNull()
      .references(() => classSections.id, { onDelete: "restrict" }),
    subjectId: text()
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    createdByMemberId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    title: text().notNull(),
    description: text(),
    attachmentInstructions: text(),
    dueDate: date().notNull(),
    status: text({ enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    publishedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("homework_institution_idx").on(t.institutionId),
    index("homework_class_section_idx").on(
      t.institutionId,
      t.classId,
      t.sectionId,
    ),
    index("homework_subject_idx").on(t.subjectId),
    index("homework_status_idx").on(t.status),
    index("homework_due_date_idx").on(t.dueDate),
    index("homework_created_by_idx").on(t.createdByMemberId),
  ],
);

// ─── Library ─────────────────────────────────────────────────────────────────

export const libraryBooks = pgTable(
  "library_books",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    title: text().notNull(),
    author: text(),
    isbn: text(),
    publisher: text(),
    genre: text(),
    totalCopies: integer().notNull().default(1),
    availableCopies: integer().notNull().default(1),
    status: text({ enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("library_books_institution_idx").on(t.institutionId),
    index("library_books_status_idx").on(t.status),
  ],
);

export const libraryTransactions = pgTable(
  "library_transactions",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    bookId: text()
      .notNull()
      .references(() => libraryBooks.id, { onDelete: "restrict" }),
    memberId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    issuedAt: timestamp().notNull().defaultNow(),
    dueDate: date().notNull(),
    returnedAt: timestamp(),
    fineAmount: integer().notNull().default(0),
    finePaid: boolean().notNull().default(false),
    // issued = currently borrowed; returned = returned; overdue = past due date
    status: text({ enum: ["issued", "returned", "overdue"] })
      .notNull()
      .default("issued"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("library_transactions_institution_idx").on(t.institutionId),
    index("library_transactions_book_idx").on(t.bookId),
    index("library_transactions_member_idx").on(t.memberId),
    index("library_transactions_status_idx").on(t.status),
  ],
);

// ─── Leave ────────────────────────────────────────────────────────────────────

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    name: text().notNull(),
    maxDaysPerYear: integer(),
    isPaid: boolean().notNull().default(true),
    status: text({ enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("leave_types_institution_idx").on(t.institutionId),
    index("leave_types_status_idx").on(t.status),
  ],
);

export const leaveApplications = pgTable(
  "leave_applications",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    staffMemberId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    leaveTypeId: text()
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "restrict" }),
    fromDate: date().notNull(),
    toDate: date().notNull(),
    daysCount: integer().notNull(),
    reason: text(),
    status: text({ enum: ["pending", "approved", "rejected", "cancelled"] })
      .notNull()
      .default("pending"),
    reviewedByMemberId: text().references(() => member.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp(),
    reviewNote: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("leave_applications_institution_idx").on(t.institutionId),
    index("leave_applications_staff_idx").on(t.staffMemberId),
    index("leave_applications_leave_type_idx").on(t.leaveTypeId),
    index("leave_applications_status_idx").on(t.status),
    index("leave_applications_from_date_idx").on(t.fromDate),
  ],
);

// ─── Staff Attendance ────────────────────────────────────────────────────────

export const staffAttendanceRecords = pgTable(
  "staff_attendance_records",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    campusId: text()
      .notNull()
      .references(() => campus.id, { onDelete: "restrict" }),
    staffMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    attendanceDate: date().notNull(),
    status: text({ enum: STAFF_ATTENDANCE_STATUS_ENUM }).notNull(),
    markedByMembershipId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("staff_att_unique_idx").on(
      table.institutionId,
      table.staffMembershipId,
      table.attendanceDate,
    ),
    index("staff_att_institution_date_idx").on(
      table.institutionId,
      table.attendanceDate,
    ),
    index("staff_att_campus_date_idx").on(
      table.institutionId,
      table.campusId,
      table.attendanceDate,
    ),
  ],
);

// ─── Transport ────────────────────────────────────────────────────────────────

export const transportRoutes = pgTable(
  "transport_routes",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    campusId: text().references(() => campus.id, { onDelete: "restrict" }),
    name: text().notNull(),
    description: text(),
    status: text({ enum: TRANSPORT_ROUTE_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transport_routes_institution_idx").on(t.institutionId),
    index("transport_routes_campus_idx").on(t.campusId),
    index("transport_routes_status_idx").on(t.status),
  ],
);

export const transportStops = pgTable(
  "transport_stops",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    routeId: text()
      .notNull()
      .references(() => transportRoutes.id, { onDelete: "cascade" }),
    name: text().notNull(),
    sequenceNumber: integer().notNull(),
    pickupTime: text(),
    dropTime: text(),
    status: text({ enum: TRANSPORT_STOP_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transport_stops_institution_idx").on(t.institutionId),
    index("transport_stops_route_idx").on(t.routeId),
    index("transport_stops_status_idx").on(t.status),
    uniqueIndex("transport_stops_route_seq_unique_idx").on(
      t.routeId,
      t.sequenceNumber,
    ),
  ],
);

export const transportVehicles = pgTable(
  "transport_vehicles",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    registrationNumber: text().notNull(),
    type: text({ enum: TRANSPORT_VEHICLE_TYPE_ENUM }).notNull(),
    capacity: integer().notNull(),
    driverName: text(),
    driverContact: text(),
    routeId: text().references(() => transportRoutes.id, {
      onDelete: "set null",
    }),
    status: text({ enum: TRANSPORT_VEHICLE_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transport_vehicles_institution_idx").on(t.institutionId),
    index("transport_vehicles_route_idx").on(t.routeId),
    index("transport_vehicles_status_idx").on(t.status),
    uniqueIndex("transport_vehicles_reg_unique_idx").on(
      t.institutionId,
      t.registrationNumber,
    ),
  ],
);

export const studentTransportAssignments = pgTable(
  "student_transport_assignments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    studentId: text()
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    routeId: text()
      .notNull()
      .references(() => transportRoutes.id, { onDelete: "restrict" }),
    stopId: text()
      .notNull()
      .references(() => transportStops.id, { onDelete: "restrict" }),
    assignmentType: text({ enum: TRANSPORT_ASSIGNMENT_TYPE_ENUM })
      .notNull()
      .default("both"),
    startDate: date().notNull(),
    endDate: date(),
    status: text({ enum: TRANSPORT_ASSIGNMENT_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("student_transport_institution_idx").on(t.institutionId),
    index("student_transport_student_idx").on(t.studentId),
    index("student_transport_route_idx").on(t.routeId),
    index("student_transport_stop_idx").on(t.stopId),
    index("student_transport_status_idx").on(t.status),
    uniqueIndex("student_transport_active_unique_idx")
      .on(t.studentId)
      .where(sql`${t.status} = 'active'`),
  ],
);

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export const salaryComponents = pgTable(
  "salary_components",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    type: text({ enum: SALARY_COMPONENT_TYPE_ENUM }).notNull(),
    calculationType: text({ enum: SALARY_CALCULATION_TYPE_ENUM }).notNull(),
    isTaxable: boolean().notNull().default(true),
    isStatutory: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    // Tier 1: active | archived | deleted
    status: text({ enum: SALARY_COMPONENT_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("salary_components_institution_idx").on(t.institutionId),
    index("salary_components_status_idx").on(t.status),
    uniqueIndex("salary_components_name_unique_idx")
      .on(t.institutionId, t.name)
      .where(sql`${t.status} != 'deleted'`),
  ],
);

export const salaryTemplates = pgTable(
  "salary_templates",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    // Tier 1: active | archived | deleted
    status: text({ enum: SALARY_TEMPLATE_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("salary_templates_institution_idx").on(t.institutionId),
    index("salary_templates_status_idx").on(t.status),
    uniqueIndex("salary_templates_name_unique_idx")
      .on(t.institutionId, t.name)
      .where(sql`${t.status} != 'deleted'`),
  ],
);

export const salaryTemplateComponents = pgTable(
  "salary_template_components",
  {
    id: text().primaryKey(),
    salaryTemplateId: text()
      .notNull()
      .references(() => salaryTemplates.id, { onDelete: "cascade" }),
    salaryComponentId: text()
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    amountInPaise: integer(), // for fixed components
    percentage: integer(), // basis points (1200 = 12.00%) for percentage components
    sortOrder: integer().notNull().default(0),
  },
  (t) => [
    index("salary_template_components_template_idx").on(t.salaryTemplateId),
    unique("salary_template_components_unique").on(
      t.salaryTemplateId,
      t.salaryComponentId,
    ),
  ],
);

export const staffSalaryAssignments = pgTable(
  "staff_salary_assignments",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    staffProfileId: text()
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "restrict" }),
    salaryTemplateId: text()
      .notNull()
      .references(() => salaryTemplates.id, { onDelete: "restrict" }),
    effectiveFrom: date().notNull(),
    ctcInPaise: integer().notNull(),
    // Per-component overrides: { [componentId]: { amountInPaise?, percentage? } }
    overrides: jsonb(),
    // Tier 1: active | archived | deleted
    status: text({ enum: SALARY_ASSIGNMENT_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("staff_salary_assignments_institution_idx").on(t.institutionId),
    index("staff_salary_assignments_staff_idx").on(t.staffProfileId),
    index("staff_salary_assignments_status_idx").on(t.status),
    uniqueIndex("staff_salary_assignments_active_unique_idx")
      .on(t.staffProfileId)
      .where(sql`${t.status} = 'active'`),
  ],
);

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    month: integer().notNull(), // 1-12
    year: integer().notNull(),
    campusId: text().references(() => campus.id, { onDelete: "restrict" }), // null = all campuses
    // Tier 4 workflow: draft → processed → approved → paid
    status: text({ enum: PAYROLL_RUN_STATUS_ENUM }).notNull().default("draft"),
    totalEarningsInPaise: integer().notNull().default(0),
    totalDeductionsInPaise: integer().notNull().default(0),
    totalNetPayInPaise: integer().notNull().default(0),
    staffCount: integer().notNull().default(0),
    workingDays: integer().notNull().default(26),
    processedByMemberId: text().references(() => member.id, {
      onDelete: "restrict",
    }),
    approvedByMemberId: text().references(() => member.id, {
      onDelete: "restrict",
    }),
    processedAt: timestamp(),
    approvedAt: timestamp(),
    paidAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("payroll_runs_institution_idx").on(t.institutionId),
    index("payroll_runs_status_idx").on(t.status),
    index("payroll_runs_month_year_idx").on(t.institutionId, t.year, t.month),
  ],
);

export const payslips = pgTable(
  "payslips",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    payrollRunId: text()
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "restrict" }),
    staffProfileId: text()
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "restrict" }),
    salaryAssignmentId: text()
      .notNull()
      .references(() => staffSalaryAssignments.id, { onDelete: "restrict" }),
    // Snapshot of staff info at processing time
    staffName: text().notNull(),
    staffEmployeeId: text(),
    staffDesignation: text(),
    staffDepartment: text(),
    // Attendance breakdown
    workingDays: integer().notNull(),
    presentDays: integer().notNull(),
    paidLeaveDays: integer().notNull().default(0),
    unpaidLeaveDays: integer().notNull().default(0),
    // Totals
    totalEarningsInPaise: integer().notNull(),
    totalDeductionsInPaise: integer().notNull(),
    netPayInPaise: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("payslips_institution_idx").on(t.institutionId),
    index("payslips_payroll_run_idx").on(t.payrollRunId),
    index("payslips_staff_profile_idx").on(t.staffProfileId),
    unique("payslips_run_staff_unique").on(t.payrollRunId, t.staffProfileId),
  ],
);

export const payslipLineItems = pgTable(
  "payslip_line_items",
  {
    id: text().primaryKey(),
    payslipId: text()
      .notNull()
      .references(() => payslips.id, { onDelete: "restrict" }),
    salaryComponentId: text()
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    // Snapshot at processing time
    componentName: text().notNull(),
    componentType: text({ enum: SALARY_COMPONENT_TYPE_ENUM }).notNull(),
    amountInPaise: integer().notNull(),
  },
  (t) => [index("payslip_line_items_payslip_idx").on(t.payslipId)],
);

// ── Inventory ──────────────────────────────────────────────────────────────

export const inventoryCategories = pgTable(
  "inventory_categories",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    // Tier 2: active | inactive | deleted
    status: text({ enum: INVENTORY_CATEGORY_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("inventory_categories_institution_idx").on(t.institutionId),
    index("inventory_categories_status_idx").on(t.status),
    uniqueIndex("inventory_categories_name_unique_idx")
      .on(t.institutionId, t.name)
      .where(sql`${t.status} != 'deleted'`),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    categoryId: text()
      .notNull()
      .references(() => inventoryCategories.id, { onDelete: "restrict" }),
    name: text().notNull(),
    sku: text(),
    unit: text({ enum: INVENTORY_UNIT_ENUM }).notNull().default("piece"),
    currentStock: integer().notNull().default(0),
    minimumStock: integer().notNull().default(0),
    location: text(),
    purchasePriceInPaise: integer(),
    // Tier 2: active | inactive | deleted
    status: text({ enum: INVENTORY_ITEM_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("inventory_items_institution_idx").on(t.institutionId),
    index("inventory_items_category_idx").on(t.categoryId),
    index("inventory_items_status_idx").on(t.status),
    uniqueIndex("inventory_items_sku_unique_idx")
      .on(t.institutionId, t.sku)
      .where(sql`${t.sku} IS NOT NULL AND ${t.status} != 'deleted'`),
  ],
);

export const stockTransactions = pgTable(
  "stock_transactions",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    itemId: text()
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "restrict" }),
    transactionType: text({ enum: STOCK_TRANSACTION_TYPE_ENUM }).notNull(),
    quantity: integer().notNull(),
    referenceNumber: text(),
    issuedToMembershipId: text().references(() => member.id, {
      onDelete: "restrict",
    }),
    notes: text(),
    createdByMemberId: text()
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    index("stock_transactions_institution_idx").on(t.institutionId),
    index("stock_transactions_item_idx").on(t.itemId),
    index("stock_transactions_type_idx").on(t.transactionType),
    index("stock_transactions_created_at_idx").on(t.createdAt),
  ],
);

// ── Hostel ────────────────────────────────────────────────────────────────

export const hostelBuildings = pgTable(
  "hostel_buildings",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    buildingType: text({ enum: HOSTEL_BUILDING_TYPE_ENUM }).notNull(),
    campusId: text().references(() => campus.id, { onDelete: "set null" }),
    wardenMembershipId: text().references(() => member.id, {
      onDelete: "set null",
    }),
    capacity: integer().notNull().default(0),
    description: text(),
    // Tier 2: active | inactive | deleted
    status: text({ enum: HOSTEL_BUILDING_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (t) => [
    index("hostel_buildings_institution_idx").on(t.institutionId),
    index("hostel_buildings_status_idx").on(t.status),
    uniqueIndex("hostel_buildings_name_unique_idx")
      .on(t.institutionId, t.name)
      .where(sql`${t.status} != 'deleted'`),
  ],
);

export const hostelRooms = pgTable(
  "hostel_rooms",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    buildingId: text()
      .notNull()
      .references(() => hostelBuildings.id, { onDelete: "restrict" }),
    roomNumber: text().notNull(),
    floor: integer().notNull().default(0),
    roomType: text({ enum: HOSTEL_ROOM_TYPE_ENUM }).notNull(),
    capacity: integer().notNull().default(1),
    occupancy: integer().notNull().default(0),
    // Tier 3: active | inactive only — no delete
    status: text({ enum: HOSTEL_ROOM_STATUS_ENUM }).notNull().default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("hostel_rooms_institution_idx").on(t.institutionId),
    index("hostel_rooms_building_idx").on(t.buildingId),
    index("hostel_rooms_status_idx").on(t.status),
    uniqueIndex("hostel_rooms_number_unique_idx").on(
      t.buildingId,
      t.roomNumber,
    ),
  ],
);

export const bedAllocations = pgTable(
  "bed_allocations",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    roomId: text()
      .notNull()
      .references(() => hostelRooms.id, { onDelete: "restrict" }),
    studentId: text()
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    bedNumber: text().notNull(),
    startDate: date().notNull(),
    endDate: date(),
    status: text({ enum: BED_ALLOCATION_STATUS_ENUM })
      .notNull()
      .default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("bed_allocations_institution_idx").on(t.institutionId),
    index("bed_allocations_room_idx").on(t.roomId),
    index("bed_allocations_student_idx").on(t.studentId),
    index("bed_allocations_status_idx").on(t.status),
    uniqueIndex("bed_allocations_active_student_unique_idx")
      .on(t.studentId)
      .where(sql`${t.status} = 'active'`),
  ],
);

export const messPlans = pgTable(
  "mess_plans",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    monthlyFeeInPaise: integer().notNull(),
    description: text(),
    status: text({ enum: MESS_PLAN_STATUS_ENUM }).notNull().default("active"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("mess_plans_institution_idx").on(t.institutionId),
    index("mess_plans_status_idx").on(t.status),
    uniqueIndex("mess_plans_name_unique_idx").on(t.institutionId, t.name),
  ],
);
