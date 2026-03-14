import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Separator } from "@repo/ui/components/ui/separator";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useUpdateBrandingMutation } from "@/features/settings/api/use-settings";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
  deriveSidebarTokens,
  deriveSurfaceTokens,
  contrastForeground,
} from "@/lib/tenant-branding";
import {
  FONT_PAIRINGS,
  buildPreviewFontsUrl,
  findPairingByFonts,
  type FontPairing,
} from "@/lib/font-pairings";
import { COLOR_PRESETS, findPresetByColors } from "@/lib/color-presets";
import {
  RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  getRadiusValue,
  getSpacingValue,
  type RadiusPreset,
  type DensityPreset,
} from "@/lib/theme-presets";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const HEX_COLOR_MESSAGE = "Must be a valid hex color";
const URL_MAX_LENGTH = 2048;

const brandingSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  shortName: z.string().trim().min(1, "Short name is required"),
  logoUrl: z.string().trim().max(URL_MAX_LENGTH).optional(),
  faviconUrl: z.string().trim().max(URL_MAX_LENGTH).optional(),
  primaryColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  accentColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  sidebarColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  fontMono: z.string().optional(),
  borderRadius: z.enum(["sharp", "default", "rounded", "pill"]).optional(),
  uiDensity: z.enum(["compact", "default", "comfortable"]).optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

const DEFAULT_COLORS = {
  primaryColor: "#8a5a44",
  accentColor: "#d59f6a",
  sidebarColor: "#32241c",
};

function getInitialValues(
  cached: ReturnType<typeof readCachedTenantBranding>,
  orgName: string | undefined,
  orgShortName: string | undefined,
): BrandingFormValues {
  return {
    name: cached?.institutionName ?? orgName ?? "",
    shortName: cached?.shortName ?? orgShortName ?? "",
    logoUrl: cached?.logoUrl ?? "",
    faviconUrl: cached?.faviconUrl ?? "",
    primaryColor: cached?.primaryColor ?? DEFAULT_COLORS.primaryColor,
    accentColor: cached?.accentColor ?? DEFAULT_COLORS.accentColor,
    sidebarColor: cached?.sidebarColor ?? DEFAULT_COLORS.sidebarColor,
    fontHeading: cached?.fontHeading ?? FONT_PAIRINGS[0]!.fontHeading,
    fontBody: cached?.fontBody ?? FONT_PAIRINGS[0]!.fontBody,
    fontMono: cached?.fontMono ?? FONT_PAIRINGS[0]!.fontMono,
    borderRadius: (cached?.borderRadius as RadiusPreset | null) ?? "default",
    uiDensity: (cached?.uiDensity as DensityPreset | null) ?? "default",
  };
}

function applyColorPreview(primary: string, accent: string, sidebar: string) {
  const root = document.querySelector(":root") as HTMLElement | null;
  if (!root) return;
  if (HEX_COLOR_REGEX.test(primary)) {
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
  }
  if (HEX_COLOR_REGEX.test(accent)) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", contrastForeground(accent));
  }
  if (HEX_COLOR_REGEX.test(sidebar)) {
    const tokens = deriveSidebarTokens(sidebar);
    root.style.setProperty("--sidebar", tokens.background);
    root.style.setProperty("--sidebar-foreground", tokens.foreground);
    root.style.setProperty("--sidebar-accent", tokens.accent);
    root.style.setProperty(
      "--sidebar-accent-foreground",
      tokens.accentForeground,
    );
    root.style.setProperty("--sidebar-border", tokens.border);
  }
  if (HEX_COLOR_REGEX.test(primary)) {
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty(
      "--sidebar-primary-foreground",
      contrastForeground(primary),
    );
    root.style.setProperty("--sidebar-ring", primary);
  }
}

