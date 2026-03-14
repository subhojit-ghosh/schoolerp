export type FontPairing = {
  id: string;
  name: string;
  description: string;
  fontHeading: string;
  fontBody: string;
  fontMono: string;
};

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "clarity",
    name: "Clarity",
    description:
      "Clean and data-focused. Geometric headings with a UI-optimised sans body — excellent in tables and forms.",
    fontHeading: "Outfit",
    fontBody: "DM Sans",
    fontMono: "IBM Plex Mono",
  },
  {
    id: "scholar",
    name: "Scholar",
    description:
      "Academic authority. Sturdy serif headings with a clean, highly legible sans body.",
    fontHeading: "Merriweather",
    fontBody: "Source Sans 3",
    fontMono: "Source Code Pro",
  },
  {
    id: "modern",
    name: "Modern",
    description:
      "Pure interface font. One neutral typeface across everything — sharp, minimal, distraction-free.",
    fontHeading: "Inter",
    fontBody: "Inter",
    fontMono: "Fira Code",
  },
  {
    id: "prestige",
    name: "Prestige",
    description:
      "Premium institutional. High-contrast display headings with a neutral, highly legible body.",
    fontHeading: "Playfair Display",
    fontBody: "Lato",
    fontMono: "JetBrains Mono",
  },
  {
    id: "heritage",
    name: "Heritage",
    description:
      "Warm and approachable. Elegant serif headings with a friendly, rounded sans body.",
    fontHeading: "Lora",
    fontBody: "Nunito Sans",
    fontMono: "IBM Plex Mono",
  },
];

export const DEFAULT_FONT_PAIRING = FONT_PAIRINGS[0]!;

export function findPairingByFonts(
  fontHeading: string | null,
  fontBody: string | null,
): FontPairing | undefined {
  return FONT_PAIRINGS.find(
    (p) => p.fontHeading === fontHeading && p.fontBody === fontBody,
  );
}

export function buildGoogleFontsUrl(families: string[]): string {
  const unique = [...new Set(families.filter(Boolean))];
  if (unique.length === 0) return "";
  const params = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function buildPreviewFontsUrl(pairings: FontPairing[]): string {
  const families = pairings.flatMap((p) => [
    p.fontHeading,
    p.fontBody,
    p.fontMono,
  ]);
  const unique = [...new Set(families)];
  const params = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
