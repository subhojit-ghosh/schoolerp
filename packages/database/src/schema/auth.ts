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
  id: text().primaryKey(),
  name: text().notNull(),
  mobile: text().notNull().unique(),
  email: text().unique(),
  passwordHash: text().notNull(),
  preferredContextKey: text({
    enum: ["staff", "parent", "student"],
  }),
  mobileVerifiedAt: timestamp(),
  emailVerifiedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organization = pgTable("organization", {
  id: text().primaryKey(),
  name: text().notNull(),
  shortName: text().notNull(),
  slug: text().notNull().unique(),
  institutionType: text(),
  logoUrl: text(),
  faviconUrl: text(),
  primaryColor: text().notNull(),
  accentColor: text().notNull(),
  sidebarColor: text().notNull(),
  fontHeading: text(),
  fontBody: text(),
  fontMono: text(),
  borderRadius: text({
    enum: ["sharp", "default", "rounded", "pill"],
  }),
  uiDensity: text({
    enum: ["compact", "default", "comfortable"],
  }),
  status: text({ enum: ["active", "suspended"] })
    .notNull()
    .default("active"),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
});

export const campus = pgTable(
  "campus",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull(),
    code: text(),
    isDefault: boolean().notNull().default(false),
    status: text({ enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: timestamp().defaultNow().notNull(),
    deletedAt: timestamp(),
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
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp().notNull(),
    ipAddress: text(),
    userAgent: text(),
    activeOrganizationId: text().references(() => organization.id, {
      onDelete: "set null",
    }),
    activeContextKey: text({
      enum: ["staff", "parent", "student"],
    }),
    activeCampusId: text().references(() => campus.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("session_user_idx").on(table.userId),
    index("session_org_idx").on(table.activeOrganizationId),
    index("session_context_idx").on(table.activeContextKey),
    index("session_campus_idx").on(table.activeCampusId),
  ],
);

export const passwordResetToken = pgTable(
  "password_reset_token",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text()
      .notNull()
      .unique("password_reset_token_token_hash_unique"),
    expiresAt: timestamp().notNull(),
    consumedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_token_user_idx").on(table.userId),
    index("password_reset_token_expires_idx").on(table.expiresAt),
    uniqueIndex("password_reset_token_active_user_unique_idx")
      .on(table.userId)
      .where(sql`${table.consumedAt} IS NULL`),
  ],
);

export const authRateLimitEvent = pgTable(
  "auth_rate_limit_event",
  {
    id: text().primaryKey(),
    action: text().notNull(),
    key: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("auth_rate_limit_action_key_idx").on(table.action, table.key),
    index("auth_rate_limit_created_at_idx").on(table.createdAt),
  ],
);

export const member = pgTable(
  "member",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    primaryCampusId: text().references(() => campus.id, {
      onDelete: "set null",
    }),
    memberType: text({
      enum: ["staff", "student", "guardian"],
    }).notNull(),
    status: text({ enum: ["active", "inactive", "suspended"] })
      .notNull()
      .default("active"),
    createdAt: timestamp().defaultNow().notNull(),
    deletedAt: timestamp(),
  },
  (table) => [
    index("member_organization_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
    index("member_primary_campus_idx").on(table.primaryCampusId),
    uniqueIndex("member_org_user_active_unique_idx")
      .on(table.organizationId, table.userId, table.memberType)
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
