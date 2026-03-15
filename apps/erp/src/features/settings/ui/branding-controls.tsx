import {
  Controller,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { cn } from "@repo/ui/lib/utils";
import { COLOR_PRESETS } from "@/lib/color-presets";
import {
  buildPreviewFontsUrl,
  FONT_PAIRINGS,
  type FontPairing,
} from "@/lib/font-pairings";
import { DENSITY_OPTIONS, RADIUS_OPTIONS } from "@/lib/theme-presets";
import { type BrandingFormValues } from "@/features/settings/model/branding-form";
import { useBrandingPreviewFonts } from "@/features/settings/ui/branding-preview";

type BrandingIdentitySectionProps = {
  control: Control<BrandingFormValues>;
};

export function BrandingIdentitySection({
  control,
}: BrandingIdentitySectionProps) {
  return (
    <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Display Name</FieldLabel>
            <FieldContent>
              <Input {...field} aria-invalid={fieldState.invalid} />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="shortName"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Short Name</FieldLabel>
            <FieldContent>
              <Input {...field} aria-invalid={fieldState.invalid} />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="logoUrl"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Logo URL</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                placeholder="https://example.com/logo.png"
                type="url"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="faviconUrl"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Favicon URL</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                placeholder="https://example.com/favicon.ico"
                type="url"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
    </FieldGroup>
  );
}

type BrandingColorSectionProps = {
  compact?: boolean;
  control: Control<BrandingFormValues>;
  selectedPresetId?: string;
  setValue: UseFormSetValue<BrandingFormValues>;
};

export function BrandingColorSection({
  compact = false,
  control,
  selectedPresetId,
  setValue,
}: BrandingColorSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn("flex flex-wrap gap-2", compact && "grid grid-cols-2")}
      >
        {COLOR_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;

          return (
            <Button
              key={preset.id}
              className={cn(
                "h-auto rounded-xl border px-3 py-2 text-left font-normal shadow-none",
                compact && "w-full justify-start",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/60",
              )}
              onClick={() => {
                setValue("primaryColor", preset.primaryColor);
                setValue("accentColor", preset.accentColor);
                setValue("sidebarColor", preset.sidebarColor);
              }}
              type="button"
              variant="ghost"
            >
              <span className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: preset.sidebarColor }}
                  />
                </span>
                <span>{preset.name}</span>
              </span>
            </Button>
          );
        })}
      </div>

      <FieldGroup
        className={cn("grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-3")}
      >
        <Controller
          control={control}
          name="primaryColor"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Primary</FieldLabel>
              <FieldContent>
                <ColorInput value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="accentColor"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Accent</FieldLabel>
              <FieldContent>
                <ColorInput value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="sidebarColor"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Sidebar</FieldLabel>
              <FieldContent>
                <ColorInput value={field.value} onChange={field.onChange} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
}

type BrandingTypographySectionProps = {
  selectedPairing?: FontPairing;
  onSelect: (pairing: FontPairing) => void;
};

export function BrandingTypographySection({
  selectedPairing,
  onSelect,
}: BrandingTypographySectionProps) {
  useBrandingPreviewFonts(buildPreviewFontsUrl(FONT_PAIRINGS));

  return (
    <div className="grid gap-3">
      {FONT_PAIRINGS.map((pairing) => {
        const isSelected = pairing.id === selectedPairing?.id;

        return (
          <button
            key={pairing.id}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/35 hover:bg-muted/40",
            )}
            onClick={() => onSelect(pairing)}
            type="button"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-2xl leading-none font-semibold tracking-tight"
                  style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
                >
                  {pairing.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pairing.description}
                </p>
              </div>
              <span
                className={cn(
                  "mt-1 size-2 rounded-full bg-border",
                  isSelected && "bg-primary",
                )}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Heading
                </p>
                <p
                  className="truncate text-sm font-medium"
                  style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
                >
                  {pairing.fontHeading}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Body
                </p>
                <p
                  className="truncate text-sm font-medium"
                  style={{ fontFamily: `'${pairing.fontBody}', sans-serif` }}
                >
                  {pairing.fontBody}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Mono
                </p>
                <p
                  className="truncate text-sm font-medium"
                  style={{ fontFamily: `'${pairing.fontMono}', monospace` }}
                >
                  {pairing.fontMono}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

type BrandingAppearanceSectionProps = {
  compact?: boolean;
  control: Control<BrandingFormValues>;
};

export function BrandingAppearanceSection({
  compact = false,
  control,
}: BrandingAppearanceSectionProps) {
  return (
    <div
      className={cn("grid gap-6", compact ? "grid-cols-1" : "xl:grid-cols-2")}
    >
      <Controller
        control={control}
        name="borderRadius"
        render={({ field }) => (
          <Field>
            <FieldLabel>Shape</FieldLabel>
            <FieldContent>
              <div
                className={cn(
                  "grid gap-3",
                  compact ? "grid-cols-4 gap-2" : "grid-cols-2 sm:grid-cols-4",
                )}
              >
                {RADIUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                      compact && "gap-1 rounded-xl p-2",
                      field.value === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/35 hover:bg-muted/40",
                    )}
                    onClick={() => field.onChange(option.id)}
                    type="button"
                  >
                    <div
                      className={cn(
                        "size-10 border-2 border-current",
                        compact && "size-7",
                      )}
                      style={{ borderRadius: option.value }}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        compact && "text-[11px] leading-tight",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="uiDensity"
        render={({ field }) => (
          <Field>
            <FieldLabel>Density</FieldLabel>
            <FieldContent>
              <div className={cn("grid gap-3", compact && "grid-cols-1")}>
                {DENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition-colors",
                      field.value === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/35 hover:bg-muted/40",
                    )}
                    onClick={() => field.onChange(option.id)}
                    type="button"
                  >
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </FieldContent>
          </Field>
        )}
      />
    </div>
  );
}

type CompactBrandingTypographySectionProps = {
  selectedPairing?: FontPairing;
  onSelect: (pairing: FontPairing) => void;
};

export function CompactBrandingTypographySection({
  selectedPairing,
  onSelect,
}: CompactBrandingTypographySectionProps) {
  useBrandingPreviewFonts(buildPreviewFontsUrl(FONT_PAIRINGS));

  return (
    <div className="space-y-2">
      {FONT_PAIRINGS.map((pairing) => {
        const isSelected = selectedPairing?.id === pairing.id;

        return (
          <button
            key={pairing.id}
            className={cn(
              "w-full rounded-xl border px-3 py-3 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/35 hover:bg-muted/40",
            )}
            onClick={() => onSelect(pairing)}
            type="button"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: `'${pairing.fontHeading}', sans-serif` }}
              >
                {pairing.name}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full bg-border",
                  isSelected && "bg-primary",
                )}
              />
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {pairing.fontHeading} · {pairing.fontBody} · {pairing.fontMono}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-input bg-transparent p-0.5"
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
      <Input
        className="min-w-0 font-mono"
        maxLength={7}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#000000"
        value={value}
      />
    </div>
  );
}
