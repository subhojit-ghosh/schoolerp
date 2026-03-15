import {
  AUTH_CONTEXT_KEYS,
  type AuthContextKey,
  type PermissionSlug,
} from "@repo/contracts";
import type { AuthSession } from "./auth.types";

export function getActiveContext(session: AuthSession | null) {
  return session?.activeContext ?? null;
}

export function isStaffContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.STAFF;
}

export function isParentContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.PARENT;
}

export function isStudentContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.STUDENT;
}

export function getActiveRoleDisplayLabel(session: AuthSession | null) {
  if (!isStaffContext(session)) {
    return getActiveContext(session)?.label ?? null;
  }

  const activeStaffRoles = session?.activeStaffRoles ?? [];

  if (activeStaffRoles.length === 0) {
    return getActiveContext(session)?.label ?? null;
  }

  if (activeStaffRoles.length === 1) {
    return activeStaffRoles[0]?.name ?? null;
  }

  const primaryRole =
    activeStaffRoles[0]?.name ?? getActiveContext(session)?.label;

  return `${primaryRole} +${activeStaffRoles.length - 1}`;
}

export function getContextSecondaryLabel(
  session: AuthSession | null,
  contextKey: AuthContextKey,
) {
  if (contextKey !== AUTH_CONTEXT_KEYS.STAFF) {
    return null;
  }

  const activeStaffRoles = session?.activeStaffRoles ?? [];

  if (activeStaffRoles.length === 0) {
    return null;
  }

  if (activeStaffRoles.length === 1) {
    return activeStaffRoles[0]?.name ?? null;
  }

  const primaryRole = activeStaffRoles[0]?.name;

  if (!primaryRole) {
    return `${activeStaffRoles.length} roles`;
  }

  return `${primaryRole} +${activeStaffRoles.length - 1}`;
}

export function hasPermission(
  session: AuthSession | null,
  permission: PermissionSlug,
) {
  return session?.permissions.includes(permission) ?? false;
}

export function hasAnyPermission(
  session: AuthSession | null,
  permissions: PermissionSlug[],
) {
  return permissions.some((permission) => hasPermission(session, permission));
}
