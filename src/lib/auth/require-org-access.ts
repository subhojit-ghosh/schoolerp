// src/lib/auth/require-org-access.ts
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
import { organization as orgTable, member as memberTable } from "@/lib/auth-schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { requires2FA, resolvePermissions, checkPermission } from "./permissions";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 500,
  ) {
    super(message);
  }
}

export type OrgContext = {
  userId: string;
  institutionId: string;
  membershipId: string;
  currentAcademicYearId: string;
  roles: Array<{ id: string; slug: string; roleType: string }>;
  permissionSet: Set<string>;
  isSuperAdmin: boolean;
};

/**
 * Resolves and validates org-scoped access for the current request.
 * Must be called at the top of every org-scoped server action or route handler.
 * Permission checks must execute before data queries are constructed.
 */
export async function requireOrgAccess(institutionSlug: string): Promise<OrgContext> {
  const h = await headers();

  // 1. Validate session
  const session = await auth.api.getSession({ headers: h });
  if (!session) throw new AuthError("Unauthorized", 401);

  const userId = session.user.id;
  const isSuperAdmin = (session.user as any).isSuperAdmin === true;

  // 2. Resolve institution by slug
  // TODO: auth.api.getOrganization does not exist in Better Auth v1.5.x.
  // We query the organization table directly via Drizzle instead.
  const [org] = await db
    .select()
    .from(orgTable)
    .where(eq(orgTable.slug, institutionSlug))
    .limit(1);

  if (!org || org.status === "suspended") {
    // Generic 403 — never reveal whether institution exists or is suspended
    throw new AuthError("Forbidden", 403);
  }

  const institutionId = org.id;

  // 3. super_admin shortcut — bypasses membership/role/permission resolution
  if (isSuperAdmin) {
    return {
      userId,
      institutionId,
      membershipId: "",
      currentAcademicYearId: "",
      roles: [],
      permissionSet: new Set(["*"]), // sentinel: super_admin has all permissions
      isSuperAdmin: true,
    };
  }

  // 4. Validate membership
  // TODO: auth.api.getActiveMember does not accept organizationId as a query param in Better Auth v1.5.x.
  // It resolves membership from the session's activeOrganizationId, which may not be the target institution.
  // We query the member table directly via Drizzle to validate membership for the target organization.
  const [member] = await db
    .select()
    .from(memberTable)
    .where(
      and(
        eq(memberTable.organizationId, institutionId),
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
  if (requires2FA(resolvedRoles.map((r) => ({ role_type: r.roleType, slug: r.slug })))) {
    // Better Auth tracks 2FA verification in session
    if (!(session as any).twoFactorVerified) {
      throw new AuthError("2FA required", 401);
    }
  }

  // 7. Resolve current academic year
  const [currentYear] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.institutionId, institutionId),
        eq(academicYears.isCurrent, true),
        isNull(academicYears.deletedAt),
      ),
    )
    .limit(1);

  if (!currentYear) {
    throw new AuthError("Institution has no current academic year configured", 500);
  }

  // 8. Resolve permissions (request-scoped, default deny)
  const permRows = await db
    .select({ slug: permissions.slug })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(inArray(rolePermissions.roleId, roleIds));

  const permissionSet = resolvePermissions([
    { permissions: permRows.map((p) => p.slug) },
  ]);

  return {
    userId,
    institutionId,
    membershipId,
    currentAcademicYearId: currentYear.id,
    roles: resolvedRoles,
    permissionSet,
    isSuperAdmin: false,
  };
}

/**
 * Asserts a permission is present. Throws 403 if not.
 * MUST be called before constructing any data query.
 */
export function assertPermission(ctx: OrgContext, permissionSlug: string): void {
  if (ctx.isSuperAdmin) return; // super_admin bypasses permission checks
  if (!checkPermission(ctx.permissionSet, permissionSlug)) {
    throw new AuthError(`Missing permission: ${permissionSlug}`, 403);
  }
}
