import { describe, expect, test } from "bun:test";
import { TenantContextService } from "./tenant-context.service";

describe("TenantContextService.resolveTenantSlug", () => {
  const service = new TenantContextService({} as never);

  test("prefers the explicit tenant query override", () => {
    expect(service.resolveTenantSlug("erp.test", "springfield")).toBe(
      "springfield",
    );
  });

  test("ignores local root hosts", () => {
    expect(
      service.resolveTenantSlug("localhost:3000", undefined),
    ).toBeUndefined();
    expect(
      service.resolveTenantSlug("127.0.0.1:3000", undefined),
    ).toBeUndefined();
  });

  test("resolves the tenant from the subdomain", () => {
    expect(service.resolveTenantSlug("springfield.erp.test", undefined)).toBe(
      "springfield",
    );
  });
});
