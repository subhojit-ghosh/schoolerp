import type { TenantBranding } from "@repo/contracts";

const BRANDING_CACHE_KEY = "erp-tenant-branding";
const ROOT_SELECTOR = ":root";
const DOCUMENT_TITLE_SUFFIX = "ERP";
const DEFAULT_THEME_COLOR = "#f6efe6";

function getRootElement() {
  return document.querySelector(ROOT_SELECTOR) as HTMLElement | null;
}

function upsertLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
}

export function applyTenantBranding(branding: TenantBranding) {
  const root = getRootElement();

  if (!root) {
    return;
  }

  root.style.setProperty("--primary", branding.primaryColor);
  root.style.setProperty("--accent", branding.accentColor);
  root.style.setProperty("--sidebar-primary", branding.sidebarColor);

  document.title = `${branding.shortName} ${DOCUMENT_TITLE_SUFFIX}`;

  if (branding.faviconUrl) {
    upsertLink("icon", branding.faviconUrl);
    upsertLink("shortcut icon", branding.faviconUrl);
  }

  if (branding.logoUrl) {
    upsertLink("apple-touch-icon", branding.logoUrl);
  }

  upsertMeta("theme-color", branding.primaryColor || DEFAULT_THEME_COLOR);
}

export function cacheTenantBranding(branding: TenantBranding) {
  localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
}

export function readCachedTenantBranding() {
  const cachedValue = localStorage.getItem(BRANDING_CACHE_KEY);

  if (!cachedValue) {
    return null;
  }

  try {
    return JSON.parse(cachedValue) as TenantBranding;
  } catch {
    localStorage.removeItem(BRANDING_CACHE_KEY);

    return null;
  }
}
