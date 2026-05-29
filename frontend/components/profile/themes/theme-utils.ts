import type { CSSProperties } from "react";
import type { ExtractedFacts, FontChoice, GeneratedProfile } from "@/lib/types";

export interface ThemeProps {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  device?: "desktop" | "mobile";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PO";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const SANS = "var(--font-geist-sans), 'DM Sans', system-ui, sans-serif";
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const MONO = "var(--font-geist-mono), 'DM Sans', monospace";

/** Override the theme's --sans/--serif CSS vars based on the chosen font.
 *  "mixed" returns {} so each theme keeps its native pairing. */
export function fontVars(font?: FontChoice): CSSProperties {
  const set = (sans: string, serif: string) =>
    ({ ["--sans"]: sans, ["--serif"]: serif }) as CSSProperties;
  switch (font) {
    case "sans":
      return set(SANS, SANS);
    case "serif":
      return set(SERIF, SERIF);
    case "mono":
      return set(MONO, MONO);
    default:
      return {};
  }
}
