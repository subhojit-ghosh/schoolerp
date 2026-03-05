"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { ROUTES, STATUS } from "@/constants";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { createInstitutionSchema, updateInstitutionSchema } from "./schemas";

type ActionResult = { error: string } | { success: true };

async function assertSuperAdmin() {
  const user = await getPlatformSessionUser();
  if (!user?.isSuperAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function createInstitution(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();

    const parsed = createInstitutionSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      institutionType: formData.get("institutionType"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    const { name, slug, institutionType } = parsed.data;

    await db.insert(organization).values({
      id: crypto.randomUUID(),
      name,
      slug,
      institutionType,
      createdAt: new Date(),
      status: STATUS.ORG.ACTIVE,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }

  revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
  redirect(ROUTES.ADMIN.INSTITUTIONS);
}

export async function updateInstitution(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();

    const parsed = updateInstitutionSchema.safeParse({
      name: formData.get("name") || undefined,
      slug: formData.get("slug") || undefined,
      institutionType: formData.get("institutionType") || undefined,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }

    await db
      .update(organization)
      .set(parsed.data)
      .where(eq(organization.id, id));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }

  revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
  revalidatePath(`${ROUTES.ADMIN.INSTITUTIONS}/${id}`);
  redirect(ROUTES.ADMIN.INSTITUTIONS);
}

export async function suspendInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ status: STATUS.ORG.SUSPENDED })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}

export async function restoreInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ status: STATUS.ORG.ACTIVE })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}

export async function deleteInstitution(id: string): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    return { error: message };
  }
}
