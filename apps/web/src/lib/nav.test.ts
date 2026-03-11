import { describe, expect, test } from "bun:test";
import { filterNavItems, NAV_ITEMS } from "./nav";
import { PERMISSIONS } from "@/constants";

describe("filterNavItems", () => {
  test("returns all items for super admin", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), true);
    expect(result).toHaveLength(NAV_ITEMS.length);
  });

  test("returns only items matching permission set plus permissionless items", () => {
    const perms: Set<string> = new Set([PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.GRADES.READ]);
    const result = filterNavItems(NAV_ITEMS, perms, false);
    const permissionlessCount = NAV_ITEMS.filter((i) => !i.permission).length;
    const matchedCount = NAV_ITEMS.filter((i) => i.permission && perms.has(i.permission)).length;
    expect(result).toHaveLength(permissionlessCount + matchedCount);
  });

  test("returns permissionless items when no permissions match", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    const permissionlessCount = NAV_ITEMS.filter((i) => !i.permission).length;
    expect(result).toHaveLength(permissionlessCount);
  });

  test("NAV_ITEMS has no duplicate hrefs", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("dashboard is always visible regardless of permissions", () => {
    const result = filterNavItems(NAV_ITEMS, new Set(), false);
    expect(result.some((i) => i.label === "Dashboard")).toBe(true);
  });
});
