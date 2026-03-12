import type { TenantBranding } from "@repo/contracts";
import { buildGoogleFontsUrl } from "./font-pairings";
import { getRadiusValue, getSpacingValue } from "./theme-presets";

const BRANDING_CACHE_KEY = "erp-tenant-branding";
const ROOT_SELECTOR = ":root";
const DOCUMENT_TITLE_SUFFIX = "ERP";
const DEFAULT_THEME_COLOR = "#f6efe6";
const TENANT_FONTS_LINK_ID = "tenant-fonts";

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mixToward(hex: string, target: number, t: number): string {
  const ch = (c: number) =>
    Math.round(c + (target - c) * t).toString(16).padStart(2, "0");
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

export function deriveSidebarTokens(hex: string) {
  const isDark = hexLuminance(hex) < 0.35;
  return {
    background: hex,
    foreground: isDark ? "#f0f0f0" : "#1a1a1a",
    accent: isDark ? mixToward(hex, 255, 0.15) : mixToward(hex, 0, 0.08),
    accentForeground: isDark ? "#f0f0f0" : "#1a1a1a",
    border: isDark ? mixToward(hex, 255, 0.1) : mixToward(hex, 0, 0.06),
  };
}

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

function injectTenantFonts(
  fontHeading: string | null,
  fontBody: string | null,
  fontMono: string | null,
) {
  const families = [fontHeading, fontBody, fontMono].filter(
    (f): f is string => Boolean(f),
  );

  if (families.length === 0) return;

  const url = buildGoogleFontsUrl(families);
  if (!url) return;

  let link = document.getElementById(TENANT_FONTS_LINK_ID) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.id = TENANT_FONTS_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  link.href = url;
}

function contrastForeground(hex: string): string {
  return hexLuminance(hex) < 0.45 ? "#f5f5f5" : "#1a1a1a";
}

export function applyTenantBranding(branding: TenantBranding) {
  const root = getRootElement();

  if (!root) {
    return;
  }

  root.style.setProperty("--primary", branding.primaryColor);
  root.style.setProperty("--primary-foreground", contrastForeground(branding.primaryColor));
  root.style.setProperty("--ring", branding.primaryColor);
  root.style.setProperty("--accent", branding.accentColor);
  root.style.setProperty("--accent-foreground", contrastForeground(branding.accentColor));

  const sidebar = deriveSidebarTokens(branding.sidebarColor);
  root.style.setProperty("--sidebar", sidebar.background);
  root.style.setProperty("--sidebar-foreground", sidebar.foreground);
  root.style.setProperty("--sidebar-accent", sidebar.accent);
  root.style.setProperty("--sidebar-accent-foreground", sidebar.accentForeground);
  root.style.setProperty("--sidebar-border", sidebar.border);

  if (branding.fontHeading || branding.fontBody || branding.fontMono) {
    injectTenantFonts(branding.fontHeading, branding.fontBody, branding.fontMono);

    if (branding.fontHeading) {
      root.style.setProperty(
        "--font-heading",
        `'${branding.fontHeading}', system-ui, sans-serif`,
      );
    }
    if (branding.fontBody) {
      root.style.setProperty(
        "--font-body",
        `'${branding.fontBody}', Georgia, serif`,
      );
    }
    if (branding.fontMono) {
      root.style.setProperty(
        "--font-mono",
        `'${branding.fontMono}', ui-monospace, monospace`,
      );
    }
  }

  document.title = `${branding.shortName} ${DOCUMENT_TITLE_SUFFIX}`;

  if (branding.faviconUrl) {
    upsertLink("icon", branding.faviconUrl);
    upsertLink("shortcut icon", branding.faviconUrl);
  }

  if (branding.logoUrl) {
    upsertLink("apple-touch-icon", branding.logoUrl);
  }

  upsertMeta("theme-color", branding.primaryColor || DEFAULT_THEME_COLOR);

  root.style.setProperty("--radius", getRadiusValue(branding.borderRadius));
  document.documentElement.style.setProperty(
    "--spacing",
    getSpacingValue(branding.uiDensity),
  );
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
