# Auth System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install and configure Better Auth with multi-tenant RBAC, tenant resolution middleware, and 2FA enforcement as specified in the auth user types design.

**Architecture:** Better Auth manages users/sessions/accounts/verifications/organizations/invitations. Custom Drizzle tables extend it with: academic_years, roles (3-type engine), membership_roles (temporal), membership_role_scopes (v1 empty), student_guardian_links, permissions, role_permissions. Next.js middleware resolves tenant from subdomain → institution, validates membership, enforces 2FA before resolving permissions.

**Tech Stack:** Better Auth, Drizzle ORM, PostgreSQL (pg driver), Next.js 16 App Router, Bun test runner, TypeScript

**Design doc:** `docs/plans/2026-03-04-auth-user-types-design.md`

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Better Auth and database packages**

```bash
bun add better-auth drizzle-orm postgres
bun add -d drizzle-kit @types/pg
```

**Step 2: Verify installation**

```bash
bun run typecheck
```

Expected: passes (or only pre-existing errors)

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: install better-auth, drizzle-orm, postgres"
```

---

## Task 2: Environment setup

**Files:**
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Create `.env.local`**

```bash
# .env.local (never committed)
DATABASE_URL=postgresql://postgres:password@localhost:5432/academic_platform
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
```

**Step 2: Create `.env.example`** (committed, no secrets)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/academic_platform
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

**Step 3: Add `.env.local` to `.gitignore`**

Check `.gitignore` already contains `.env.local` (Next.js default includes it). If not, add it.

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment variable template"
```

---

## Task 3: Create Drizzle database connection

**Files:**
- Create: `src/lib/db.ts`
- Create: `drizzle.config.ts`

**Step 1: Create `src/lib/db.ts`**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);
```

**Step 2: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

Expected: passes

**Step 4: Commit**

```bash
git add src/lib/db.ts drizzle.config.ts
git commit -m "feat: add drizzle database connection"
```

---

## Task 4: Write pure permission logic with tests (TDD)

**Files:**
- Create: `src/lib/auth/permissions.ts`
- Create: `src/lib/auth/permissions.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/auth/permissions.test.ts
import { describe, expect, test } from "bun:test";
import {
  resolvePermissions,
  checkPermission,
  requires2FA,
  isValidPermissionSlug,
} from "./permissions";

describe("resolvePermissions", () => {
  test("returns union of permissions across multiple roles", () => {
    const roles = [
      { permissions: ["fees:read", "fees:write"] },
      { permissions: ["students:read", "fees:read"] },
    ];
    const result = resolvePermissions(roles);
    expect(result).toEqual(new Set(["fees:read", "fees:write", "students:read"]));
  });

  test("returns empty set when no roles", () => {
    expect(resolvePermissions([])).toEqual(new Set());
  });

  test("returns empty set when roles have no permissions", () => {
    expect(resolvePermissions([{ permissions: [] }])).toEqual(new Set());
  });
});

describe("checkPermission", () => {
  test("returns true when permission exists in set", () => {
    const perms = new Set(["fees:read", "students:write"]);
    expect(checkPermission(perms, "fees:read")).toBe(true);
  });

  test("returns false (default deny) when permission not in set", () => {
    const perms = new Set(["fees:read"]);
    expect(checkPermission(perms, "fees:write")).toBe(false);
  });

  test("returns false on empty permission set (default deny)", () => {
    expect(checkPermission(new Set(), "fees:read")).toBe(false);
  });
});

describe("requires2FA", () => {
  test("returns true when any role is platform type", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "platform", slug: "super_admin" },
    ];
    expect(requires2FA(roles)).toBe(true);
  });

  test("returns true when any role is system institution_admin", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "system", slug: "institution_admin" },
    ];
    expect(requires2FA(roles)).toBe(true);
  });

  test("returns false for staff-only roles", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "staff", slug: "accountant" },
    ];
    expect(requires2FA(roles)).toBe(false);
  });

  test("returns false for system roles that are not institution_admin", () => {
    const roles = [{ role_type: "system", slug: "student" }];
    expect(requires2FA(roles)).toBe(false);
  });

  test("returns false for empty roles", () => {
    expect(requires2FA([])).toBe(false);
  });
});

