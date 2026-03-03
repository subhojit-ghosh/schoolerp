import { describe, expect, test } from "bun:test";
import {
  resolvePermissions,
  checkPermission,
  requires2FA,
  isValidPermissionSlug,
} from "./permissions";

describe("resolvePermissions", () => {
  test("returns union of permissions across multiple roles", () => {
    const roles = [
      { permissions: ["fees:read", "fees:write"] },
      { permissions: ["students:read", "fees:read"] },
    ];
    const result = resolvePermissions(roles);
    expect(result).toEqual(new Set(["fees:read", "fees:write", "students:read"]));
  });

  test("returns empty set when no roles", () => {
    expect(resolvePermissions([])).toEqual(new Set());
  });

  test("returns empty set when roles have no permissions", () => {
    expect(resolvePermissions([{ permissions: [] }])).toEqual(new Set());
  });
});

describe("checkPermission", () => {
  test("returns true when permission exists in set", () => {
    const perms = new Set(["fees:read", "students:write"]);
    expect(checkPermission(perms, "fees:read")).toBe(true);
  });

  test("returns false (default deny) when permission not in set", () => {
    const perms = new Set(["fees:read"]);
    expect(checkPermission(perms, "fees:write")).toBe(false);
  });

  test("returns false on empty permission set (default deny)", () => {
    expect(checkPermission(new Set(), "fees:read")).toBe(false);
  });
});

describe("requires2FA", () => {
  test("returns true when any role is platform type", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "platform", slug: "super_admin" },
    ];
    expect(requires2FA(roles)).toBe(true);
  });

  test("returns true when any role is system institution_admin", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "system", slug: "institution_admin" },
    ];
    expect(requires2FA(roles)).toBe(true);
  });

  test("returns false for staff-only roles", () => {
    const roles = [
      { role_type: "staff", slug: "teacher" },
      { role_type: "staff", slug: "accountant" },
    ];
    expect(requires2FA(roles)).toBe(false);
  });

  test("returns false for system roles that are not institution_admin", () => {
    const roles = [{ role_type: "system", slug: "student" }];
    expect(requires2FA(roles)).toBe(false);
  });

  test("returns false for empty roles", () => {
    expect(requires2FA([])).toBe(false);
  });
});

describe("isValidPermissionSlug", () => {
  test("accepts valid resource:action format", () => {
    expect(isValidPermissionSlug("fees:read")).toBe(true);
    expect(isValidPermissionSlug("attendance:write")).toBe(true);
  });

  test("rejects slugs without colon", () => {
    expect(isValidPermissionSlug("feesread")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isValidPermissionSlug("")).toBe(false);
  });

  test("rejects multiple colons", () => {
    expect(isValidPermissionSlug("fees:read:extra")).toBe(false);
  });
});
