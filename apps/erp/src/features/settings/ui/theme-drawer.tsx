import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPalette } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
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
  applyFontPairing,
  BRANDING_DEFAULT_COLORS,
  brandingSchema,
  createBrandingMutationBody,
  createThemeOnlyBrandingValues,
  createUpdatedBranding,
  getBrandingInitialValues,
  type BrandingFormValues,
} from "@/features/settings/model/branding-form";
import {
  BrandingAppearanceSection,
  BrandingColorSection,
  CompactBrandingTypographySection,
} from "@/features/settings/ui/branding-controls";
import {
  applyBrandingColorPreview,
  applyBrandingDensityPreview,
  applyBrandingFontPreview,
  applyBrandingRadiusPreview,
} from "@/features/settings/ui/branding-preview";
import { findPresetByColors } from "@/lib/color-presets";
import { findPairingByFonts } from "@/lib/font-pairings";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

export function ThemeDrawer() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const cachedBranding = readCachedTenantBranding();
  const organization = {
    name: session?.activeOrganization?.name,
    shortName: session?.activeOrganization?.shortName,
    slug: session?.activeOrganization?.slug,
  };
  const updateBranding = useUpdateBrandingMutation(institutionId);

  const { control, handleSubmit, setValue } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: getBrandingInitialValues(cachedBranding, organization),
  });

  const {
    accentColor,
    borderRadius,
    fontBody,
    fontHeading,
    fontMono,
    primaryColor,
    sidebarColor,
    uiDensity,
  } = useWatch({ control });

  const previewPrimaryColor =
    primaryColor ?? BRANDING_DEFAULT_COLORS.primaryColor;
  const previewAccentColor = accentColor ?? BRANDING_DEFAULT_COLORS.accentColor;
  const previewSidebarColor =
    sidebarColor ?? BRANDING_DEFAULT_COLORS.sidebarColor;
  const previewBorderRadius = borderRadius ?? "default";
  const previewUiDensity = uiDensity ?? "default";
  const selectedPreset = findPresetByColors(
    previewPrimaryColor,
    previewAccentColor,
    previewSidebarColor,
  );
  const selectedPairing = findPairingByFonts(
    fontHeading ?? null,
    fontBody ?? null,
  );

  useEffect(() => {
    applyBrandingColorPreview(
      previewPrimaryColor,
      previewAccentColor,
      previewSidebarColor,
    );
  }, [previewAccentColor, previewPrimaryColor, previewSidebarColor]);

  useEffect(() => {
    applyBrandingFontPreview(fontHeading, fontBody, fontMono);
  }, [fontBody, fontHeading, fontMono]);

  useEffect(() => {
    applyBrandingRadiusPreview(previewBorderRadius);
  }, [previewBorderRadius]);

  useEffect(() => {
    applyBrandingDensityPreview(previewUiDensity);
  }, [previewUiDensity]);

  function onSubmit(values: BrandingFormValues) {
    const mergedValues = createThemeOnlyBrandingValues(
      values,
      cachedBranding,
      organization,
    );

    updateBranding.mutate(
      createBrandingMutationBody(mergedValues, cachedBranding, organization),
      {
        onSuccess: () => {
          const updated = createUpdatedBranding(
            mergedValues,
            cachedBranding,
            organization,
          );
          cacheTenantBranding(updated);
          applyTenantBranding(updated);
          toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.THEME));
        },
        onError: () => {
          toast.error(ERP_TOAST_MESSAGES.saveFailed);
        },
      },
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button aria-label="Customize theme" size="icon" variant="ghost">
          <IconPalette />
        </Button>
      </SheetTrigger>

      <SheetContent
        className="flex w-80 flex-col gap-0 p-0 sm:max-w-80"
        side="right"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Quick theme</SheetTitle>
          <SheetDescription>
            Update the current tenant palette and interface feel without
            leaving the page.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Colors
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preset-first palette controls for quick tenant updates.
                  </p>
                </div>
                <BrandingColorSection
                  compact
                  control={control}
                  selectedPresetId={selectedPreset?.id}
                  setValue={setValue}
                />
              </section>

              <section className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Typography
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Change the overall voice with one pairing.
                  </p>
                </div>
                <CompactBrandingTypographySection
                  onSelect={(pairing) => applyFontPairing(pairing, setValue)}
                  selectedPairing={selectedPairing}
                />
              </section>

              <section className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Appearance
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Corner radius and density adjust shell ergonomics.
                  </p>
                </div>
                <BrandingAppearanceSection compact control={control} />
              </section>
            </div>
          </div>

          <div className="border-t px-5 py-4">
            <Button
              className="w-full"
              disabled={updateBranding.isPending}
              type="submit"
            >
              {updateBranding.isPending ? "Saving..." : "Save theme"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
