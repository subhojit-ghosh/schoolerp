import { describe, expect, test } from "bun:test";
import { resolveInstitutionFromRequest } from "./tenant";

describe("resolveInstitutionFromRequest", () => {
  test("extracts slug from subdomain", () => {
    const slug = resolveInstitutionFromRequest("school-a.erp.com", null);
    expect(slug).toBe("school-a");
  });

  test("falls back to X-Institution-Id header when no subdomain", () => {
    const slug = resolveInstitutionFromRequest("localhost:3000", "school-b");
    expect(slug).toBe("school-b");
  });

  test("returns null when neither subdomain nor header present", () => {
    const slug = resolveInstitutionFromRequest("localhost:3000", null);
    expect(slug).toBeNull();
  });

  test("ignores www subdomain", () => {
    const slug = resolveInstitutionFromRequest("www.erp.com", null);
    expect(slug).toBeNull();
  });

  test("ignores api subdomain", () => {
    const slug = resolveInstitutionFromRequest("api.erp.com", null);
    expect(slug).toBeNull();
  });

  test("ignores app subdomain", () => {
    const slug = resolveInstitutionFromRequest("app.erp.com", null);
    expect(slug).toBeNull();
  });

  test("extracts slug from *.localhost subdomain (2-part host)", () => {
    const slug = resolveInstitutionFromRequest("school-a.localhost:3000", null);
    expect(slug).toBe("school-a");
  });
});
