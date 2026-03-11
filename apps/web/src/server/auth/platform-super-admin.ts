import "server-only";

import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { SYSTEM_LOCKS } from "@/constants";
import { user } from "@/db/schema/auth";
import type { InitialSuperAdminValues } from "@/lib/platform/setup";

export async function hasAnySuperAdmin(): Promise<boolean> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.isSuperAdmin, true))
    .limit(1);

  return existing.length > 0;
}

export async function createInitialSuperAdmin(
  values: InitialSuperAdminValues,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${SYSTEM_LOCKS.INITIAL_SUPER_ADMIN_SETUP})`,
    );

    const [existingSuperAdmin] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.isSuperAdmin, true))
      .limit(1);

    if (existingSuperAdmin) {
      throw new Error("Platform setup has already been completed.");
    }

    const [existingUser] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, values.email))
      .limit(1);

    if (!existingUser) {
      await auth.api.signUpEmail({
        body: {
          email: values.email,
          name: values.name,
          password: values.password,
        },
      });
    }

    const [promotedUser] = await tx
      .update(user)
      .set({ isSuperAdmin: true })
      .where(eq(user.email, values.email))
      .returning({ id: user.id });

    if (!promotedUser) {
      throw new Error("Failed to create the initial platform super admin.");
    }
  });
}
