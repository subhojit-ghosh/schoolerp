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
    id: "architect",
    name: "Architect",
    description: "Structured meets refined. Geometric precision in headings with warm, readable body text.",
    fontHeading: "Outfit",
    fontBody: "Libre Baskerville",
    fontMono: "IBM Plex Mono",
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Academic clarity. Warm serif headings with a clean, legible body — built for long reading.",
    fontHeading: "Merriweather",
    fontBody: "Source Sans 3",
    fontMono: "Source Code Pro",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Ultra-clean. One neutral typeface for everything — sharp, minimal, distraction-free.",
    fontHeading: "Inter",
    fontBody: "Inter",
    fontMono: "Fira Code",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Elegant and authoritative. Display headings with a refined serif body for a premium feel.",
    fontHeading: "Playfair Display",
    fontBody: "Source Serif 4",
    fontMono: "JetBrains Mono",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Literary and warm. Expressive display headings with a timeless serif body.",
    fontHeading: "DM Serif Display",
    fontBody: "Libre Baskerville",
    fontMono: "JetBrains Mono",
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
  const families = pairings.flatMap((p) => [p.fontHeading, p.fontBody, p.fontMono]);
  const unique = [...new Set(families)];
  const params = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
