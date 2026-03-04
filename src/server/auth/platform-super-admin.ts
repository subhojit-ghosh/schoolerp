import "server-only";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/auth-schema";
import type { InitialSuperAdminValues } from "@/lib/auth/initial-super-admin-form";

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
  if (await hasAnySuperAdmin()) {
    throw new Error("Platform setup has already been completed.");
  }

  const [existingUser] = await db
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

  const [promotedUser] = await db
    .update(user)
    .set({ isSuperAdmin: true })
    .where(eq(user.email, values.email))
    .returning({ id: user.id });

  if (!promotedUser) {
    throw new Error("Failed to create the initial platform super admin.");
  }
}