function applyFontPreview(
  fontHeading: string | undefined,
  fontBody: string | undefined,
  fontMono: string | undefined,
) {
  const root = document.querySelector(":root") as HTMLElement | null;
  if (!root) return;
  if (fontHeading)
    root.style.setProperty(
      "--font-heading",
      `'${fontHeading}', 'Noto Sans', system-ui, sans-serif`,
    );
  if (fontBody)
    root.style.setProperty(
      "--font-body",
      `'${fontBody}', 'Noto Sans', system-ui, sans-serif`,
    );
  if (fontMono)
    root.style.setProperty(
      "--font-mono",
      `'${fontMono}', 'Noto Sans', ui-monospace, monospace`,
    );
}

export function BrandingPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const updateBranding = useUpdateBrandingMutation(institutionId);

  const { control, handleSubmit, setValue } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: getInitialValues(
      readCachedTenantBranding(),
      session?.activeOrganization?.name,
      session?.activeOrganization?.shortName,
    ),
  });

  const {
    primaryColor,
    accentColor,
    sidebarColor,
    fontHeading,
    fontBody,
    fontMono,
    borderRadius,
    uiDensity,
  } = useWatch({ control });
  const previewPrimaryColor = primaryColor ?? DEFAULT_COLORS.primaryColor;
  const previewAccentColor = accentColor ?? DEFAULT_COLORS.accentColor;
  const previewSidebarColor = sidebarColor ?? DEFAULT_COLORS.sidebarColor;
  const previewBorderRadius = borderRadius ?? "default";
  const previewUiDensity = uiDensity ?? "default";

  useEffect(() => {
    applyColorPreview(
      previewPrimaryColor,
      previewAccentColor,
      previewSidebarColor,
    );
  }, [previewPrimaryColor, previewAccentColor, previewSidebarColor]);

  useEffect(() => {
    applyFontPreview(fontHeading, fontBody, fontMono);
  }, [fontHeading, fontBody, fontMono]);

  useEffect(() => {
    const root = document.querySelector(":root") as HTMLElement | null;
    if (root)
      root.style.setProperty("--radius", getRadiusValue(previewBorderRadius));
  }, [previewBorderRadius]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--spacing",
      getSpacingValue(previewUiDensity),
    );
  }, [previewUiDensity]);

  function onSubmit(values: BrandingFormValues) {
    updateBranding.mutate(values, {
      onSuccess: () => {
        const cached = readCachedTenantBranding();
        const updated = {
          ...(cached ?? {
            tenantSlug: session?.activeOrganization?.slug ?? "",
          }),
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
        cacheTenantBranding(updated);
        applyTenantBranding(updated);
        toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.SETTINGS), {
          description: ERP_TOAST_MESSAGES.reloadToApplyBranding,
        });
      },
      onError: () => {
        toast.error(ERP_TOAST_MESSAGES.saveFailed);
      },
    });
  }

  const selectedPairing = findPairingByFonts(
    fontHeading ?? null,
    fontBody ?? null,
  );
  const selectedPreset = findPresetByColors(
    previewPrimaryColor,
    previewAccentColor,
    previewSidebarColor,
  );

  function handlePairingSelect(pairing: FontPairing) {
    setValue("fontHeading", pairing.fontHeading);
    setValue("fontBody", pairing.fontBody);
    setValue("fontMono", pairing.fontMono);
  }

  return (
    <div className="p-6 max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Identity */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Identity</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Name, logo and favicon shown across the app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Display Name</FieldLabel>
                  <Input {...field} placeholder="Springfield Academy" />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="shortName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Short Name</FieldLabel>
                  <Input {...field} placeholder="SA" />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="logoUrl"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Logo URL</FieldLabel>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com/logo.png"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="faviconUrl"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Favicon URL</FieldLabel>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* Colors */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Colors</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Brand colors applied across buttons, sidebar, and accents. Changes
              preview in real time.
            </p>
          </div>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setValue("primaryColor", preset.primaryColor);
                    setValue("accentColor", preset.accentColor);
                    setValue("sidebarColor", preset.sidebarColor);
                  }}
                  className={[
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                      : "border-border hover:border-primary/40 hover:bg-muted/50",
                  ].join(" ")}
                >
                  <span className="flex gap-0.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: preset.primaryColor }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: preset.accentColor }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: preset.sidebarColor }}
                    />
                  </span>
                  {preset.name}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <Controller
              control={control}
              name="primaryColor"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium w-16 shrink-0">Primary</p>
                  <ColorInput value={field.value} onChange={field.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />

            <Controller
              control={control}
              name="accentColor"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium w-16 shrink-0">Accent</p>
                  <ColorInput value={field.value} onChange={field.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />

            <Controller
              control={control}
              name="sidebarColor"
              render={({ field, fieldState }) => (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium w-16 shrink-0">Sidebar</p>
                  <ColorInput value={field.value} onChange={field.onChange} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* Typography */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Typography</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Font pairing applied across headings, body text, and code.
            </p>
          </div>

          <FontPairingPicker
            selected={selectedPairing}
            onSelect={handlePairingSelect}
            columns={2}
          />
        </section>

        <Separator />

        {/* Appearance */}
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Shape and density applied across the entire UI.
            </p>
          </div>

          <Controller
            control={control}
            name="borderRadius"
            render={({ field }) => (
              <Field>
                <FieldLabel>Shape</FieldLabel>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {RADIUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => field.onChange(option.id)}
                      className={[
                        "flex flex-col items-center gap-2 rounded-md border p-3 transition-colors",
                        field.value === option.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <div
                        className="h-8 w-8 border-2 border-current"
                        style={{ borderRadius: option.value }}
                      />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="uiDensity"
            render={({ field }) => (
              <Field>
                <FieldLabel>Density</FieldLabel>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {DENSITY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => field.onChange(option.id)}
                      className={[
                        "flex flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors",
                        field.value === option.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            )}
          />
        </section>

        <Button type="submit" disabled={updateBranding.isPending}>
          {updateBranding.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        className="h-10 w-14 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="h-10 flex-1 rounded border border-input bg-background px-3 text-sm font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}

function FontPairingPicker({
  selected,
  onSelect,
  columns = 1,
}: {
  selected: FontPairing | undefined;
  onSelect: (pairing: FontPairing) => void;
  columns?: 1 | 2;
}) {
  useEffect(() => {
    const url = buildPreviewFontsUrl(FONT_PAIRINGS);
    if (!url) return;

    const existing = document.getElementById("font-picker-preview-fonts");
    if (existing) return;

    const link = document.createElement("link");
    link.id = "font-picker-preview-fonts";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);

    return () => {
      document.getElementById("font-picker-preview-fonts")?.remove();
    };
  }, []);

  return (
    <div
      className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {FONT_PAIRINGS.map((pairing) => {
        const isSelected = selected?.id === pairing.id;
        return (
          <button
            key={pairing.id}
            type="button"
            onClick={() => onSelect(pairing)}
            className={[
              "rounded-lg border text-left px-4 py-3 transition-colors",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40 hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <span
                className="text-xl font-bold leading-tight tracking-tight"
                style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
              >
                {pairing.name}
              </span>
              {isSelected && (
                <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
              <span className="min-w-0">
                <span className="uppercase tracking-wider text-[10px]">
                  Heading
                </span>
                <br />
                <span
                  className="block truncate"
                  style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
                >
                  {pairing.fontHeading}
                </span>
              </span>
              <span className="min-w-0">
                <span className="uppercase tracking-wider text-[10px]">
                  Body
                </span>
                <br />
                <span
                  className="block truncate"
                  style={{ fontFamily: `'${pairing.fontBody}', serif` }}
                >
                  {pairing.fontBody}
                </span>
              </span>
              <span className="min-w-0">
                <span className="uppercase tracking-wider text-[10px]">
                  Mono
                </span>
                <br />
                <span
                  className="block truncate"
                  style={{ fontFamily: `'${pairing.fontMono}', monospace` }}
                >
                  {pairing.fontMono}
                </span>
              </span>
            </div>

            <p
              className="text-xs text-muted-foreground leading-relaxed"
              style={{ fontFamily: `'${pairing.fontBody}', serif` }}
            >
              {pairing.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