describe("isValidPermissionSlug", () => {
  test("accepts valid resource:action format", () => {
    expect(isValidPermissionSlug("fees:read")).toBe(true);
    expect(isValidPermissionSlug("attendance:write")).toBe(true);
  });

  test("rejects slugs without colon", () => {
    expect(isValidPermissionSlug("feesread")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isValidPermissionSlug("")).toBe(false);
  });

  test("rejects multiple colons", () => {
    expect(isValidPermissionSlug("fees:read:extra")).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
bun test src/lib/auth/permissions.test.ts
```

Expected: FAIL — "Cannot find module './permissions'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/auth/permissions.ts

export type RoleForPermissions = {
  permissions: string[];
};

export type RoleFor2FA = {
  role_type: string;
  slug: string;
};

/** Union all permissions across all active roles. Default deny — empty set = no access. */
export function resolvePermissions(roles: RoleForPermissions[]): Set<string> {
  const set = new Set<string>();
  for (const role of roles) {
    for (const perm of role.permissions) {
      set.add(perm);
    }
  }
  return set;
}

/** Default deny: returns false if permission not in set. */
export function checkPermission(permissionSet: Set<string>, slug: string): boolean {
  return permissionSet.has(slug);
}

/**
 * Returns true if ANY resolved role requires 2FA enforcement.
 * Rule: role_type='platform' OR (role_type='system' AND slug='institution_admin')
 */
export function requires2FA(roles: RoleFor2FA[]): boolean {
  return roles.some(
    (r) =>
      r.role_type === "platform" ||
      (r.role_type === "system" && r.slug === "institution_admin"),
  );
}

/** Permission slugs must be 'resource:action' with exactly one colon. */
export function isValidPermissionSlug(slug: string): boolean {
  if (!slug) return false;
  const parts = slug.split(":");
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
```

**Step 4: Run tests to verify they pass**

```bash
bun test src/lib/auth/permissions.test.ts
```

Expected: all PASS

**Step 5: Typecheck**

```bash
bun run typecheck
```

**Step 6: Commit**

```bash
git add src/lib/auth/permissions.ts src/lib/auth/permissions.test.ts
git commit -m "feat: add permission resolution and 2FA check logic with tests"
```

---

## Task 5: Write Drizzle schema

**Files:**
- Create: `src/lib/schema.ts`

This schema covers both Better Auth tables (generated via CLI, then committed) and our custom extension tables.

**Step 1: Generate Better Auth base schema**

```bash
bunx @better-auth/cli generate --output src/lib/auth-schema.ts
```

Review the generated file. It will contain: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` tables.

**Step 2: Create `src/lib/schema.ts`** — custom extension tables

```typescript
// src/lib/schema.ts
import { pgTable, text, boolean, timestamp, date, primaryKey, unique, index } from "drizzle-orm/pg-core";

// --- Academic Years ---
export const academicYears = pgTable(
  "academic_years",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id").notNull(), // references Better Auth organization.id
    name: text("name").notNull(), // e.g. "2024-25"
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("academic_years_institution_idx").on(t.institutionId),
    index("academic_years_institution_current_idx").on(t.institutionId, t.isCurrent),
    // Only one current year per institution (partial unique — enforced in app + DB trigger)
  ],
);

// --- Roles ---
export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    roleType: text("role_type", { enum: ["platform", "system", "staff"] }).notNull(),
    institutionId: text("institution_id"), // null = global preset
    isSystem: boolean("is_system").notNull().default(false),
    isConfigurable: boolean("is_configurable").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    // Slug unique per namespace (null institution_id = global namespace)
    unique("roles_slug_institution_unique").on(t.slug, t.institutionId),
  ],
);

// --- Permissions ---
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(), // e.g. "fees:read"
  description: text("description"),
});

// --- Role Permissions ---
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id").notNull(), // references roles.id
    permissionId: text("permission_id").notNull(), // references permissions.id
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

