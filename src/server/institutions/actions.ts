"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import {
  DB_ERROR_CODES,
  ERROR_MESSAGES,
  ROUTE_BUILDERS,
  ROUTES,
  STATUS,
} from "@/constants";
import { superAdminAction } from "@/lib/safe-action";
import {
  extractPostgresError,
  matchDatabaseRule,
} from "@/server/errors/db-error";
import {
  createInstitutionFormSchema,
  updateInstitutionFormSchema,
} from "./schemas";

const institutionDbRules = [
  {
    code: DB_ERROR_CODES.UNIQUE_VIOLATION,
    column: organization.slug.name,
    message: ERROR_MESSAGES.INSTITUTION.SLUG_ALREADY_EXISTS,
  },
];

function handleDbError(error: unknown): void {
  const pgError = extractPostgresError(error);
  if (!pgError) throw error;
  const matched = matchDatabaseRule(pgError, institutionDbRules);
  if (matched) {
    returnValidationErrors(z.object({ slug: z.string() }), {
      slug: { _errors: [matched] },
    });
  }
  throw error;
}

export const createInstitution = superAdminAction
  .inputSchema(createInstitutionFormSchema)
  .stateAction(async ({ parsedInput: { name, slug, institutionType } }) => {
    try {
      await db.insert(organization).values({
        id: crypto.randomUUID(),
        name,
        slug,
        institutionType,
        createdAt: new Date(),
        status: STATUS.ORG.ACTIVE,
      });
    } catch (error) {
      handleDbError(error);
    }

    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
    redirect(ROUTES.ADMIN.INSTITUTIONS);
  });

export const updateInstitution = superAdminAction
  .inputSchema(updateInstitutionFormSchema)
  .bindArgsSchemas<[id: z.ZodString]>([z.string()])
  .stateAction(async ({ parsedInput, bindArgsParsedInputs: [id] }) => {
    try {
      await db
        .update(organization)
        .set(parsedInput)
        .where(eq(organization.id, id));
    } catch (error) {
      handleDbError(error);
    }

    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
    revalidatePath(ROUTE_BUILDERS.ADMIN.INSTITUTION_BY_ID(id));
    redirect(ROUTES.ADMIN.INSTITUTIONS);
  });

export const suspendInstitution = superAdminAction
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    await db
      .update(organization)
      .set({ status: STATUS.ORG.SUSPENDED })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
  });

export const restoreInstitution = superAdminAction
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    await db
      .update(organization)
      .set({ status: STATUS.ORG.ACTIVE })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
  });

export const deleteInstitution = superAdminAction
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, id));
    revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
  });
