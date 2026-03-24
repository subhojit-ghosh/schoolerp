import { DATABASE } from "@repo/backend-core";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppDatabase } from "@repo/database";
import { and, campus, eq, ne, organization } from "@repo/database";
import { APP_FALLBACKS, tenantBrandingSchema } from "@repo/contracts";
import { STATUS } from "../../constants";

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
  brandingVersion: 0,
});

@Injectable()
export class TenantContextService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly configService: ConfigService,
  ) {}

  private getRootHost() {
    return this.configService
      .get<string>("app.rootHost", APP_FALLBACKS.ROOT_HOST)
      .toLowerCase();
  }

  private getRootDomain() {
    return this.configService
      .get<string>("app.rootDomain", APP_FALLBACKS.ROOT_DOMAIN)
      .toLowerCase();
  }

  async isManagedHostname(host: string) {
    const hostname = host.split(":")[0].toLowerCase();

    if (hostname === this.getRootHost()) {
      return true;
    }

    if (hostname.endsWith(`.${this.getRootDomain()}`)) {
      return true;
    }

    const [row] = await this.db
      .select({
        id: organization.id,
        status: organization.status,
      })
      .from(organization)
      .where(eq(organization.customDomain, hostname))
      .limit(1);

    return Boolean(row && row.status !== STATUS.ORG.DELETED);
  }

  resolveTenantSlug(host: string | undefined, tenantQuery: string | undefined) {
    if (tenantQuery) {
      return tenantQuery;
    }

    if (!host) {
      return undefined;
    }

    const hostname = host.split(":")[0].toLowerCase();

    if (LOCAL_HOSTS.has(hostname) || hostname === this.getRootHost()) {
      return undefined;
    }

    const tenantSuffix = `.${this.getRootDomain()}`;
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
        brandingVersion: organization.brandingVersion,
        status: organization.status,
      })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    if (!row || row.status === STATUS.ORG.DELETED) {
      return null;
    }

    return row;
  }

  async resolveInstitutionFromHost(host: string | undefined) {
    if (!host) {
      return null;
    }

    const hostname = host.split(":")[0].toLowerCase();

    if (LOCAL_HOSTS.has(hostname) || hostname === this.getRootHost()) {
      return null;
    }

    const tenantSuffix = `.${this.getRootDomain()}`;
    const isSubdomain = hostname.endsWith(tenantSuffix);

    if (isSubdomain) {
      const slug = hostname.slice(0, -tenantSuffix.length);
      if (!slug) return null;
      return this.getOrganizationBySlug(slug);
    }

    // Custom domain: check customDomain column
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
        brandingVersion: organization.brandingVersion,
        status: organization.status,
      })
      .from(organization)
      .where(eq(organization.customDomain, hostname))
      .limit(1);

    if (!row || row.status === STATUS.ORG.DELETED) {
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
          ne(campus.status, STATUS.CAMPUS.DELETED),
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
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );
  }

  async getTenantBranding(
    host: string | undefined,
    tenantQuery: string | undefined,
  ) {
    const tenant = tenantQuery
      ? await this.getOrganizationBySlug(tenantQuery)
      : await this.resolveInstitutionFromHost(host);

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
      fontHeading: tenant.fontHeading,
      fontBody: tenant.fontBody,
      fontMono: tenant.fontMono,
      borderRadius: tenant.borderRadius,
      uiDensity: tenant.uiDensity,
      brandingVersion: tenant.brandingVersion,
    });
  }
}
