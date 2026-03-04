import {
  pgTable,
  text,
  boolean,
  timestamp,
  date,
  primaryKey,
  unique,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organization, member } from "@/lib/auth-schema";

// --- Academic Years ---
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
  ],
);

// --- Roles ---
export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    roleType: text("role_type", {
      enum: ["platform", "system", "staff"],
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
    // For institution-scoped custom roles: slug must be unique per institution
    unique("roles_slug_institution_unique").on(t.slug, t.institutionId),
    // For global preset roles (institution_id IS NULL): slug must be globally unique
    // This partial unique index handles the NULL case (PostgreSQL NULL != NULL in unique constraints)
    uniqueIndex("roles_slug_global_unique_idx")
      .on(t.slug)
      .where(sql`institution_id IS NULL`),
  ],
);

// --- Permissions ---
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

// --- Role Permissions ---
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

// --- Membership Roles (temporal, multi-role per membership) ---
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

// --- Membership Role Scopes (v1: schema ready, empty) ---
export const membershipRoleScopes = pgTable("membership_role_scopes", {
  id: text("id").primaryKey(),
  membershipRoleId: text("membership_role_id")
    .notNull()
    .references(() => membershipRoles.id, { onDelete: "restrict" }),
  scopeType: text("scope_type", {
    enum: ["institution", "department", "class", "section"],
  }).notNull(),
  scopeId: text("scope_id").notNull(),
});

// --- Student Guardian Links ---
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
