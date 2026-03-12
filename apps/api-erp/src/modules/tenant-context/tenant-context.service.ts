import { DATABASE } from "@academic-platform/backend-core";
import { Inject, Injectable } from "@nestjs/common";
import type { AppDatabase } from "@academic-platform/database";
import { and, eq, isNull } from "drizzle-orm";
import { campus, organization } from "@academic-platform/database";
import { tenantBrandingSchema } from "@academic-platform/contracts";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export const DEFAULT_TENANT_BRANDING = tenantBrandingSchema.parse({
  institutionName: "Academic Platform",
  shortName: "Academic Platform",
  tenantSlug: "academic-platform",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#8a5a44",
  accentColor: "#d59f6a",
  sidebarColor: "#32241c",
});

@Injectable()
export class TenantContextService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  resolveTenantSlug(host: string | undefined, tenantQuery: string | undefined) {
    if (tenantQuery) {
      return tenantQuery;
    }

    if (!host) {
      return undefined;
    }

    const hostname = host.split(":")[0];

    if (LOCAL_HOSTS.has(hostname)) {
      return undefined;
    }

    const [subdomain] = hostname.split(".");

    return subdomain || undefined;
  }

  async getOrganizationBySlug(slug: string) {
    const [row] = await this.db
      .select({
        id: organization.id,
        name: organization.name,
        shortName: organization.shortName,
        slug: organization.slug,
        institutionType: organization.institutionType,
        logoUrl: organization.logoUrl,
        faviconUrl: organization.faviconUrl,
        primaryColor: organization.primaryColor,
        accentColor: organization.accentColor,
        sidebarColor: organization.sidebarColor,
        status: organization.status,
        deletedAt: organization.deletedAt,
      })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    if (!row || row.deletedAt !== null) {
      return null;
    }

    return row;
  }

  async getDefaultCampusForOrganization(organizationId: string) {
    const [row] = await this.db
      .select({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        status: campus.status,
        isDefault: campus.isDefault,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          eq(campus.isDefault, true),
          isNull(campus.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listCampusesForOrganization(organizationId: string) {
    return this.db
      .select({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        status: campus.status,
        isDefault: campus.isDefault,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          isNull(campus.deletedAt),
        ),
      );
  }

  async getTenantBranding(
    host: string | undefined,
    tenantQuery: string | undefined,
  ) {
    const tenantSlug = this.resolveTenantSlug(host, tenantQuery);

    if (!tenantSlug) {
      return DEFAULT_TENANT_BRANDING;
    }

    const tenant = await this.getOrganizationBySlug(tenantSlug);

    if (!tenant) {
      return DEFAULT_TENANT_BRANDING;
    }

    return tenantBrandingSchema.parse({
      institutionName: tenant.name,
      shortName: tenant.shortName,
      tenantSlug: tenant.slug,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      primaryColor: tenant.primaryColor,
      accentColor: tenant.accentColor,
      sidebarColor: tenant.sidebarColor,
    });
  }
}
