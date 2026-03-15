import {
  boolean,
  date,
  integer,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { campus, member, organization } from "./auth";

const FEE_STRUCTURE_SCOPE_ENUM = ["institution", "campus"] as const;
const FEE_ASSIGNMENT_STATUS_ENUM = ["pending", "partial", "paid"] as const;
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
    invitedAt: timestamp().notNull().defaultNow(),
    acceptedAt: timestamp(),
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
    amountInPaise: integer().notNull(),
    dueDate: date().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("fee_structures_institution_idx").on(table.institutionId),
    index("fee_structures_academic_year_idx").on(table.academicYearId),
    index("fee_structures_campus_idx").on(table.campusId),
    uniqueIndex("fee_structures_name_scope_unique_idx")
      .on(table.institutionId, table.academicYearId, table.campusId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
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
    uniqueIndex("fee_assignments_student_structure_unique_idx")
      .on(table.studentId, table.feeStructureId)
      .where(sql`${table.deletedAt} IS NULL`),
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
