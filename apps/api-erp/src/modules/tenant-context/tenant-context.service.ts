import { DATABASE } from "@repo/backend-core";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import { and, eq, isNull } from "drizzle-orm";
import { campus, organization } from "@repo/database";
import { APP_FALLBACKS, tenantBrandingSchema } from "@repo/contracts";

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
  fontHeading: "Outfit",
  fontBody: "Libre Baskerville",
  fontMono: "IBM Plex Mono",
  borderRadius: "default",
  uiDensity: "default",
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

    const hostname = host.split(":")[0].toLowerCase();

    if (LOCAL_HOSTS.has(hostname) || hostname === APP_FALLBACKS.ROOT_HOST) {
      return undefined;
    }

    const tenantSuffix = `.${APP_FALLBACKS.ROOT_DOMAIN}`;
    if (!hostname.endsWith(tenantSuffix)) {
      return undefined;
    }

    const tenantSlug = hostname.slice(0, -tenantSuffix.length);

    return tenantSlug || undefined;
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
        fontHeading: organization.fontHeading,
        fontBody: organization.fontBody,
        fontMono: organization.fontMono,
        borderRadius: organization.borderRadius,
        uiDensity: organization.uiDensity,
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
      throw new NotFoundException(`Organization not found for subdomain.`);
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
      fontHeading: tenant.fontHeading,
      fontBody: tenant.fontBody,
      fontMono: tenant.fontMono,
      borderRadius: tenant.borderRadius,
      uiDensity: tenant.uiDensity,
    });
  }
}
