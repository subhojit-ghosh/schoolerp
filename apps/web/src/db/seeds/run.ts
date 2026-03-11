import { db } from "@/db";
import { roles, permissions, rolePermissions } from "@/db/schema";
import { organization } from "@/db/schema/auth";
import { BUILT_IN_ROLES, BUILT_IN_PERMISSIONS, ROLE_PERMISSIONS, SEED_INSTITUTIONS } from "./index";

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

  console.log("Seeding institutions...");
  await db.insert(organization).values(SEED_INSTITUTIONS).onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
