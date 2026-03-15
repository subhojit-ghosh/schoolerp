import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrush,
  IconLetterCase,
  IconPalette,
  IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { EntityPagePrimaryAction } from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useUpdateBrandingMutation } from "@/features/settings/api/use-settings";
import {
  applyFontPairing,
  BRANDING_DEFAULT_COLORS,
  BRANDING_TABS,
  brandingSchema,
  createBrandingMutationBody,
  createUpdatedBranding,
  getBrandingInitialValues,
  type BrandingFormValues,
} from "@/features/settings/model/branding-form";
import {
  BrandingAppearanceSection,
  BrandingColorSection,
  BrandingIdentitySection,
  BrandingTypographySection,
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

const BRANDING_TAB_LABELS = {
  [BRANDING_TABS.IDENTITY]: {
    icon: IconLetterCase,
    title: "Identity",
  },
  [BRANDING_TABS.COLORS]: {
    icon: IconPalette,
    title: "Colors",
  },
  [BRANDING_TABS.TYPOGRAPHY]: {
    icon: IconBrush,
    title: "Typography",
  },
  [BRANDING_TABS.APPEARANCE]: {
    icon: IconSparkles,
    title: "Appearance",
  },
} as const;

export function BrandingPage() {
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
  const selectedPairing = findPairingByFonts(
    fontHeading ?? null,
    fontBody ?? null,
  );
  const selectedPreset = findPresetByColors(
    previewPrimaryColor,
    previewAccentColor,
    previewSidebarColor,
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
    updateBranding.mutate(
      createBrandingMutationBody(values, cachedBranding, organization),
      {
        onSuccess: () => {
          const updated = createUpdatedBranding(
            values,
            cachedBranding,
            organization,
          );
          cacheTenantBranding(updated);
          applyTenantBranding(updated);
          toast.success(
            ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.SETTINGS),
            {
              description: ERP_TOAST_MESSAGES.reloadToApplyBranding,
            },
          );
        },
        onError: () => {
          toast.error(ERP_TOAST_MESSAGES.saveFailed);
        },
      },
    );
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      <EntityListPage
        actions={
          <EntityPagePrimaryAction
            disabled={updateBranding.isPending}
            type="submit"
          >
            {updateBranding.isPending ? "Saving..." : "Save branding"}
          </EntityPagePrimaryAction>
        }
        description="Manage institution identity and theme tokens."
        title="Branding"
        toolbar={
          <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Changes preview live as you edit.
            </p>
          </div>
        }
      >
        <div className="p-5">
          <Tabs
            className="gap-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
            defaultValue={BRANDING_TABS.IDENTITY}
            orientation="vertical"
          >
            <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
              <TabsList
                className="h-auto w-full items-stretch justify-start gap-1 bg-transparent p-0"
                variant="default"
              >
                {Object.entries(BRANDING_TAB_LABELS).map(([tab, meta]) => {
                  const Icon = meta.icon;

                  return (
                    <TabsTrigger
                      key={tab}
                      className="h-auto min-h-12 justify-start rounded-lg px-3 py-3 text-sm"
                      value={tab}
                    >
                      <div className="flex items-center gap-2">
                        <Icon />
                        <span>{meta.title}</span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="min-w-0">
              <TabsContent className="mt-0" value={BRANDING_TABS.IDENTITY}>
                <BrandingSectionFrame
                  description="Display name, short name, logo, and favicon appear across the app shell and browser surfaces."
                  title="Identity"
                >
                  <BrandingIdentitySection control={control} />
                </BrandingSectionFrame>
              </TabsContent>

              <TabsContent className="mt-0" value={BRANDING_TABS.COLORS}>
                <BrandingSectionFrame
                  description="Choose a preset or tune colors directly. The page background, actions, and sidebar update live."
                  title="Colors"
                >
                  <BrandingColorSection
                    control={control}
                    selectedPresetId={selectedPreset?.id}
                    setValue={setValue}
                  />
                </BrandingSectionFrame>
              </TabsContent>

              <TabsContent className="mt-0" value={BRANDING_TABS.TYPOGRAPHY}>
                <BrandingSectionFrame
                  description="Set the default voice of the product with one paired system for headings, body copy, and code."
                  title="Typography"
                >
                  <BrandingTypographySection
                    onSelect={(pairing) => applyFontPairing(pairing, setValue)}
                    selectedPairing={selectedPairing}
                  />
                </BrandingSectionFrame>
              </TabsContent>

              <TabsContent className="mt-0" value={BRANDING_TABS.APPEARANCE}>
                <BrandingSectionFrame
                  description="Shape and density keep tenant customization constrained to tokens instead of layout forks."
                  title="Appearance"
                >
                  <BrandingAppearanceSection control={control} />
                </BrandingSectionFrame>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </EntityListPage>
    </form>
  );
}

function BrandingSectionFrame({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
