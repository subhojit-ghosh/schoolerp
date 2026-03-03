import { describe, expect, test } from "bun:test";
import { BUILT_IN_ROLES, BUILT_IN_PERMISSIONS, ROLE_PERMISSIONS } from "./index";
import { isValidPermissionSlug } from "@/lib/auth/permissions";

describe("BUILT_IN_ROLES", () => {
  test("contains exactly 9 built-in roles", () => {
    expect(BUILT_IN_ROLES).toHaveLength(9);
  });

  test("all platform roles have institutionId null", () => {
    const platformRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "platform");
    expect(platformRoles.every((r) => r.institutionId === null)).toBe(true);
  });

  test("all system roles have isSystem true and isConfigurable false", () => {
    const systemRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "system");
    expect(systemRoles.every((r) => r.isSystem && !r.isConfigurable)).toBe(true);
  });

  test("all staff preset roles have isSystem false and isConfigurable true", () => {
    const staffRoles = BUILT_IN_ROLES.filter((r) => r.roleType === "staff");
    expect(staffRoles.every((r) => !r.isSystem && r.isConfigurable)).toBe(true);
  });

  test("super_admin, institution_admin, student, parent are present", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(slugs).toContain("super_admin");
    expect(slugs).toContain("institution_admin");
    expect(slugs).toContain("student");
    expect(slugs).toContain("parent");
  });

  test("no duplicate slugs in built-in roles", () => {
    const slugs = BUILT_IN_ROLES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("super_admin is isSystem true and isConfigurable false", () => {
    const superAdmin = BUILT_IN_ROLES.find((r) => r.slug === "super_admin");
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
    const adminPerms = new Set(ROLE_PERMISSIONS["institution_admin"]);
    expect([...allSlugs].every((s) => adminPerms.has(s))).toBe(true);
  });

  test("student only has students:read", () => {
    expect(ROLE_PERMISSIONS["student"]).toEqual(["students:read"]);
  });

  test("principal does not have roles:manage or members:invite", () => {
    const perms = ROLE_PERMISSIONS["principal"];
    expect(perms).not.toContain("roles:manage");
    expect(perms).not.toContain("members:invite");
  });
});
