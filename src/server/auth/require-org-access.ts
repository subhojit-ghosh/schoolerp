import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  roles,
  membershipRoles,
  academicYears,
  permissions,
  rolePermissions,
} from "@/lib/schema";
import { member as memberTable } from "@/lib/auth-schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { requires2FA, resolvePermissions } from "@/lib/auth/permissions";
import type { InstitutionContext } from "./get-current-institution";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 500,
  ) {
    super(message);
  }
}

export type OrgContext = {
  institution: InstitutionContext;
  userId: string;
  membershipId: string;
  roles: Array<{ id: string; slug: string; roleType: string }>;
  permissionSet: Set<string>;
  academicYear: { id: string; name: string };
  isSuperAdmin: boolean;
};

/**
 * Resolves full org-scoped access context for the current request.
 * Call once in dashboard layout — pass context down, never re-fetch.
 * Takes InstitutionContext from getCurrentInstitution() to avoid a second DB lookup.
 */
export async function requireOrgAccess(
  institution: InstitutionContext,
): Promise<OrgContext> {
  const h = await headers();

  // 1. Check institution is not suspended
  if (institution.status === "suspended") {
    throw new AuthError("Forbidden", 403);
  }

  // 2. Validate session
  const session = await auth.api.getSession({ headers: h });
  if (!session) throw new AuthError("Unauthorized", 401);

  const userId = session.user.id;
  const isSuperAdmin =
    (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true;

  // 3. super_admin shortcut — bypasses membership/role/permission resolution
  if (isSuperAdmin) {
    return {
      institution,
      userId,
      membershipId: "",
      roles: [],
      permissionSet: new Set(), // empty — assertPermission short-circuits via isSuperAdmin
      academicYear: { id: "", name: "" },
      isSuperAdmin: true,
    };
  }

  // 4. Validate membership (query member table directly — Better Auth API limitation)
  const [member] = await db
    .select()
    .from(memberTable)
    .where(
      and(
        eq(memberTable.organizationId, institution.id),
        eq(memberTable.userId, userId),
      ),
    )
    .limit(1);

  if (!member) throw new AuthError("Forbidden", 403);

  const membershipId = member.id;

  // 5. Resolve active membership roles
  const activeRoleRows = await db
    .select({ roleId: membershipRoles.roleId })
    .from(membershipRoles)
    .where(
      and(
        eq(membershipRoles.membershipId, membershipId),
        isNull(membershipRoles.validTo),
        isNull(membershipRoles.deletedAt),
      ),
    );

  if (activeRoleRows.length === 0) throw new AuthError("Forbidden", 403);

  const roleIds = activeRoleRows.map((r) => r.roleId);
  const resolvedRoles = await db
    .select({ id: roles.id, slug: roles.slug, roleType: roles.roleType })
    .from(roles)
    .where(and(inArray(roles.id, roleIds), isNull(roles.deletedAt)));

  // 6. Enforce 2FA before resolving permissions
  if (
    requires2FA(resolvedRoles.map((r) => ({ role_type: r.roleType, slug: r.slug })))
  ) {
    if (!(session as { twoFactorVerified?: boolean }).twoFactorVerified) {
      throw new AuthError("2FA required", 401);
    }
  }

  // 7. Resolve current academic year
  const [currentYear] = await db
    .select({ id: academicYears.id, name: academicYears.name })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.institutionId, institution.id),
        eq(academicYears.isCurrent, true),
        isNull(academicYears.deletedAt),
      ),
    )
    .limit(1);

  if (!currentYear) {
    throw new AuthError(
      "Institution has no current academic year configured",
      500,
    );
  }

  // 8. Resolve permissions (default deny — empty set = no access)
  const permRows = await db
    .select({ slug: permissions.slug })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(rolePermissions.roleId, roleIds));

  const permissionSet = resolvePermissions([
    { permissions: permRows.map((p) => p.slug) },
  ]);

  return {
    institution,
    userId,
    membershipId,
    roles: resolvedRoles,
    permissionSet,
    academicYear: { id: currentYear.id, name: currentYear.name },
    isSuperAdmin: false,
  };
}

/**
 * Asserts a permission is present in the context. Throws 403 if not.
 * MUST be called before constructing any data query.
 * Super admin short-circuits at top — never reaches permission check.
 */
export function assertPermission(ctx: OrgContext, permissionSlug: string): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.permissionSet.has(permissionSlug)) {
    throw new AuthError(`Missing permission: ${permissionSlug}`, 403);
  }
}
