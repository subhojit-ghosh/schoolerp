import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  mobileVerifiedAt: timestamp("mobile_verified_at"),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  slug: text("slug").notNull().unique(),
  institutionType: text("institution_type"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull(),
  accentColor: text("accent_color").notNull(),
  sidebarColor: text("sidebar_color").notNull(),
  status: text("status", { enum: ["active", "suspended"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const campus = pgTable(
  "campus",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    code: text("code"),
    isDefault: boolean("is_default").notNull().default(false),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("campus_organization_idx").on(table.organizationId),
    uniqueIndex("campus_slug_org_unique_idx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("campus_single_default_per_org_idx")
      .on(table.organizationId)
      .where(sql`${table.isDefault} IS TRUE AND ${table.deletedAt} IS NULL`),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeOrganizationId: text("active_organization_id").references(
      () => organization.id,
      { onDelete: "set null" },
    ),
    activeCampusId: text("active_campus_id").references(() => campus.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("session_user_idx").on(table.userId),
    index("session_org_idx").on(table.activeOrganizationId),
    index("session_campus_idx").on(table.activeCampusId),
  ],
);

export const passwordResetToken = pgTable(
  "password_reset_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_token_user_idx").on(table.userId),
    index("password_reset_token_expires_idx").on(table.expiresAt),
    uniqueIndex("password_reset_token_active_user_unique_idx")
      .on(table.userId)
      .where(sql`${table.consumedAt} IS NULL`),
  ],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    primaryCampusId: text("primary_campus_id").references(() => campus.id, {
      onDelete: "set null",
    }),
    memberType: text("member_type", {
      enum: ["staff", "student", "guardian"],
    }).notNull(),
    status: text("status", { enum: ["active", "inactive", "suspended"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("member_organization_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
    index("member_primary_campus_idx").on(table.primaryCampusId),
    uniqueIndex("member_org_user_active_unique_idx")
      .on(table.organizationId, table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  memberships: many(member),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  campuses: many(campus),
  memberships: many(member),
}));

export const campusRelations = relations(campus, ({ one, many }) => ({
  organization: one(organization, {
    fields: [campus.organizationId],
    references: [organization.id],
  }),
  memberships: many(member),
  sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  activeOrganization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
  activeCampus: one(campus, {
    fields: [session.activeCampusId],
    references: [campus.id],
  }),
}));

export const passwordResetTokenRelations = relations(
  passwordResetToken,
  ({ one }) => ({
    user: one(user, {
      fields: [passwordResetToken.userId],
      references: [user.id],
    }),
  }),
);

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  primaryCampus: one(campus, {
    fields: [member.primaryCampusId],
    references: [campus.id],
  }),
}));
