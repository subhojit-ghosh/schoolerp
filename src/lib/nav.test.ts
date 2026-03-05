// src/lib/nav.test.ts
import { describe, expect, test } from "bun:test";
import { filterNavItems, NAV_ITEMS } from "./nav";
import { PERMISSIONS } from "@/constants";

describe("filterNavItems", () => {
  test("returns all items for super admin", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), true);
    expect(result).toHaveLength(NAV_ITEMS.length);
  });

  test("returns only items matching permission set", () => {
    const perms: Set<string> = new Set([PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.GRADES.READ]);
    const result = filterNavItems(NAV_ITEMS, perms, false);
    expect(result.every((item) => perms.has(item.permission))).toBe(true);
    expect(result).toHaveLength(2);
  });

  test("returns empty array when no permissions match", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    expect(result).toHaveLength(0);
  });

  test("NAV_ITEMS has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
