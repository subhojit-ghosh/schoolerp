import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPalette, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useUpdateBrandingMutation } from "@/features/settings/api/use-settings";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
  deriveSidebarTokens,
  contrastForeground,
} from "@/lib/tenant-branding";
import {
  FONT_PAIRINGS,
  buildPreviewFontsUrl,
  findPairingByFonts,
  type FontPairing,
} from "@/lib/font-pairings";
import {
  RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  getRadiusValue,
  getSpacingValue,
  type RadiusPreset,
  type DensityPreset,
} from "@/lib/theme-presets";
import {
  COLOR_PRESETS,
  findPresetByColors,
} from "@/lib/color-presets";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const HEX_COLOR_MESSAGE = "Must be a valid hex color";

const themeSchema = z.object({
  primaryColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  accentColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  sidebarColor: z.string().regex(HEX_COLOR_REGEX, HEX_COLOR_MESSAGE),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  fontMono: z.string().optional(),
  borderRadius: z.enum(["sharp", "default", "rounded", "pill"]).optional(),
  uiDensity: z.enum(["compact", "default", "comfortable"]).optional(),
});

type ThemeFormValues = z.infer<typeof themeSchema>;

const DEFAULT_COLORS = {
  primaryColor: "#8a5a44",
  accentColor: "#d59f6a",
  sidebarColor: "#32241c",
};

