import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { STATUS } from "@/constants";
import { db } from "@/db";
import {
  roles,
  membershipRoles,
  academicYears,
  permissions,
  rolePermissions,
} from "@/db/schema";
import { member as memberTable } from "@/db/schema/auth";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { requires2FA, resolvePermissions } from "@/lib/auth/permissions";
import type { InstitutionContext } from "@/server/institutions/get-current";

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
  user: {
    id: string;
    name: string;
    email: string;
    twoFactorEnabled: boolean;
  };
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
  return requireOrgAccessCached(
    institution.id,
    institution.slug,
    institution.name,
    institution.status,
    institution.branding.logoUrl,
    institution.branding.primaryColor,
  );
}

const requireOrgAccessCached = cache(
  async (
    institutionId: string,
    institutionSlug: string,
    institutionName: string,
    institutionStatus: string,
    logoUrl: string | null,
    primaryColor: string | null,
  ): Promise<OrgContext> => {
    const h = await headers();
    const institution: InstitutionContext = {
      id: institutionId,
      slug: institutionSlug,
      name: institutionName,
      status: institutionStatus,
      branding: {
        logoUrl,
        primaryColor,
      },
    };

    // 1. Check institution is not suspended
    if (institution.status === STATUS.ORG.SUSPENDED) {
      throw new AuthError("Forbidden", 403);
    }

    // 2. Validate session
    const session = await auth.api.getSession({ headers: h });
    if (!session) throw new AuthError("Unauthorized", 401);

    const user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      twoFactorEnabled:
        (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled === true,
    };
    const isSuperAdmin =
      (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true;

    // 3. super_admin shortcut — bypasses membership/role/permission resolution
    if (isSuperAdmin) {
      return {
        institution,
        user,
        membershipId: "",
        roles: [],
        permissionSet: new Set(),
        academicYear: { id: "", name: "" },
        isSuperAdmin: true,
      };
    }

    // 4. Validate membership
    const [member] = await db
      .select()
      .from(memberTable)
      .where(
        and(
          eq(memberTable.organizationId, institution.id),
          eq(memberTable.userId, user.id),
          eq(memberTable.status, STATUS.MEMBER.ACTIVE),
          isNull(memberTable.deletedAt),
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

    // 6. Enforce privileged-role 2FA setup; Better Auth handles the actual challenge flow.
    if (
      requires2FA(
        resolvedRoles.map((r) => ({ role_type: r.roleType, slug: r.slug })),
      ) &&
      !user.twoFactorEnabled
    ) {
      throw new AuthError("Two-factor authentication must be enabled", 403);
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
      user,
      membershipId,
      roles: resolvedRoles,
      permissionSet,
      academicYear: { id: currentYear.id, name: currentYear.name },
      isSuperAdmin: false,
    };
  },
);

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
