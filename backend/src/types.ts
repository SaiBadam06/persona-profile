// Shared types for the PersonaOn backend (mirrors the frontend contract).

export type SourceKind = "linkedin" | "resume" | "website" | "manual";
export type SourceStatus = "waiting" | "extracting" | "complete" | "failed";

export interface SourceCard {
  id: string;
  kind: SourceKind;
  label: string;
  value: string;
  status: SourceStatus;
  detail: string;
}

export interface SkillItem { id: string; label: string; }
export interface WorkItem { id: string; role: string; company: string; period: string; summary: string; }
export interface ProjectItem { id: string; name: string; description: string; tags: string[]; }
export interface AchievementItem { id: string; text: string; }
export interface ServiceItem { id: string; name: string; description: string; }
export type SocialKind = "linkedin" | "github" | "x" | "website" | "email" | "other";
export interface SocialLink { id: string; kind: SocialKind; label: string; url: string; }

export interface ExtractedFacts {
  name: string;
  headline: string;
  role: string;
  location: string;
  skills: SkillItem[];
  workHistory: WorkItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  services: ServiceItem[];
  socialLinks: SocialLink[];
}

export type LayoutKind = "single" | "multi";
export type Goal = "get-hired" | "sell-services" | "capture-leads" | "build-authority" | "creator" | "founder";
export type Tone = "professional" | "warm" | "bold" | "technical" | "minimal" | "premium";
export type PublicSection = "About" | "Experience" | "Projects" | "Services" | "Testimonials" | "FAQ" | "Booking" | "Chat";
export type VisualStyle = "clean-corporate" | "modern-gradient" | "editorial" | "minimal-mono" | "warm-rounded";
export type ProfileTheme = "ai" | "classic" | "editorial" | "saas-card" | "executive" | "academic";
export type FontChoice = "sans" | "serif" | "mono" | "mixed";

export interface CustomizationAnswers {
  layout: LayoutKind;
  goal: Goal;
  tone: Tone;
  publicSections: PublicSection[];
  chatVerifiedOnly: boolean;
  chatCollectLeads: boolean;
  bookingCta: boolean;
  visualStyle: VisualStyle;
  theme: ProfileTheme;
  font: FontChoice;
}

export interface ProfileStat { label: string; value: string; }
export interface Highlight { id: string; label: string; value: string; caption: string; }
export interface Testimonial { id: string; quote: string; author: string; role: string; }
export interface FaqItem { id: string; q: string; a: string; }

export interface GeneratedProfile {
  slug: string;
  name: string;
  headline: string;
  role: string;
  location: string;
  layout: LayoutKind;
  tone: Tone;
  visualStyle: VisualStyle;
  theme: ProfileTheme;
  font?: FontChoice;
  avatarUrl: string;
  avatarShape?: "circle" | "rounded" | "square";
  sections: PublicSection[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; kind: "chat" | "booking" | "contact" };
    secondaryCta: { label: string; kind: "chat" | "booking" | "contact" } | null;
    stats: ProfileStat[];
  };
  about: { heading: string; body: string };
  highlights: Highlight[];
  experience: WorkItem[];
  projects: ProjectItem[];
  services: ServiceItem[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  suggestedQuestions: string[];
  chat: { verifiedOnly: boolean; collectLeads: boolean; greeting: string };
  booking: { enabled: boolean; label: string; note: string };
  contact: { email: string; socials: SocialLink[] };
  /** Present only when theme === "ai": the model-designed layout. */
  layoutSpec?: LayoutSpec;
  generatedBy?: "groq" | "mock";
  model?: string;
}

// --- AI-invented layout spec (the model designs this; a renderer draws it) ---

export type LayoutBlockType =
  | "hero" | "about" | "stats" | "skills" | "experience"
  | "projects" | "services" | "testimonials" | "faq" | "quote" | "chat" | "contact";

export interface LayoutBlock {
  type: LayoutBlockType;
  heading?: string;
  /** hero variant or generic emphasis hint */
  variant?: string;
  /** 1–3 column hint for grid blocks */
  columns?: number;
}

export interface LayoutSpec {
  palette: { bg: string; surface: string; ink: string; muted: string; accent: string; accentInk: string };
  font: "serif" | "sans" | "mono" | "mixed";
  density: "airy" | "balanced" | "compact";
  radius: "sharp" | "soft" | "round";
  heroVariant: "centered" | "split" | "dark-band" | "side-portrait" | "minimal";
  blocks: LayoutBlock[];
}

export interface GenerateInput {
  facts: ExtractedFacts;
  answers: CustomizationAnswers;
}

export interface GenerateResult {
  profile: GeneratedProfile;
  prompt: string;
  source: "groq" | "mock";
  model: string;
}

export interface ExtractResult {
  facts: ExtractedFacts;
  sources: SourceCard[];
  source: "groq" | "mock";
  model: string;
  notes: string[];
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
