"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { db } from "@/db";
import { member, organization, user } from "@/db/schema/auth";
import { academicYears, membershipRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BUILT_IN_ROLES } from "@/db/seeds";
import {
  DB_ERROR_CODES,
  ERROR_MESSAGES,
  ROLES,
  ROUTE_BUILDERS,
  ROUTES,
  STATUS,
} from "@/constants";
import { auth } from "@/lib/auth";
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
  .stateAction(
    async ({
      parsedInput: {
        name,
        slug,
        institutionType,
        adminName,
        adminEmail,
        adminPassword,
      },
    }) => {
      // 1. Create the organization
      const orgId = crypto.randomUUID();
      try {
        await db.insert(organization).values({
          id: orgId,
          name,
          slug,
          institutionType,
          createdAt: new Date(),
          status: STATUS.ORG.ACTIVE,
        });
      } catch (error) {
        handleDbError(error);
      }

      // 2. Create the admin user (or find existing by email)
      let userId: string;
      try {
        const result = await auth.api.signUpEmail({
          body: {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
          },
        });
        userId = result.user.id;
      } catch {
        // User may already exist — look them up
        const [existingUser] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, adminEmail))
          .limit(1);
        if (!existingUser) {
          returnValidationErrors(z.object({ adminEmail: z.string() }), {
            adminEmail: {
              _errors: [ERROR_MESSAGES.INSTITUTION.ADMIN_CREATION_FAILED],
            },
          });
          throw new Error("unreachable");
        }
        userId = existingUser.id;
      }

      // 3. Create membership linking user to org as admin
      const memberId = crypto.randomUUID();
      await db.insert(member).values({
        id: memberId,
        organizationId: orgId,
        userId,
        role: ROLES.INSTITUTION_ADMIN,
        status: STATUS.MEMBER.ACTIVE,
        createdAt: new Date(),
      });

      // 4. Assign institution_admin role to the membership
      const adminRole = BUILT_IN_ROLES.find(
        (r) => r.slug === ROLES.INSTITUTION_ADMIN,
      )!;
      await db.insert(membershipRoles).values({
        id: crypto.randomUUID(),
        membershipId: memberId,
        roleId: adminRole.id,
        validFrom: new Date().toISOString().slice(0, 10),
      });

      // 5. Create a default academic year for the institution
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      await db.insert(academicYears).values({
        id: crypto.randomUUID(),
        institutionId: orgId,
        name: `${now.getFullYear()}`,
        startDate: yearStart.toISOString().slice(0, 10),
        endDate: yearEnd.toISOString().slice(0, 10),
        isCurrent: true,
      });

      revalidatePath(ROUTES.ADMIN.INSTITUTIONS);
      redirect(ROUTES.ADMIN.INSTITUTIONS);
    },
  );

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
