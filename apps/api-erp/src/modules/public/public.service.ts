import {
  tenantBrandingSchema,
  type TenantBranding,
} from "@academic-platform/contracts";
import { Injectable } from "@nestjs/common";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const TENANT_BRANDING_FIXTURES: Record<string, TenantBranding> = {
  "springfield-high": tenantBrandingSchema.parse({
    institutionName: "Springfield High School",
    shortName: "Springfield High",
    tenantSlug: "springfield-high",
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#8a5a44",
    accentColor: "#d59f6a",
    sidebarColor: "#32241c",
  }),
  "lotus-public-school": tenantBrandingSchema.parse({
    institutionName: "Lotus Public School",
    shortName: "Lotus Public",
    tenantSlug: "lotus-public-school",
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#136f63",
    accentColor: "#f59e0b",
    sidebarColor: "#0b2f2a",
  }),
};

const DEFAULT_TENANT_SLUG = "springfield-high";

@Injectable()
export class PublicService {
  getTenantBranding(host: string | undefined, tenantQuery: string | undefined) {
    const tenantSlug = this.resolveTenantSlug(host, tenantQuery);

    return (
      TENANT_BRANDING_FIXTURES[tenantSlug] ??
      TENANT_BRANDING_FIXTURES[DEFAULT_TENANT_SLUG]
    );
  }

  private resolveTenantSlug(
    host: string | undefined,
    tenantQuery: string | undefined,
  ) {
    if (tenantQuery) {
      return tenantQuery;
    }

    if (!host) {
      return DEFAULT_TENANT_SLUG;
    }

    const hostname = host.split(":")[0];

    if (LOCAL_HOSTS.has(hostname)) {
      return DEFAULT_TENANT_SLUG;
    }

    const [subdomain] = hostname.split(".");

    return subdomain || DEFAULT_TENANT_SLUG;
  }
}
