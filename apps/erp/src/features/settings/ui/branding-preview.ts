import { useEffect } from "react";
import {
  contrastForeground,
  deriveSidebarTokens,
  deriveSurfaceTokens,
} from "@/lib/tenant-branding";
import {
  getRadiusValue,
  getSpacingValue,
  type DensityPreset,
  type RadiusPreset,
} from "@/lib/theme-presets";
import { BRANDING_HEX_COLOR_REGEX } from "@/features/settings/model/branding-form";

const PREVIEW_FALLBACK_FONT = "Noto Sans";
const BRANDING_PREVIEW_FONTS_LINK_ID = "branding-preview-fonts";

export function applyBrandingColorPreview(
  primary: string,
  accent: string,
  sidebar: string,
) {
  const root = document.querySelector(":root") as HTMLElement | null;

  if (!root) {
    return;
  }

  if (BRANDING_HEX_COLOR_REGEX.test(primary)) {
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", contrastForeground(primary));
    root.style.setProperty("--ring", primary);

    const surface = deriveSurfaceTokens(primary);
    root.style.setProperty("--background", surface.background);
    root.style.setProperty("--foreground", surface.foreground);
    root.style.setProperty("--card", surface.card);
    root.style.setProperty("--card-foreground", surface.foreground);
    root.style.setProperty("--muted", surface.muted);
    root.style.setProperty("--muted-foreground", surface.mutedForeground);
    root.style.setProperty("--border", surface.border);
    root.style.setProperty("--input", surface.input);
    root.style.setProperty("--secondary", surface.secondary);
    root.style.setProperty(
      "--secondary-foreground",
      surface.secondaryForeground,
    );
    root.style.setProperty("--popover", surface.card);
    root.style.setProperty("--popover-foreground", surface.foreground);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty(
      "--sidebar-primary-foreground",
      contrastForeground(primary),
    );
    root.style.setProperty("--sidebar-ring", primary);
  }

  if (BRANDING_HEX_COLOR_REGEX.test(accent)) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", contrastForeground(accent));
  }

  if (BRANDING_HEX_COLOR_REGEX.test(sidebar)) {
    const tokens = deriveSidebarTokens(sidebar);
    root.style.setProperty("--sidebar", tokens.background);
    root.style.setProperty("--sidebar-foreground", tokens.foreground);
    root.style.setProperty("--sidebar-accent", tokens.accent);
    root.style.setProperty(
      "--sidebar-accent-foreground",
      tokens.accentForeground,
    );
    root.style.setProperty("--sidebar-border", tokens.border);
    root.style.setProperty("--sidebar-rail", tokens.rail);
    root.style.setProperty("--sidebar-panel", tokens.panel);
    root.style.setProperty("--sidebar-item-active", tokens.itemActive);
  }
}

export function applyBrandingFontPreview(
  fontHeading: string | undefined,
  fontBody: string | undefined,
  fontMono: string | undefined,
) {
  const root = document.querySelector(":root") as HTMLElement | null;

  if (!root) {
    return;
  }

  if (fontHeading) {
    root.style.setProperty(
      "--font-heading",
      `'${fontHeading}', '${PREVIEW_FALLBACK_FONT}', system-ui, sans-serif`,
    );
  }

  if (fontBody) {
    root.style.setProperty(
      "--font-body",
      `'${fontBody}', '${PREVIEW_FALLBACK_FONT}', system-ui, sans-serif`,
    );
  }

  if (fontMono) {
    root.style.setProperty(
      "--font-mono",
      `'${fontMono}', '${PREVIEW_FALLBACK_FONT}', ui-monospace, monospace`,
    );
  }
}

export function applyBrandingDensityPreview(
  uiDensity: DensityPreset | undefined,
) {
  document.documentElement.style.setProperty(
    "--spacing",
    getSpacingValue(uiDensity),
  );
}

export function applyBrandingRadiusPreview(
  borderRadius: RadiusPreset | undefined,
) {
  const root = document.querySelector(":root") as HTMLElement | null;

  if (!root) {
    return;
  }

  root.style.setProperty("--radius", getRadiusValue(borderRadius));
}

export function useBrandingPreviewFonts(fontsUrl: string) {
  useEffect(() => {
    if (!fontsUrl) {
      return;
    }

    let link = document.getElementById(
      BRANDING_PREVIEW_FONTS_LINK_ID,
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.id = BRANDING_PREVIEW_FONTS_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    link.href = fontsUrl;

    return () => {
      document.getElementById(BRANDING_PREVIEW_FONTS_LINK_ID)?.remove();
    };
  }, [fontsUrl]);
}
