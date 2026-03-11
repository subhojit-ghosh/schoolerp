"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { ERROR_MESSAGES, PERMISSIONS, ROUTES, STATUS } from "@/constants";
import { orgAction } from "@/lib/safe-action";
import { assertPermission } from "@/server/auth/require-org-access";
import { AuthError } from "@/server/errors/auth-error";
import { academicYearIdSchema, createAcademicYearSchema } from "./schemas";

function revalidateSettingsRoute() {
  revalidatePath(ROUTES.ORG.SETTINGS);
}

async function getAcademicYearOrThrow(academicYearId: string, institutionId: string) {
  const [year] = await db
    .select({
      id: academicYears.id,
      isCurrent: academicYears.isCurrent,
      status: academicYears.status,
      deletedAt: academicYears.deletedAt,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.institutionId, institutionId),
      ),
    )
    .limit(1);

  if (!year || year.deletedAt !== null) {
    throw AuthError.forbidden(ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND);
  }

  return year;
}

const academicYearManagementAction = orgAction.use(async ({ next, ctx }) => {
  assertPermission(ctx.org, PERMISSIONS.SETTINGS.WRITE);
  return next({ ctx });
});

export const createAcademicYear = academicYearManagementAction
  .inputSchema(createAcademicYearSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [existingCurrent] = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.institutionId, ctx.org.institution.id),
          eq(academicYears.isCurrent, true),
          isNull(academicYears.deletedAt),
        ),
      )
      .limit(1);

    const shouldMakeCurrent = parsedInput.makeCurrent || !existingCurrent;

    if (shouldMakeCurrent) {
      await db
        .update(academicYears)
        .set({ isCurrent: false })
        .where(
          and(
            eq(academicYears.institutionId, ctx.org.institution.id),
            isNull(academicYears.deletedAt),
          ),
        );
    }

    await db.insert(academicYears).values({
      id: crypto.randomUUID(),
      institutionId: ctx.org.institution.id,
      name: parsedInput.name,
      startDate: parsedInput.startDate,
      endDate: parsedInput.endDate,
      isCurrent: shouldMakeCurrent,
      status: STATUS.ACADEMIC_YEAR.ACTIVE,
    });

    revalidateSettingsRoute();
  });

export const setCurrentAcademicYear = academicYearManagementAction
  .inputSchema(academicYearIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getAcademicYearOrThrow(parsedInput.academicYearId, ctx.org.institution.id);

    await db
      .update(academicYears)
      .set({ isCurrent: false })
      .where(
        and(
          eq(academicYears.institutionId, ctx.org.institution.id),
          isNull(academicYears.deletedAt),
        ),
      );

    await db
      .update(academicYears)
      .set({
        isCurrent: true,
        status: STATUS.ACADEMIC_YEAR.ACTIVE,
      })
      .where(eq(academicYears.id, parsedInput.academicYearId));

    revalidateSettingsRoute();
  });

export const archiveAcademicYear = academicYearManagementAction
  .inputSchema(academicYearIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const year = await getAcademicYearOrThrow(parsedInput.academicYearId, ctx.org.institution.id);
    if (year.isCurrent) {
      throw AuthError.forbidden(ERROR_MESSAGES.ACADEMIC_YEARS.CURRENT_YEAR_REQUIRED);
    }

    await db
      .update(academicYears)
      .set({ status: STATUS.ACADEMIC_YEAR.ARCHIVED })
      .where(eq(academicYears.id, parsedInput.academicYearId));

    revalidateSettingsRoute();
  });

export const restoreAcademicYear = academicYearManagementAction
  .inputSchema(academicYearIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getAcademicYearOrThrow(parsedInput.academicYearId, ctx.org.institution.id);

    await db
      .update(academicYears)
      .set({ status: STATUS.ACADEMIC_YEAR.ACTIVE })
      .where(eq(academicYears.id, parsedInput.academicYearId));

    revalidateSettingsRoute();
  });