// --- Membership Roles (temporal, multi-role per membership) ---
// membership_id references Better Auth member.id
export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id").notNull(), // Better Auth member.id
    roleId: text("role_id").notNull(),
    validFrom: date("valid_from").notNull(),
    validTo: date("valid_to"), // null = currently active
    academicYearId: text("academic_year_id"), // FK to academic_years.id
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
  membershipRoleId: text("membership_role_id").notNull(),
  scopeType: text("scope_type", {
    enum: ["institution", "department", "class", "section"],
  }).notNull(),
  scopeId: text("scope_id").notNull(), // FK resolved at query time
});

// --- Student Guardian Links ---
export const studentGuardianLinks = pgTable(
  "student_guardian_links",
  {
    id: text("id").primaryKey(),
    studentMembershipId: text("student_membership_id").notNull(), // Better Auth member.id
    parentMembershipId: text("parent_membership_id").notNull(),   // Better Auth member.id
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
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add src/lib/schema.ts src/lib/auth-schema.ts
git commit -m "feat: add drizzle schema for roles, permissions, and academic year tables"
```

---

## Task 6: Configure Better Auth server

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create `src/lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  // Extend user with super_admin flag
  user: {
    additionalFields: {
      isSuperAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // cannot be set by user
      },
    },
  },

  plugins: [
    // Multi-tenancy: each institution = one organization
    organization({
      // Extend organization with institution-specific fields
      schema: {
        organization: {
          additionalFields: {
            institutionType: {
              type: "string",  // "school" | "college"
              required: false,
            },
            status: {
              type: "string",  // "active" | "suspended"
              required: false,
              defaultValue: "active",
            },
          },
        },
      },
      dynamicAccessControl: {
        enabled: true,
      },
    }),

    // 2FA — enforced per role in middleware, optional for others
    twoFactor(),
  ],
});
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: configure better-auth server with organization and 2FA plugins"
```

---

## Task 7: Create Next.js API route handler

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`

**Step 1: Create the route file**

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app/api/auth/[...all]/route.ts
git commit -m "feat: add better-auth next.js api route handler"
```

---

## Task 8: Create auth client

**Files:**
- Create: `src/lib/auth-client.ts`

**Step 1: Create `src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [
    organizationClient(),

    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/auth/2fa";
      },
    }),
  ],
});

// Named exports for convenience
export const { signIn, signOut, signUp, useSession } = authClient;
```

**Step 2: Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `.env.example`**

```bash
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add src/lib/auth-client.ts .env.example
git commit -m "feat: add better-auth client with organization and 2FA plugins"
```

---

## Task 9: Run database migrations

**Step 1: Ensure PostgreSQL is running locally**

```bash
psql -U postgres -c "CREATE DATABASE academic_platform;" 2>/dev/null || echo "already exists"
```

**Step 2: Generate Better Auth tables migration**

```bash
bunx @better-auth/cli migrate
```

This runs Better Auth's own migration for: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `twoFactor` tables.

**Step 3: Generate Drizzle migration for custom tables**

```bash
bunx drizzle-kit generate
```

Expected output: migration file created in `./drizzle/`

**Step 4: Apply the migration**

```bash
bunx drizzle-kit migrate
```

**Step 5: Verify tables exist**

```bash
psql $DATABASE_URL -c "\dt"
```

Expected: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `two_factor`, `academic_years`, `roles`, `permissions`, `role_permissions`, `membership_roles`, `membership_role_scopes`, `student_guardian_links`

**Step 6: Commit migration files**

```bash
git add drizzle/
git commit -m "chore: add initial database migration"
```

---

## Task 10: Write role and permission seed script with tests (TDD)

**Files:**
- Create: `src/lib/auth/seed.test.ts`
- Create: `src/lib/auth/seed.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/auth/seed.test.ts
import { describe, expect, test } from "bun:test";
import { BUILT_IN_ROLES, BUILT_IN_PERMISSIONS, ROLE_PERMISSIONS } from "./seed";

