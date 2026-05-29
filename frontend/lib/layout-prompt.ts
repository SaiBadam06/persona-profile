import type { GeneratedProfile, LayoutBlock, LayoutBlockType, LayoutSpec } from "./types";

const BLOCK_TYPES: LayoutBlockType[] = [
  "hero", "about", "stats", "skills", "experience",
  "projects", "services", "testimonials", "faq", "quote", "chat", "contact",
];

export function buildLayoutSystemPrompt(): string {
  return [
    "You are a senior web art director designing a ONE-OF-A-KIND public profile page layout.",
    "You do NOT write code. You output a JSON layout spec that a renderer draws.",
    "Design for THIS person specifically: pick a colour palette, type style, density, hero treatment,",
    "and block order/columns that suit their field, tone, and goal. Make bold, tasteful choices.",
  ].join(" ");
}

export function buildLayoutUserPrompt(profile: GeneratedProfile): string {
  const available = profile.sections.length
    ? profile.sections.join(", ")
    : "About, Experience, Projects, Services, Chat, Contact";
  return [
    `Design a layout for: ${profile.name}, ${profile.role}. ${profile.headline}`,
    `Goal/eyebrow: ${profile.hero.eyebrow}. Tone: ${profile.tone}. Location: ${profile.location}.`,
    `Content available: ${available}. Has chat: ${profile.sections.includes("Chat")}. Booking: ${profile.booking.enabled}.`,
    "",
    "Return ONLY JSON of this exact shape:",
    `{
  "palette": { "bg": "#hex", "surface": "#hex", "ink": "#hex", "muted": "#hex", "accent": "#hex", "accentInk": "#hex" },
  "font": "serif" | "sans" | "mono" | "mixed",
  "density": "airy" | "balanced" | "compact",
  "radius": "sharp" | "soft" | "round",
  "heroVariant": "centered" | "split" | "dark-band" | "side-portrait" | "minimal",
  "blocks": [ { "type": <one of: ${BLOCK_TYPES.join(", ")}>, "heading": "string", "columns": 1|2|3 } ]
}`,
    "Rules: choose 5–9 blocks, ALWAYS start with a 'hero'. Only use the listed block types.",
    "Only include data blocks (experience/projects/services/skills/testimonials/faq) if that content exists.",
    "Include a 'chat' block if chat is available, and a 'contact' block near the end.",
    "palette must be 6 valid hex colours with strong contrast between 'ink' and 'bg'.",
  ].join("\n");
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fb);
const pick = <T extends string>(v: unknown, allowed: T[], fb: T): T =>
  typeof v === "string" && allowed.includes(v as T) ? (v as T) : fb;

export function validateLayoutSpec(raw: unknown): LayoutSpec | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const p = (r.palette ?? {}) as Record<string, unknown>;
  const rawBlocks = Array.isArray(r.blocks) ? r.blocks : [];
  const seen = new Set<LayoutBlockType>();

  const blocks: LayoutBlock[] = rawBlocks
    .map((b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      if (!BLOCK_TYPES.includes(o.type as LayoutBlockType)) return null;
      const type = o.type as LayoutBlockType;
      if (type !== "quote" && seen.has(type)) return null;
      seen.add(type);
      const cols = Number(o.columns);
      return {
        type,
        heading: typeof o.heading === "string" ? o.heading.slice(0, 80) : undefined,
        variant: typeof o.variant === "string" ? o.variant : undefined,
        columns: cols >= 1 && cols <= 3 ? Math.round(cols) : undefined,
      } as LayoutBlock;
    })
    .filter((b): b is LayoutBlock => b !== null)
    .slice(0, 12);

  if (!blocks.length) return undefined;
  if (blocks[0].type !== "hero") blocks.unshift({ type: "hero" });

  return {
    palette: {
      bg: hex(p.bg, "#ffffff"),
      surface: hex(p.surface, "#f6f7f9"),
      ink: hex(p.ink, "#101317"),
      muted: hex(p.muted, "#5b636e"),
      accent: hex(p.accent, "#2563eb"),
      accentInk: hex(p.accentInk, "#ffffff"),
    },
    font: pick(r.font, ["serif", "sans", "mono", "mixed"], "sans"),
    density: pick(r.density, ["airy", "balanced", "compact"], "balanced"),
    radius: pick(r.radius, ["sharp", "soft", "round"], "soft"),
    heroVariant: pick(r.heroVariant, ["centered", "split", "dark-band", "side-portrait", "minimal"], "split"),
    blocks,
  };
}
