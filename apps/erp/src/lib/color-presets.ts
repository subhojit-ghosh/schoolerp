export type ColorPreset = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
};

export const COLOR_PRESETS: ColorPreset[] = [
  {
    // Deep navy sidebar + rich navy primary + antique gold — classic academic institution
    id: "prestige",
    name: "Prestige",
    primaryColor: "#1e3a5f",
    accentColor: "#c8a84a",
    sidebarColor: "#0c1a2e",
  },
  {
    // Near-black wine sidebar + deep crimson primary + warm coral — heritage school
    id: "crimson",
    name: "Crimson",
    primaryColor: "#7c1c2e",
    accentColor: "#e07c5a",
    sidebarColor: "#18060f",
  },
  {
    // Deep forest sidebar + rich green primary + jade teal — grounded, modern
    id: "sage",
    name: "Sage",
    primaryColor: "#14573a",
    accentColor: "#4daf9e",
    sidebarColor: "#0a2214",
  },
  {
    // Midnight blue sidebar + sapphire primary + sky accent — STEM/modern
    id: "sapphire",
    name: "Sapphire",
    primaryColor: "#1a3fa8",
    accentColor: "#4db8e8",
    sidebarColor: "#091525",
  },
  {
    // Deep indigo sidebar + indigo primary + soft violet — creative/arts
    id: "indigo",
    name: "Indigo",
    primaryColor: "#3730a3",
    accentColor: "#8b83f7",
    sidebarColor: "#14123a",
  },
  {
    // Dark warm brown sidebar + terracotta primary + leaf green — traditional Indian
    id: "terracotta",
    name: "Terracotta",
    primaryColor: "#8a5a44",
    accentColor: "#6aad72",
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