describe("BUILT_IN_ROLES", () => {
  test("contains exactly 9 built-in roles", () => {
    expect(BUILT_IN_ROLES).toHaveLength(9);
  });

  test("all platform roles have institution_id null", () => {
    const platformRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "platform");
    expect(platformRoles.every((r) => r.institutionId === null)).toBe(true);
  });

  test("all system roles have is_system true and is_configurable false", () => {
    const systemRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "system");
    expect(systemRoles.every((r) => r.isSystem && !r.isConfigurable)).toBe(true);
  });

  test("all staff preset roles have is_system false and is_configurable true", () => {
    const staffRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "staff");
    expect(staffRoles.every((r) => !r.isSystem && r.isConfigurable)).toBe(true);
  });

  test("super_admin, institution_admin, student, parent are present as system/platform", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(slugs).toContain("super_admin");
    expect(slugs).toContain("institution_admin");
    expect(slugs).toContain("student");
    expect(slugs).toContain("parent");
  });

  test("no duplicate slugs in built-in roles", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("BUILT_IN_PERMISSIONS", () => {
  test("all permission slugs are valid resource:action format", () => {
    const { isValidPermissionSlug } = require("./permissions");
    expect(BUILT_IN_PERMISSIONS.every((p) => isValidPermissionSlug(p.slug))).toBe(true);
  });

  test("no duplicate permission slugs", () => {
    const slugs = BUILT_IN_PERMISSIONS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("ROLE_PERMISSIONS", () => {
  test("institution_admin has all permissions", () => {
    const allSlugs = new Set(BUILT_IN_PERMISSIONS.map((p) => p.slug));
    const adminPerms = new Set(ROLE_PERMISSIONS["institution_admin"]);
    expect([...allSlugs].every((s) => adminPerms.has(s))).toBe(true);
  });

  test("student only has students:read", () => {
    expect(ROLE_PERMISSIONS["student"]).toEqual(["students:read"]);
  });

  test("principal does not have roles:manage or members:invite", () => {
    const perms = ROLE_PERMISSIONS["principal"];
    expect(perms).not.toContain("roles:manage");
    expect(perms).not.toContain("members:invite");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
bun test src/lib/auth/seed.test.ts
```

Expected: FAIL

**Step 3: Write seed data**

```typescript
// src/lib/auth/seed.ts
import { isValidPermissionSlug } from "./permissions";

export type BuiltInRole = {
  id: string;
  name: string;
  slug: string;
  roleType: "platform" | "system" | "staff";
  institutionId: null;
  isSystem: boolean;
  isConfigurable: boolean;
};

export const BUILT_IN_ROLES: BuiltInRole[] = [
  // Platform
  { id: "role_super_admin", name: "Super Admin", slug: "super_admin", roleType: "platform", institutionId: null, isSystem: true, isConfigurable: false },
  // System
  { id: "role_institution_admin", name: "Institution Admin", slug: "institution_admin", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_student", name: "Student", slug: "student", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_parent", name: "Parent", slug: "parent", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  // Staff presets
  { id: "role_principal", name: "Principal", slug: "principal", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_teacher", name: "Teacher", slug: "teacher", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_accountant", name: "Accountant", slug: "accountant", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_librarian", name: "Librarian", slug: "librarian", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_receptionist", name: "Receptionist", slug: "receptionist", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
];

export const BUILT_IN_PERMISSIONS = [
  // Fees
  { id: "perm_fees_read",        slug: "fees:read",        description: "View fee records" },
  { id: "perm_fees_write",       slug: "fees:write",       description: "Create and update fee records" },
  { id: "perm_fees_delete",      slug: "fees:delete",      description: "Delete fee records" },
  // Attendance
  { id: "perm_attendance_read",  slug: "attendance:read",  description: "View attendance records" },
  { id: "perm_attendance_write", slug: "attendance:write", description: "Mark and update attendance" },
  // Students
  { id: "perm_students_read",    slug: "students:read",    description: "View student records" },
  { id: "perm_students_write",   slug: "students:write",   description: "Create and update student records" },
  { id: "perm_students_delete",  slug: "students:delete",  description: "Delete student records" },
  // Grades
  { id: "perm_grades_read",      slug: "grades:read",      description: "View grades" },
  { id: "perm_grades_write",     slug: "grades:write",     description: "Enter and update grades" },
  // Administration
  { id: "perm_roles_manage",     slug: "roles:manage",     description: "Create and manage roles" },
  { id: "perm_members_invite",   slug: "members:invite",   description: "Invite new members to institution" },
  { id: "perm_reports_export",   slug: "reports:export",   description: "Export reports" },
  // Library
  { id: "perm_library_read",     slug: "library:read",     description: "View library records" },
  { id: "perm_library_write",    slug: "library:write",    description: "Manage library records" },
  // Admissions
  { id: "perm_admissions_read",  slug: "admissions:read",  description: "View admission records" },
  { id: "perm_admissions_write", slug: "admissions:write", description: "Process admissions" },
] satisfies { id: string; slug: string; description: string }[];

const ALL_PERMISSION_SLUGS = BUILT_IN_PERMISSIONS.map((p) => p.slug);

// Record<role_slug, permission_slugs[]>
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  institution_admin: ALL_PERMISSION_SLUGS,
  principal: ALL_PERMISSION_SLUGS.filter(
    (s) => s !== "roles:manage" && s !== "members:invite",
  ),
  teacher: ["attendance:write", "students:read", "grades:read", "grades:write"],
  accountant: ["fees:read", "fees:write", "reports:export"],
  librarian: ["library:read", "library:write"],
  receptionist: ["students:read", "admissions:read"],
  student: ["students:read"],
  parent: ["students:read", "grades:read", "attendance:read", "fees:read"],
  super_admin: [], // super_admin bypasses permission resolution entirely
};
```

**Step 4: Run tests**

```bash
bun test src/lib/auth/seed.test.ts
```

Expected: all PASS

**Step 5: Write seed runner**

```typescript
// src/lib/auth/run-seed.ts
import { db } from "@/lib/db";
import { roles, permissions, rolePermissions } from "@/lib/schema";
import { BUILT_IN_ROLES, BUILT_IN_PERMISSIONS, ROLE_PERMISSIONS } from "./seed";

async function runSeed() {
  console.log("Seeding roles...");
  await db.insert(roles).values(BUILT_IN_ROLES).onConflictDoNothing();

  console.log("Seeding permissions...");
  await db.insert(permissions).values(BUILT_IN_PERMISSIONS).onConflictDoNothing();

  console.log("Seeding role_permissions...");
  for (const [roleSlug, permSlugs] of Object.entries(ROLE_PERMISSIONS)) {
    const role = BUILT_IN_ROLES.find((r) => r.slug === roleSlug);
    if (!role) continue;

    for (const permSlug of permSlugs) {
      const perm = BUILT_IN_PERMISSIONS.find((p) => p.slug === permSlug);
      if (!perm) continue;

      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 6: Add seed script to package.json**

```json
"scripts": {
  "seed": "bun run src/lib/auth/run-seed.ts"
}
```

**Step 7: Run seed (requires running DB)**

```bash
bun run seed
```

**Step 8: Typecheck**

```bash
bun run typecheck
```

**Step 9: Commit**

```bash
git add src/lib/auth/seed.ts src/lib/auth/seed.test.ts src/lib/auth/run-seed.ts package.json
git commit -m "feat: add role/permission seed data with tests"
```

---

## Task 11: Write tenant resolution middleware

**Files:**
- Create: `src/lib/auth/tenant.ts`
- Create: `src/lib/auth/tenant.test.ts`
- Modify: `src/middleware.ts`

**Step 1: Write failing tests for tenant utilities**

```typescript
// src/lib/auth/tenant.test.ts
import { describe, expect, test } from "bun:test";
import { resolveInstitutionFromRequest } from "./tenant";

describe("resolveInstitutionFromRequest", () => {
  test("extracts slug from subdomain", () => {
    const url = new URL("https://school-a.erp.com/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBe("school-a");
  });

  test("falls back to X-Institution-Id header when no subdomain", () => {
    const url = new URL("http://localhost:3000/dashboard");
    const slug = resolveInstitutionFromRequest(url, "school-b");
    expect(slug).toBe("school-b");
  });

  test("returns null when neither subdomain nor header present", () => {
    const url = new URL("http://localhost:3000/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });

  test("ignores www subdomain", () => {
    const url = new URL("https://www.erp.com/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
bun test src/lib/auth/tenant.test.ts
```

**Step 3: Write tenant utilities**

```typescript
// src/lib/auth/tenant.ts

const IGNORED_SUBDOMAINS = new Set(["www", "api", "app"]);
const ROOT_DOMAINS = new Set(["localhost", "erp.com"]); // extend for your domain

/**
 * Resolves institution slug from subdomain or X-Institution-Id header.
 * Subdomain takes precedence (subdomain-first strategy).
 */
export function resolveInstitutionFromRequest(
  url: URL,
  institutionIdHeader: string | null,
): string | null {
  const host = url.hostname;
  const parts = host.split(".");

  // Subdomain detection: hostname has 3+ parts and first part isn't ignored
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!IGNORED_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }

  // Fallback to header (for API clients)
  return institutionIdHeader ?? null;
}
```

**Step 4: Run tests**

```bash
bun test src/lib/auth/tenant.test.ts
```

Expected: all PASS

**Step 5: Create `src/middleware.ts`**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveInstitutionFromRequest } from "@/lib/auth/tenant";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/auth", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public routes
  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 1. Validate session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // 2. Resolve institution context
  const institutionSlug = resolveInstitutionFromRequest(
    request.nextUrl,
    request.headers.get("x-institution-id"),
  );

  // For org-scoped routes: institution is required
  const isOrgScopedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/app");
  if (isOrgScopedRoute && !institutionSlug) {
    return NextResponse.json({ error: "Institution context required" }, { status: 400 });
  }

  // Pass resolved context to route handlers via headers
  const response = NextResponse.next();
  if (institutionSlug) {
    response.headers.set("x-institution-slug", institutionSlug);
  }
  response.headers.set("x-user-id", session.user.id);

  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

Note: Full membership validation, role resolution, 2FA enforcement, and academic year resolution happen in route handlers / server actions using the `requireOrgAccess` helper (next task), not in middleware. Middleware handles only session + institution slug resolution for performance.

**Step 6: Typecheck**

```bash
bun run typecheck
```

**Step 7: Commit**

```bash
git add src/lib/auth/tenant.ts src/lib/auth/tenant.test.ts src/middleware.ts
git commit -m "feat: add tenant resolution middleware and utilities with tests"
```

---

## Task 12: Write `requireOrgAccess` server-side helper

**Files:**
- Create: `src/lib/auth/require-org-access.ts`

This is the function that route handlers call to enforce the full 9-step middleware chain (membership, roles, 2FA, academic year, permissions).

**Step 1: Create `src/lib/auth/require-org-access.ts`**

```typescript
// src/lib/auth/require-org-access.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roles, membershipRoles, academicYears, permissions, rolePermissions } from "@/lib/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { requires2FA, resolvePermissions, checkPermission } from "./permissions";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 500,
  ) {
    super(message);
  }
}

export type OrgContext = {
  userId: string;
  institutionId: string;
  membershipId: string;
  currentAcademicYearId: string;
  roles: Array<{ id: string; slug: string; roleType: string }>;
  permissionSet: Set<string>;
  isSuperAdmin: boolean;
};

/**
 * Resolves and validates org-scoped access for the current request.
 * Must be called at the top of every org-scoped server action or route handler.
 * Permission checks must execute before data queries are constructed.
 */
export async function requireOrgAccess(institutionSlug: string): Promise<OrgContext> {
  const h = await headers();

  // 1. Validate session
  const session = await auth.api.getSession({ headers: h });
  if (!session) throw new AuthError("Unauthorized", 401);

  const userId = session.user.id;
  const isSuperAdmin = (session.user as any).isSuperAdmin === true;

  // 2. Resolve institution by slug
  const org = await auth.api.getOrganization({ query: { slug: institutionSlug } }).catch(() => null);
  if (!org || (org as any).status === "suspended") {
    // Generic 403 — never reveal whether institution exists or is suspended
    throw new AuthError("Forbidden", 403);
  }

  const institutionId = org.id;

  // 3. super_admin shortcut — bypasses membership/role/permission resolution
  if (isSuperAdmin) {
    return {
      userId,
      institutionId,
      membershipId: "",
      currentAcademicYearId: "",
      roles: [],
      permissionSet: new Set(["*"]), // sentinel: super_admin has all permissions
      isSuperAdmin: true,
    };
  }

  // 4. Validate membership
  const member = await auth.api
    .getActiveMember({ query: { organizationId: institutionId } }, { headers: h })
    .catch(() => null);
  if (!member) throw new AuthError("Forbidden", 403);

  const membershipId = member.id;

  // 5. Resolve active membership roles
  const activeRoleRows = await db
    .select({ roleId: membershipRoles.roleId })
    .from(membershipRoles)
    .where(
      and(
        eq(membershipRoles.membershipId, membershipId),
        isNull(membershipRoles.validTo),
        isNull(membershipRoles.deletedAt),
      ),
    );

  if (activeRoleRows.length === 0) throw new AuthError("Forbidden", 403);

  const roleIds = activeRoleRows.map((r) => r.roleId);
  const resolvedRoles = await db
    .select({ id: roles.id, slug: roles.slug, roleType: roles.roleType })
    .from(roles)
    .where(and(inArray(roles.id, roleIds), isNull(roles.deletedAt)));

  // 6. Enforce 2FA before resolving permissions
  if (requires2FA(resolvedRoles.map((r) => ({ role_type: r.roleType, slug: r.slug })))) {
    // Better Auth tracks 2FA verification in session
    if (!(session as any).twoFactorVerified) {
      throw new AuthError("2FA required", 401);
    }
  }

  // 7. Resolve current academic year
  const [currentYear] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.institutionId, institutionId),
        eq(academicYears.isCurrent, true),
        isNull(academicYears.deletedAt),
      ),
    )
    .limit(1);

  if (!currentYear) {
    throw new AuthError("Institution has no current academic year configured", 500);
  }

  // 8. Resolve permissions (request-scoped, default deny)
  const permRows = await db
    .select({ slug: permissions.slug })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(rolePermissions.roleId, roleIds));

  const permissionSet = resolvePermissions([
    { permissions: permRows.map((p) => p.slug) },
  ]);

  return {
    userId,
    institutionId,
    membershipId,
    currentAcademicYearId: currentYear.id,
    roles: resolvedRoles,
    permissionSet,
    isSuperAdmin: false,
  };
}

/**
 * Asserts a permission is present. Throws 403 if not.
 * MUST be called before constructing any data query.
 */
export function assertPermission(ctx: OrgContext, permissionSlug: string): void {
  if (ctx.isSuperAdmin) return; // super_admin bypasses permission checks
  if (!checkPermission(ctx.permissionSet, permissionSlug)) {
    throw new AuthError(`Missing permission: ${permissionSlug}`, 403);
  }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/auth/require-org-access.ts
git commit -m "feat: add requireOrgAccess helper for server-side authorization"
```

---

## Task 13: Run all tests

**Step 1: Run full test suite**

```bash
bun test
```

Expected: all tests PASS

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors

**Step 3: Final commit if any loose files**

```bash
git status
```

If clean, done. If any unstaged: commit with appropriate message.

---

## Done

The auth system is now set up with:

- `src/lib/auth.ts` — Better Auth server with organization + 2FA plugins
- `src/lib/auth-client.ts` — Auth client with organization + 2FA clients
- `src/lib/schema.ts` — Custom Drizzle tables (roles, permissions, academic years, etc.)
- `src/lib/auth/permissions.ts` — Pure permission logic (tested)
- `src/lib/auth/seed.ts` — Built-in roles and permissions (tested)
- `src/lib/auth/run-seed.ts` — Seed runner script
- `src/lib/auth/tenant.ts` — Tenant resolution utilities (tested)
- `src/middleware.ts` — Next.js middleware for session + institution slug resolution
- `src/lib/auth/require-org-access.ts` — Full 9-step auth chain for route handlers
- `drizzle/` — Database migrations
