import {
  PERMISSIONS,
  ROLE_NAMES,
  ROLE_SLUGS,
  ROLE_TYPES,
  type PermissionSlug,
} from "@repo/contracts";
import { createHash } from "node:crypto";
import { permissions, rolePermissions, roles } from "./schema";
import { createDatabase, createPostgresClient } from "./client";

// Stable UUID derived from a namespace + slug using SHA-1.
// Re-running always produces the same ID — safe for idempotent upserts.
const SEED_NAMESPACE = "erp-platform-seed-v1";

function stableId(slug: string): string {
  const hex = createHash("sha1")
    .update(`${SEED_NAMESPACE}:${slug}`)
    .digest("hex")
    .slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

const ALL_PERMISSIONS: PermissionSlug[] = [
  PERMISSIONS.INSTITUTION_SETTINGS_READ,
  PERMISSIONS.INSTITUTION_SETTINGS_MANAGE,
  PERMISSIONS.INSTITUTION_ROLES_MANAGE,
  PERMISSIONS.INSTITUTION_USERS_MANAGE,
  PERMISSIONS.CAMPUS_READ,
  PERMISSIONS.CAMPUS_MANAGE,
  PERMISSIONS.ACADEMICS_READ,
  PERMISSIONS.ACADEMICS_MANAGE,
  PERMISSIONS.STUDENTS_READ,
  PERMISSIONS.STUDENTS_MANAGE,
  PERMISSIONS.GUARDIANS_READ,
  PERMISSIONS.GUARDIANS_MANAGE,
  PERMISSIONS.STAFF_READ,
  PERMISSIONS.STAFF_MANAGE,
  PERMISSIONS.ADMISSIONS_READ,
  PERMISSIONS.ADMISSIONS_MANAGE,
  PERMISSIONS.ATTENDANCE_READ,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.EXAMS_READ,
  PERMISSIONS.EXAMS_MANAGE,
  PERMISSIONS.MARKS_WRITE,
  PERMISSIONS.FEES_READ,
  PERMISSIONS.FEES_MANAGE,
  PERMISSIONS.FEES_COLLECT,
  PERMISSIONS.COMMUNICATION_READ,
  PERMISSIONS.COMMUNICATION_MANAGE,
];

type SystemRoleDef = {
  slug: string;
  name: string;
  permissions: PermissionSlug[];
};

const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    slug: ROLE_SLUGS.INSTITUTION_ADMIN,
    name: ROLE_NAMES.INSTITUTION_ADMIN,
    permissions: ALL_PERMISSIONS,
  },
  {
    slug: ROLE_SLUGS.SCHOOL_ADMIN,
    name: ROLE_NAMES.SCHOOL_ADMIN,
    permissions: ALL_PERMISSIONS.filter(
      (p) =>
        p !== PERMISSIONS.INSTITUTION_SETTINGS_MANAGE &&
        p !== PERMISSIONS.INSTITUTION_ROLES_MANAGE,
    ),
  },
  {
    slug: ROLE_SLUGS.ACADEMIC_COORDINATOR,
    name: ROLE_NAMES.ACADEMIC_COORDINATOR,
    permissions: [
      PERMISSIONS.CAMPUS_READ,
      PERMISSIONS.ACADEMICS_READ,
      PERMISSIONS.ACADEMICS_MANAGE,
      PERMISSIONS.ADMISSIONS_READ,
      PERMISSIONS.ADMISSIONS_MANAGE,
      PERMISSIONS.STUDENTS_READ,
      PERMISSIONS.GUARDIANS_READ,
      PERMISSIONS.ATTENDANCE_READ,
      PERMISSIONS.EXAMS_READ,
      PERMISSIONS.EXAMS_MANAGE,
      PERMISSIONS.MARKS_WRITE,
      PERMISSIONS.COMMUNICATION_READ,
      PERMISSIONS.COMMUNICATION_MANAGE,
    ],
  },
  {
    slug: ROLE_SLUGS.FINANCE_MANAGER,
    name: ROLE_NAMES.FINANCE_MANAGER,
    permissions: [
      PERMISSIONS.CAMPUS_READ,
      PERMISSIONS.ADMISSIONS_READ,
      PERMISSIONS.STUDENTS_READ,
      PERMISSIONS.FEES_READ,
      PERMISSIONS.FEES_MANAGE,
      PERMISSIONS.FEES_COLLECT,
    ],
  },
  {
    slug: ROLE_SLUGS.CLASS_TEACHER,
    name: ROLE_NAMES.CLASS_TEACHER,
    permissions: [
      PERMISSIONS.CAMPUS_READ,
      PERMISSIONS.ACADEMICS_READ,
      PERMISSIONS.STUDENTS_READ,
      PERMISSIONS.GUARDIANS_READ,
      PERMISSIONS.ATTENDANCE_READ,
      PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.EXAMS_READ,
      PERMISSIONS.MARKS_WRITE,
      PERMISSIONS.COMMUNICATION_READ,
    ],
  },
  {
    slug: ROLE_SLUGS.SUBJECT_TEACHER,
    name: ROLE_NAMES.SUBJECT_TEACHER,
    permissions: [
      PERMISSIONS.CAMPUS_READ,
      PERMISSIONS.ACADEMICS_READ,
      PERMISSIONS.ATTENDANCE_READ,
      PERMISSIONS.ATTENDANCE_WRITE,
      PERMISSIONS.EXAMS_READ,
      PERMISSIONS.MARKS_WRITE,
      PERMISSIONS.COMMUNICATION_READ,
    ],
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = createPostgresClient(databaseUrl);
  const db = createDatabase(client);

  try {
    // Seed permissions
    const permissionRows = ALL_PERMISSIONS.map((slug) => ({
      id: stableId(`permission:${slug}`),
      slug,
      description: null,
    }));

    await db
      .insert(permissions)
      .values(permissionRows)
      .onConflictDoNothing({ target: permissions.slug });

    console.log(`Seeded ${permissionRows.length} permissions`);

    // Seed system roles
    for (const role of SYSTEM_ROLES) {
      const roleId = stableId(`role:${role.slug}`);

      await db
        .insert(roles)
        .values({
          id: roleId,
          name: role.name,
          slug: role.slug,
          roleType: ROLE_TYPES.SYSTEM,
          institutionId: null,
          isSystem: true,
          isConfigurable: false,
        })
        .onConflictDoNothing();

      if (role.permissions.length > 0) {
        const rpRows = role.permissions.map((slug) => ({
          roleId,
          permissionId: stableId(`permission:${slug}`),
        }));

        await db.insert(rolePermissions).values(rpRows).onConflictDoNothing();
      }
    }

    console.log(`Seeded ${SYSTEM_ROLES.length} system roles`);
    console.log("Platform seed complete");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
