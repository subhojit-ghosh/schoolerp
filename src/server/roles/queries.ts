import "server-only";
import { and, asc, countDistinct, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { membershipRoles, permissions, rolePermissions, roles } from "@/db/schema";
import type { PermissionOption, RoleRow } from "./shared";

export async function listPermissionOptions(): Promise<PermissionOption[]> {
  return db
    .select({
      id: permissions.id,
      slug: permissions.slug,
      description: permissions.description,
    })
    .from(permissions)
    .orderBy(asc(permissions.slug));
}

export async function listRolesForInstitution(
  institutionId: string,
): Promise<RoleRow[]> {
  const roleRows = await db
    .select({
      id: roles.id,
      name: roles.name,
      slug: roles.slug,
      roleType: roles.roleType,
      institutionId: roles.institutionId,
      isSystem: roles.isSystem,
      isConfigurable: roles.isConfigurable,
    })
    .from(roles)
    .where(
      and(
        or(isNull(roles.institutionId), eq(roles.institutionId, institutionId))!,
        isNull(roles.deletedAt),
      ),
    )
    .orderBy(asc(roles.institutionId), asc(roles.name));

  const roleIds = roleRows.map((role) => role.id);
  if (roleIds.length === 0) {
    return [];
  }

  const rolePermissionRows = await db
    .select({
      roleId: rolePermissions.roleId,
      permissionId: permissions.id,
      permissionSlug: permissions.slug,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(rolePermissions.roleId, roleIds));

  const memberCountRows = await db
    .select({
      roleId: membershipRoles.roleId,
      total: countDistinct(membershipRoles.membershipId),
    })
    .from(membershipRoles)
    .where(
      and(
        inArray(membershipRoles.roleId, roleIds),
        isNull(membershipRoles.deletedAt),
        isNull(membershipRoles.validTo),
      ),
    )
    .groupBy(membershipRoles.roleId);

  const permissionsByRole = new Map<
    string,
    { permissionIds: string[]; permissionSlugs: string[] }
  >();
  for (const row of rolePermissionRows) {
    const existing = permissionsByRole.get(row.roleId) ?? {
      permissionIds: [],
      permissionSlugs: [],
    };
    existing.permissionIds.push(row.permissionId);
    existing.permissionSlugs.push(row.permissionSlug);
    permissionsByRole.set(row.roleId, existing);
  }

  const memberCounts = new Map(
    memberCountRows.map((row) => [row.roleId, row.total]),
  );

  return roleRows.map((role) => {
    const rolePermissionsState = permissionsByRole.get(role.id) ?? {
      permissionIds: [],
      permissionSlugs: [],
    };

    return {
      ...role,
      permissionIds: rolePermissionsState.permissionIds,
      permissionSlugs: rolePermissionsState.permissionSlugs,
      activeMemberCount: memberCounts.get(role.id) ?? 0,
    };
  });
}
