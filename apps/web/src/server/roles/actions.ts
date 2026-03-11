"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { membershipRoles, permissions, rolePermissions, roles } from "@/db/schema";
import { DB_ERROR_CODES, ERROR_MESSAGES, PERMISSIONS, ROUTES } from "@/constants";
import { orgAction } from "@/lib/safe-action";
import { assertPermission } from "@/server/auth/require-org-access";
import { extractPostgresError } from "@/server/errors/db-error";
import { AuthError } from "@/server/errors/auth-error";
import { CUSTOM_ROLE_TYPE, createRoleSchema, roleIdSchema, updateRolePermissionsSchema } from "./schemas";

function revalidateRolesRoute() {
  revalidatePath(ROUTES.ORG.ROLES);
}

function toRoleSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function getEditableRole(roleId: string, institutionId: string) {
  const [role] = await db
    .select({
      id: roles.id,
      institutionId: roles.institutionId,
      roleType: roles.roleType,
      deletedAt: roles.deletedAt,
    })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  if (
    !role ||
    role.deletedAt !== null ||
    role.institutionId !== institutionId ||
    role.roleType !== CUSTOM_ROLE_TYPE
  ) {
    throw AuthError.forbidden(ERROR_MESSAGES.ROLES.BUILT_IN_ROLE_READ_ONLY);
  }

  return role;
}

async function validatePermissionIds(permissionIds: string[]) {
  const rows = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(inArray(permissions.id, permissionIds));

  if (rows.length !== permissionIds.length) {
    throw AuthError.forbidden(ERROR_MESSAGES.ROLES.PERMISSION_REQUIRED);
  }
}

const roleManagementAction = orgAction.use(async ({ next, ctx }) => {
  assertPermission(ctx.org, PERMISSIONS.ROLES.MANAGE);
  return next({ ctx });
});

export const createRole = roleManagementAction
  .inputSchema(createRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    await validatePermissionIds(parsedInput.permissionIds);

    const roleId = crypto.randomUUID();

    try {
      await db.insert(roles).values({
        id: roleId,
        name: parsedInput.name,
        slug: toRoleSlug(parsedInput.name),
        roleType: CUSTOM_ROLE_TYPE,
        institutionId: ctx.org.institution.id,
        isSystem: false,
        isConfigurable: true,
      });
    } catch (error) {
      const pgError = extractPostgresError(error);
      if (pgError?.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
        returnValidationErrors(z.object({ name: createRoleSchema.shape.name }), {
          name: { _errors: [ERROR_MESSAGES.ROLES.ROLE_NAME_EXISTS] },
        });
      }
      throw error;
    }

    await db.insert(rolePermissions).values(
      parsedInput.permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    );

    revalidateRolesRoute();
  });

export const updateRolePermissions = roleManagementAction
  .inputSchema(updateRolePermissionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getEditableRole(parsedInput.roleId, ctx.org.institution.id);
    await validatePermissionIds(parsedInput.permissionIds);

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, parsedInput.roleId));

    await db.insert(rolePermissions).values(
      parsedInput.permissionIds.map((permissionId) => ({
        roleId: parsedInput.roleId,
        permissionId,
      })),
    );

    revalidateRolesRoute();
  });

export const archiveRole = roleManagementAction
  .inputSchema(roleIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    await getEditableRole(parsedInput.roleId, ctx.org.institution.id);

    const [activeAssignments] = await db
      .select({ count: count() })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.roleId, parsedInput.roleId),
          isNull(membershipRoles.deletedAt),
          isNull(membershipRoles.validTo),
        ),
      );

    if ((activeAssignments?.count ?? 0) > 0) {
      throw AuthError.forbidden(ERROR_MESSAGES.ROLES.ROLE_IN_USE);
    }

    await db
      .update(roles)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(roles.id, parsedInput.roleId),
          isNull(roles.deletedAt),
        ),
      );

    revalidateRolesRoute();
  });
