export type ColorPreset = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
};

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "prestige",
    name: "Prestige",
    primaryColor: "#1e3a5f",
    accentColor: "#c9a84c",
    sidebarColor: "#0f1f33",
  },
  {
    id: "crimson",
    name: "Crimson",
    primaryColor: "#7c1c2e",
    accentColor: "#d4a853",
    sidebarColor: "#3d0e17",
  },
  {
    id: "sage",
    name: "Sage",
    primaryColor: "#1a5c38",
    accentColor: "#e8a838",
    sidebarColor: "#0d3320",
  },
  {
    id: "sapphire",
    name: "Sapphire",
    primaryColor: "#1e40af",
    accentColor: "#38bdf8",
    sidebarColor: "#172554",
  },
  {
    id: "indigo",
    name: "Indigo",
    primaryColor: "#3730a3",
    accentColor: "#a78bfa",
    sidebarColor: "#1e1b4b",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    primaryColor: "#8a5a44",
    accentColor: "#d59f6a",
    sidebarColor: "#32241c",
  },
];

export function findPresetByColors(
  primaryColor: string,
  accentColor: string,
  sidebarColor: string,
): ColorPreset | undefined {
  return COLOR_PRESETS.find(
    (p) =>
      p.primaryColor === primaryColor &&
      p.accentColor === accentColor &&
      p.sidebarColor === sidebarColor,
  );
}
