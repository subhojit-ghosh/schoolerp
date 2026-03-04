import { describe, expect, test } from "bun:test";
import { resolveInstitutionFromRequest } from "./tenant";

describe("resolveInstitutionFromRequest", () => {
  test("extracts slug from subdomain", () => {
    const url = new URL("https://school-a.erp.com/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBe("school-a");
  });

  test("falls back to X-Institution-Id header when no subdomain", () => {
    const url = new URL("http://localhost:3000/dashboard");
    const slug = resolveInstitutionFromRequest(url, "school-b");
    expect(slug).toBe("school-b");
  });

  test("returns null when neither subdomain nor header present", () => {
    const url = new URL("http://localhost:3000/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });

  test("ignores www subdomain", () => {
    const url = new URL("https://www.erp.com/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });

  test("ignores api subdomain", () => {
    const url = new URL("https://api.erp.com/v1/something");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });

  test("ignores app subdomain", () => {
    const url = new URL("https://app.erp.com/dashboard");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBeNull();
  });

  test("extracts slug from *.localhost subdomain (2-part host)", () => {
    const url = new URL("http://school-a.localhost:3000/auth/sign-in");
    const slug = resolveInstitutionFromRequest(url, null);
    expect(slug).toBe("school-a");
  });
});
