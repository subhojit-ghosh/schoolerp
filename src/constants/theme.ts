export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type ThemeMode = (typeof THEMES)[keyof typeof THEMES];

export const THEME_LABELS: Record<ThemeMode, string> = {
  [THEMES.LIGHT]: "Light",
  [THEMES.DARK]: "Dark",
  [THEMES.SYSTEM]: "System",
};

export const THEME_TOGGLE = {
  LABEL: "Toggle theme",
} as const;
