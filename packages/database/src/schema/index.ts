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

export const academicYears = pgTable(
  "academic_years",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("academic_years_institution_idx").on(t.institutionId),
    index("academic_years_institution_current_idx").on(
      t.institutionId,
      t.isCurrent,
    ),
    uniqueIndex("academic_years_single_current_per_institution_idx")
      .on(t.institutionId)
      .where(sql`${t.isCurrent} IS TRUE AND ${t.deletedAt} IS NULL`),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    roleType: text("role_type", {
      enum: ["platform", "system", "institution"],
    }).notNull(),
    institutionId: text("institution_id").references(() => organization.id, {
      onDelete: "restrict",
    }),
    isSystem: boolean("is_system").notNull().default(false),
    isConfigurable: boolean("is_configurable").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    unique("roles_slug_institution_unique").on(t.slug, t.institutionId),
    uniqueIndex("roles_slug_global_unique_idx")
      .on(t.slug)
      .where(sql`institution_id IS NULL`),
  ],
);

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id")
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to"),
    academicYearId: text("academic_year_id").references(() => academicYears.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("membership_roles_membership_idx").on(t.membershipId),
    index("membership_roles_role_idx").on(t.roleId),
    index("membership_roles_valid_to_idx").on(t.validTo),
  ],
);

export const membershipRoleScopes = pgTable("membership_role_scopes", {
  id: text("id").primaryKey(),
  membershipRoleId: text("membership_role_id")
    .notNull()
    .references(() => membershipRoles.id, { onDelete: "restrict" }),
  scopeType: text("scope_type", {
    enum: ["institution", "campus", "department", "class", "section"],
  }).notNull(),
  scopeId: text("scope_id").notNull(),
});

export const campusMemberships = pgTable(
  "campus_memberships",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    campusId: text("campus_id")
      .notNull()
      .references(() => campus.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
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
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    membershipId: text("membership_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    admissionNumber: text("admission_number").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
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
  ],
);

export const studentGuardianLinks = pgTable(
  "student_guardian_links",
  {
    id: text("id").primaryKey(),
    studentMembershipId: text("student_membership_id")
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    parentMembershipId: text("parent_membership_id")
      .notNull()
      .references(() => member.id, { onDelete: "restrict" }),
    relationship: text("relationship", {
      enum: ["father", "mother", "guardian"],
    }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    invitedAt: timestamp("invited_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("sgl_student_idx").on(t.studentMembershipId),
    index("sgl_parent_idx").on(t.parentMembershipId),
  ],
);

export const examTerms = pgTable(
  "exam_terms",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    academicYearId: text("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
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
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    examTermId: text("exam_term_id")
      .notNull()
      .references(() => examTerms.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectName: text("subject_name").notNull(),
    maxMarks: integer("max_marks").notNull(),
    obtainedMarks: integer("obtained_marks").notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
