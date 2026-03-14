import type { UseFormSetValue } from "react-hook-form";
import type { TenantBranding } from "@repo/contracts";
import { z } from "zod";
import type { UpdateBrandingBody } from "@/features/settings/api/use-settings";
import {
  DEFAULT_FONT_PAIRING,
  type FontPairing,
} from "@/lib/font-pairings";
import type {
  DensityPreset,
  RadiusPreset,
} from "@/lib/theme-presets";

export const BRANDING_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const BRANDING_HEX_COLOR_MESSAGE = "Must be a valid hex color";
export const BRANDING_URL_MAX_LENGTH = 2048;

export const BRANDING_DEFAULT_COLORS = {
  primaryColor: "#8a5a44",
  accentColor: "#d59f6a",
  sidebarColor: "#32241c",
} as const;

export const BRANDING_TABS = {
  IDENTITY: "identity",
  COLORS: "colors",
  TYPOGRAPHY: "typography",
  APPEARANCE: "appearance",
} as const;

export const brandingSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  shortName: z.string().trim().min(1, "Short name is required"),
  logoUrl: z.string().trim().max(BRANDING_URL_MAX_LENGTH).optional(),
  faviconUrl: z.string().trim().max(BRANDING_URL_MAX_LENGTH).optional(),
  primaryColor: z
    .string()
    .regex(BRANDING_HEX_COLOR_REGEX, BRANDING_HEX_COLOR_MESSAGE),
  accentColor: z
    .string()
    .regex(BRANDING_HEX_COLOR_REGEX, BRANDING_HEX_COLOR_MESSAGE),
  sidebarColor: z
    .string()
    .regex(BRANDING_HEX_COLOR_REGEX, BRANDING_HEX_COLOR_MESSAGE),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  fontMono: z.string().optional(),
  borderRadius: z.enum(["sharp", "default", "rounded", "pill"]).optional(),
  uiDensity: z.enum(["compact", "default", "comfortable"]).optional(),
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;

export type BrandingOrganizationDefaults = {
  name?: string;
  shortName?: string;
  slug?: string;
};

export function getBrandingInitialValues(
  cached: TenantBranding | null,
  organization: BrandingOrganizationDefaults,
): BrandingFormValues {
  return {
    name: cached?.institutionName ?? organization.name ?? "",
    shortName: cached?.shortName ?? organization.shortName ?? "",
    logoUrl: cached?.logoUrl ?? "",
    faviconUrl: cached?.faviconUrl ?? "",
    primaryColor:
      cached?.primaryColor ?? BRANDING_DEFAULT_COLORS.primaryColor,
    accentColor: cached?.accentColor ?? BRANDING_DEFAULT_COLORS.accentColor,
    sidebarColor: cached?.sidebarColor ?? BRANDING_DEFAULT_COLORS.sidebarColor,
    fontHeading: cached?.fontHeading ?? DEFAULT_FONT_PAIRING.fontHeading,
    fontBody: cached?.fontBody ?? DEFAULT_FONT_PAIRING.fontBody,
    fontMono: cached?.fontMono ?? DEFAULT_FONT_PAIRING.fontMono,
    borderRadius: (cached?.borderRadius as RadiusPreset | null) ?? "default",
    uiDensity: (cached?.uiDensity as DensityPreset | null) ?? "default",
  };
}

export function createBrandingMutationBody(
  values: BrandingFormValues,
  cached: TenantBranding | null,
  _organization: BrandingOrganizationDefaults,
): UpdateBrandingBody {
  return {
    name: values.name,
    shortName: values.shortName,
    logoUrl: values.logoUrl || cached?.logoUrl || undefined,
    faviconUrl: values.faviconUrl || cached?.faviconUrl || undefined,
    primaryColor: values.primaryColor,
    accentColor: values.accentColor,
    sidebarColor: values.sidebarColor,
    fontHeading: values.fontHeading,
    fontBody: values.fontBody,
    fontMono: values.fontMono,
    borderRadius: values.borderRadius,
    uiDensity: values.uiDensity,
  };
}

export function createUpdatedBranding(
  values: BrandingFormValues,
  cached: TenantBranding | null,
  organization: BrandingOrganizationDefaults,
): TenantBranding {
  return {
    tenantSlug: cached?.tenantSlug ?? organization.slug ?? "",
    institutionName: values.name,
    shortName: values.shortName,
    logoUrl: values.logoUrl || null,
    faviconUrl: values.faviconUrl || null,
    primaryColor: values.primaryColor,
    accentColor: values.accentColor,
    sidebarColor: values.sidebarColor,
    fontHeading: values.fontHeading ?? null,
    fontBody: values.fontBody ?? null,
    fontMono: values.fontMono ?? null,
    borderRadius: values.borderRadius ?? null,
    uiDensity: values.uiDensity ?? null,
  };
}

export function createThemeOnlyBrandingValues(
  values: BrandingFormValues,
  cached: TenantBranding | null,
  organization: BrandingOrganizationDefaults,
): BrandingFormValues {
  return {
    ...getBrandingInitialValues(cached, organization),
    primaryColor: values.primaryColor,
    accentColor: values.accentColor,
    sidebarColor: values.sidebarColor,
    fontHeading: values.fontHeading,
    fontBody: values.fontBody,
    fontMono: values.fontMono,
    borderRadius: values.borderRadius,
    uiDensity: values.uiDensity,
  };
}

export function applyFontPairing(
  pairing: FontPairing,
  setValue: UseFormSetValue<BrandingFormValues>,
) {
  setValue("fontHeading", pairing.fontHeading);
  setValue("fontBody", pairing.fontBody);
  setValue("fontMono", pairing.fontMono);
}
