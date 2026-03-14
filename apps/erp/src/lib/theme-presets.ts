export type RadiusPreset = "sharp" | "default" | "rounded" | "pill";
export type DensityPreset = "compact" | "default" | "comfortable";

export const RADIUS_OPTIONS = [
  { id: "sharp" as RadiusPreset, label: "Sharp", value: "0rem" },
  { id: "default" as RadiusPreset, label: "Default", value: "0.625rem" },
  { id: "rounded" as RadiusPreset, label: "Rounded", value: "1rem" },
  { id: "pill" as RadiusPreset, label: "Pill", value: "1.5rem" },
] as const;

export const DENSITY_OPTIONS = [
  {
    id: "compact" as DensityPreset,
    label: "Compact",
    description: "More data per screen",
    spacing: "0.2rem",
  },
  {
    id: "default" as DensityPreset,
    label: "Default",
    description: "Balanced layout",
    spacing: "0.25rem",
  },
  {
    id: "comfortable" as DensityPreset,
    label: "Comfortable",
    description: "More breathing room",
    spacing: "0.3rem",
  },
] as const;

export function getRadiusValue(
  preset: RadiusPreset | null | undefined,
): string {
  return RADIUS_OPTIONS.find((r) => r.id === preset)?.value ?? "0.625rem";
}

export function getSpacingValue(
  preset: DensityPreset | null | undefined,
): string {
  return DENSITY_OPTIONS.find((d) => d.id === preset)?.spacing ?? "0.25rem";
}
