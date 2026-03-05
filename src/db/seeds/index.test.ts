import { describe, expect, test } from "bun:test";
import { BUILT_IN_ROLES, BUILT_IN_PERMISSIONS, ROLE_PERMISSIONS } from "./index";
import { isValidPermissionSlug } from "@/lib/auth/permissions";
import { PERMISSIONS, ROLES, ROLE_TYPES } from "@/constants";

describe("BUILT_IN_ROLES", () => {
  test("contains exactly 9 built-in roles", () => {
    expect(BUILT_IN_ROLES).toHaveLength(9);
  });

  test("all platform roles have institutionId null", () => {
    const platformRoles = BUILT_IN_ROLES.filter(
      (r) => r.roleType === ROLE_TYPES.PLATFORM,
    );
    expect(platformRoles.every((r) => r.institutionId === null)).toBe(true);
  });

  test("all system roles have isSystem true and isConfigurable false", () => {
    const systemRoles = BUILT_IN_ROLES.filter(
      (r) => r.roleType === ROLE_TYPES.SYSTEM,
    );
    expect(systemRoles.every((r) => r.isSystem && !r.isConfigurable)).toBe(true);
  });

  test("all staff preset roles have isSystem false and isConfigurable true", () => {
    const staffRoles = BUILT_IN_ROLES.filter(
      (r) => r.roleType === ROLE_TYPES.STAFF,
    );
    expect(staffRoles.every((r) => !r.isSystem && r.isConfigurable)).toBe(true);
  });

  test("super_admin, institution_admin, student, parent are present", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(slugs).toContain(ROLES.SUPER_ADMIN);
    expect(slugs).toContain(ROLES.INSTITUTION_ADMIN);
    expect(slugs).toContain(ROLES.STUDENT);
    expect(slugs).toContain(ROLES.PARENT);
  });

  test("no duplicate slugs in built-in roles", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("super_admin is isSystem true and isConfigurable false", () => {
    const superAdmin = BUILT_IN_ROLES.find((r) => r.slug === ROLES.SUPER_ADMIN);
    expect(superAdmin?.isSystem).toBe(true);
    expect(superAdmin?.isConfigurable).toBe(false);
  });
});

describe("BUILT_IN_PERMISSIONS", () => {
  test("contains exactly 17 built-in permissions", () => {
    expect(BUILT_IN_PERMISSIONS).toHaveLength(17);
  });

  test("all permission slugs are valid resource:action format", () => {
    expect(BUILT_IN_PERMISSIONS.every((p) => isValidPermissionSlug(p.slug))).toBe(true);
  });

  test("no duplicate permission slugs", () => {
    const slugs = BUILT_IN_PERMISSIONS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("ROLE_PERMISSIONS", () => {
  test("institution_admin has all permissions", () => {
    const allSlugs = new Set(BUILT_IN_PERMISSIONS.map((p) => p.slug));
    const adminPerms = new Set(ROLE_PERMISSIONS[ROLES.INSTITUTION_ADMIN]);
    expect([...allSlugs].every((s) => adminPerms.has(s))).toBe(true);
  });

  test("student only has students:read", () => {
    expect(ROLE_PERMISSIONS[ROLES.STUDENT]).toEqual([PERMISSIONS.STUDENTS.READ]);
  });

  test("principal does not have roles:manage or members:invite", () => {
    const perms = ROLE_PERMISSIONS[ROLES.PRINCIPAL];
    expect(perms).not.toContain(PERMISSIONS.ROLES.MANAGE);
    expect(perms).not.toContain(PERMISSIONS.MEMBERS.INVITE);
  });
});