function getInitialValues(): ThemeFormValues {
  const cached = readCachedTenantBranding();
  return {
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

export function ThemeDrawer() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const updateBranding = useUpdateBrandingMutation(institutionId);

  const { control, handleSubmit, watch, setValue } = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: getInitialValues(),
  });

  const {
    primaryColor, accentColor, sidebarColor,
    fontHeading, fontBody, fontMono,
    borderRadius, uiDensity,
  } = watch();

  useEffect(() => {
    const root = document.querySelector(":root") as HTMLElement | null;
    if (!root) return;
    if (HEX_COLOR_REGEX.test(primaryColor)) {
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--primary-foreground", contrastForeground(primaryColor));
      root.style.setProperty("--ring", primaryColor);
    }
    if (HEX_COLOR_REGEX.test(accentColor)) {
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--accent-foreground", contrastForeground(accentColor));
    }
    if (HEX_COLOR_REGEX.test(sidebarColor)) {
      const tokens = deriveSidebarTokens(sidebarColor);
      root.style.setProperty("--sidebar", tokens.background);
      root.style.setProperty("--sidebar-foreground", tokens.foreground);
      root.style.setProperty("--sidebar-accent", tokens.accent);
      root.style.setProperty("--sidebar-accent-foreground", tokens.accentForeground);
      root.style.setProperty("--sidebar-border", tokens.border);
    }
  }, [primaryColor, accentColor, sidebarColor]);

  useEffect(() => {
    const root = document.querySelector(":root") as HTMLElement | null;
    if (!root) return;
    if (fontHeading) root.style.setProperty("--font-heading", `'${fontHeading}', 'Noto Sans', system-ui, sans-serif`);
    if (fontBody) root.style.setProperty("--font-body", `'${fontBody}', 'Noto Sans', system-ui, sans-serif`);
    if (fontMono) root.style.setProperty("--font-mono", `'${fontMono}', 'Noto Sans', ui-monospace, monospace`);
  }, [fontHeading, fontBody, fontMono]);

  useEffect(() => {
    const root = document.querySelector(":root") as HTMLElement | null;
    if (root) root.style.setProperty("--radius", getRadiusValue(borderRadius));
  }, [borderRadius]);

  useEffect(() => {
    document.documentElement.style.setProperty("--spacing", getSpacingValue(uiDensity));
  }, [uiDensity]);

  function onSubmit(values: ThemeFormValues) {
    const cached = readCachedTenantBranding();

    updateBranding.mutate({
      name: cached?.institutionName ?? session?.activeOrganization?.name ?? "",
      shortName: cached?.shortName ?? session?.activeOrganization?.shortName ?? "",
      logoUrl: cached?.logoUrl ?? undefined,
      faviconUrl: cached?.faviconUrl ?? undefined,
      primaryColor: values.primaryColor,
      accentColor: values.accentColor,
      sidebarColor: values.sidebarColor,
      fontHeading: values.fontHeading,
      fontBody: values.fontBody,
      fontMono: values.fontMono,
      borderRadius: values.borderRadius,
      uiDensity: values.uiDensity,
    }, {
      onSuccess: () => {
        const updated = {
          ...(cached ?? {
            tenantSlug: session?.activeOrganization?.slug ?? "",
            fontHeading: null,
            fontBody: null,
            fontMono: null,
          }),
          institutionName:
            cached?.institutionName ?? session?.activeOrganization?.name ?? "",
          shortName:
            cached?.shortName ?? session?.activeOrganization?.shortName ?? "",
          logoUrl: cached?.logoUrl ?? null,
          faviconUrl: cached?.faviconUrl ?? null,
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
        toast.success("Theme saved.");
      },
      onError: () => {
        toast.error("Failed to save. Please try again.");
      },
    });
  }

  const selectedPairing = findPairingByFonts(fontHeading ?? null, fontBody ?? null);
  const selectedPreset = findPresetByColors(primaryColor, accentColor, sidebarColor);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Customize theme">
          <IconPalette className="size-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 sm:max-w-80 flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Customize Theme</SheetTitle>
          <SheetDescription>
            Colors and fonts preview instantly. Save to persist across sessions.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Colors */}
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Colors
              </p>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-1.5">
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
                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors text-left",
                        isSelected
                          ? "border-primary ring-1 ring-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span className="flex gap-0.5 shrink-0">
                        <span className="h-3.5 w-3.5 rounded-full" style={{ background: preset.primaryColor }} />
                        <span className="h-3.5 w-3.5 rounded-full" style={{ background: preset.accentColor }} />
                        <span className="h-3.5 w-3.5 rounded-full" style={{ background: preset.sidebarColor }} />
                      </span>
                      <span className="text-xs leading-none">{preset.name}</span>
                    </button>
                  );
                })}
              </div>

              <Controller
                control={control}
                name="primaryColor"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Primary</FieldLabel>
                    <ColorInput value={field.value} onChange={field.onChange} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="accentColor"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Accent</FieldLabel>
                    <ColorInput value={field.value} onChange={field.onChange} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="sidebarColor"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Sidebar</FieldLabel>
                    <ColorInput value={field.value} onChange={field.onChange} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </section>

            {/* Typography */}
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Typography
              </p>
              <CompactFontPairingPicker
                selected={selectedPairing}
                onSelect={(pairing) => {
                  setValue("fontHeading", pairing.fontHeading);
                  setValue("fontBody", pairing.fontBody);
                  setValue("fontMono", pairing.fontMono);
                }}
              />
            </section>

            {/* Appearance */}
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Appearance
              </p>

              <Controller
                control={control}
                name="borderRadius"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Shape</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {RADIUS_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => field.onChange(option.id)}
                          className={[
                            "flex flex-col items-center gap-1.5 rounded border p-2 transition-colors",
                            field.value === option.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40 hover:bg-muted/50",
                          ].join(" ")}
                        >
                          <div
                            className="h-6 w-6 border-2 border-current"
                            style={{ borderRadius: option.value }}
                          />
                          <span className="text-[10px]">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="uiDensity"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Density</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DENSITY_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => field.onChange(option.id)}
                          className={[
                            "flex flex-col gap-0.5 rounded border px-2 py-2 text-left transition-colors",
                            field.value === option.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40 hover:bg-muted/50",
                          ].join(" ")}
                        >
                          <span className="text-xs font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {option.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />
            </section>
          </div>

          <div className="px-5 py-4 border-t">
            <Button type="submit" className="w-full" disabled={updateBranding.isPending}>
              {updateBranding.isPending ? "Saving…" : "Save Theme"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CompactFontPairingPicker({
  selected,
  onSelect,
}: {
  selected: FontPairing | undefined;
  onSelect: (pairing: FontPairing) => void;
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
    <div className="space-y-2">
      {FONT_PAIRINGS.map((pairing) => {
        const isSelected = selected?.id === pairing.id;
        return (
          <button
            key={pairing.id}
            type="button"
            onClick={() => onSelect(pairing)}
            className={[
              "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40 hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-sm font-semibold leading-none"
                style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
              >
                {pairing.name}
              </span>
              {isSelected && (
                <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
            <p
              className="mt-1 text-xs text-muted-foreground truncate"
              title={`${pairing.fontHeading} · ${pairing.fontBody} · ${pairing.fontMono}`}
            >
              <span style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}>{pairing.fontHeading}</span>
              {" · "}
              <span style={{ fontFamily: `'${pairing.fontBody}', serif` }}>{pairing.fontBody}</span>
              {" · "}
              <span style={{ fontFamily: `'${pairing.fontMono}', monospace` }}>{pairing.fontMono}</span>
            </p>
          </button>
        );
      })}
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
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5 shrink-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="h-9 flex-1 rounded border border-input bg-background px-3 text-sm font-mono min-w-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}
