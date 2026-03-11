import { ROLE_TYPES, ROLES } from "@/constants";

export type RoleForPermissions = {
  permissions: string[];
};

export type RoleFor2FA = {
  role_type: string;
  slug: string;
};

/** Union all permissions across all active roles. Default deny — empty set = no access. */
export function resolvePermissions(roles: RoleForPermissions[]): Set<string> {
  const set = new Set<string>();
  for (const role of roles) {
    for (const perm of role.permissions) {
      set.add(perm);
    }
  }
  return set;
}

/** Default deny: returns false if permission not in set. */
export function checkPermission(permissionSet: Set<string>, slug: string): boolean {
  return permissionSet.has(slug);
}

/**
 * Returns true if ANY resolved role requires 2FA enforcement.
 * Rule: role_type='platform' OR (role_type='system' AND slug='institution_admin')
 */
export function requires2FA(roles: RoleFor2FA[]): boolean {
  return roles.some(
    (r) =>
      r.role_type === ROLE_TYPES.PLATFORM ||
      (r.role_type === ROLE_TYPES.SYSTEM && r.slug === ROLES.INSTITUTION_ADMIN),
  );
}

/** Permission slugs must be 'resource:action' with exactly one colon. */
export function isValidPermissionSlug(slug: string): boolean {
  if (!slug) return false;
  const parts = slug.split(":");
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
