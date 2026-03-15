import { getCurrentTenantSlug, type TenantBranding } from "@repo/contracts";
import { buildGoogleFontsUrl } from "./font-pairings";
import { getRadiusValue, getSpacingValue } from "./theme-presets";

const BRANDING_CACHE_KEY_PREFIX = "erp-tenant-branding";
const ROOT_SELECTOR = ":root";
const DOCUMENT_TITLE_SUFFIX = "ERP";
const DEFAULT_THEME_COLOR = "#f6efe6";
const TENANT_FONTS_LINK_ID = "tenant-fonts";
const ROOT_CACHE_SCOPE = "root";

function getBrandingCacheKey() {
  const tenantSlug = getCurrentTenantSlug() ?? ROOT_CACHE_SCOPE;

  return `${BRANDING_CACHE_KEY_PREFIX}:${tenantSlug}`;
}

function hexLuminance(hex: string): number {
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = toLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = toLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = toLinear(parseInt(hex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(bgHex: string, fgHex: string): number {
  const l1 = hexLuminance(bgHex);
  const l2 = hexLuminance(fgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixToward(hex: string, target: number, t: number): string {
  const ch = (c: number) =>
    Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, "0");
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

// Extracts the hue (0–360) from a hex color for chromatic surface tinting.
function extractHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h =
    max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return Math.round(h * 60);
}

// Derives surface tokens tinted with the primary hue at high lightness.
// Cards stay pure white so they visually "pop" above the tinted page background.
export function deriveSurfaceTokens(primaryHex: string) {
  const h = extractHue(primaryHex);
  return {
    background: `hsl(${h} 22% 97%)`,
    card: `hsl(${h} 0% 100%)`,
    foreground: `hsl(${h} 8% 10%)`,
    muted: `hsl(${h} 18% 94%)`,
    mutedForeground: `hsl(${h} 10% 42%)`,
    border: `hsl(${h} 16% 88%)`,
    input: `hsl(${h} 16% 88%)`,
    secondary: `hsl(${h} 14% 94%)`,
    secondaryForeground: `hsl(${h} 20% 15%)`,
  };
}

export function deriveSidebarTokens(hex: string) {
  const fg = contrastForeground(hex);
  const isDark = hexLuminance(hex) < 0.18;
  return {
    background: hex,
    foreground: fg,
    accent: isDark ? mixToward(hex, 255, 0.28) : mixToward(hex, 0, 0.14),
    accentForeground: fg,
    border: isDark ? mixToward(hex, 255, 0.12) : mixToward(hex, 0, 0.08),
  };
}

function getRootElement() {
  return document.querySelector(ROOT_SELECTOR) as HTMLElement | null;
}

function upsertLink(rel: string, href: string) {
  let link = document.querySelector(
    `link[rel='${rel}']`,
  ) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(
    `meta[name='${name}']`,
  ) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
}

const INDIC_FALLBACK_FONT = "Noto Sans";

function injectTenantFonts(
  fontHeading: string | null,
  fontBody: string | null,
  fontMono: string | null,
) {
  // Always include Noto Sans for Devanagari, Bengali, and other Indic script coverage.
  const families = [
    fontHeading,
    fontBody,
    fontMono,
    INDIC_FALLBACK_FONT,
  ].filter((f): f is string => Boolean(f));

  const url = buildGoogleFontsUrl(families);
  if (!url) return;

  let link = document.getElementById(
    TENANT_FONTS_LINK_ID,
  ) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.id = TENANT_FONTS_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  link.href = url;
}

export function contrastForeground(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#1a1a1a")
    ? "#ffffff"
    : "#1a1a1a";
}

export function applyTenantBranding(branding: TenantBranding) {
  const root = getRootElement();

  if (!root) {
    return;
  }

  root.style.setProperty("--primary", branding.primaryColor);
  root.style.setProperty(
    "--primary-foreground",
    contrastForeground(branding.primaryColor),
  );
  root.style.setProperty("--ring", branding.primaryColor);
  root.style.setProperty("--accent", branding.accentColor);
  root.style.setProperty(
    "--accent-foreground",
    contrastForeground(branding.accentColor),
  );

  const surface = deriveSurfaceTokens(branding.primaryColor);
  root.style.setProperty("--background", surface.background);
  root.style.setProperty("--foreground", surface.foreground);
  root.style.setProperty("--card", surface.card);
  root.style.setProperty("--card-foreground", surface.foreground);
  root.style.setProperty("--muted", surface.muted);
  root.style.setProperty("--muted-foreground", surface.mutedForeground);
  root.style.setProperty("--border", surface.border);
  root.style.setProperty("--input", surface.input);
  root.style.setProperty("--secondary", surface.secondary);
  root.style.setProperty("--secondary-foreground", surface.secondaryForeground);
  root.style.setProperty("--popover", surface.card);
  root.style.setProperty("--popover-foreground", surface.foreground);

  const sidebar = deriveSidebarTokens(branding.sidebarColor);
  root.style.setProperty("--sidebar", sidebar.background);
  root.style.setProperty("--sidebar-foreground", sidebar.foreground);
  root.style.setProperty("--sidebar-primary", branding.primaryColor);
  root.style.setProperty(
    "--sidebar-primary-foreground",
    contrastForeground(branding.primaryColor),
  );
  root.style.setProperty("--sidebar-accent", sidebar.accent);
  root.style.setProperty(
    "--sidebar-accent-foreground",
    sidebar.accentForeground,
  );
  root.style.setProperty("--sidebar-border", sidebar.border);
  root.style.setProperty("--sidebar-ring", branding.primaryColor);

  // Always load fonts — even if no custom fonts are set, Noto Sans must be fetched
  // so Devanagari and Bengali characters render correctly as a baseline.
  injectTenantFonts(branding.fontHeading, branding.fontBody, branding.fontMono);

  if (branding.fontHeading || branding.fontBody || branding.fontMono) {
    if (branding.fontHeading) {
      root.style.setProperty(
        "--font-heading",
        `'${branding.fontHeading}', '${INDIC_FALLBACK_FONT}', system-ui, sans-serif`,
      );
    }
    if (branding.fontBody) {
      root.style.setProperty(
        "--font-body",
        `'${branding.fontBody}', '${INDIC_FALLBACK_FONT}', system-ui, sans-serif`,
      );
    }
    if (branding.fontMono) {
      root.style.setProperty(
        "--font-mono",
        `'${branding.fontMono}', '${INDIC_FALLBACK_FONT}', ui-monospace, monospace`,
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
  localStorage.setItem(getBrandingCacheKey(), JSON.stringify(branding));
}

export function readCachedTenantBranding() {
  const cachedValue = localStorage.getItem(getBrandingCacheKey());

  if (!cachedValue) {
    return null;
  }

  try {
    return JSON.parse(cachedValue) as TenantBranding;
  } catch {
    localStorage.removeItem(getBrandingCacheKey());

    return null;
  }
}
