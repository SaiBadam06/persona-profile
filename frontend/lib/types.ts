// ---------------------------------------------------------------------------
// PersonaOn — shared prototype types
// ---------------------------------------------------------------------------

export type SourceKind = "linkedin" | "resume" | "website" | "manual";
export type SourceStatus = "waiting" | "extracting" | "complete" | "failed";

/** Raw user-provided intake values. */
export interface SourceInput {
  linkedinUrl: string;
  resumeFileName: string;
  websiteUrl: string;
  manualBio: string;
}

/** A source card shown during intake / extraction. */
export interface SourceCard {
  id: string;
  kind: SourceKind;
  label: string;
  value: string;
  status: SourceStatus;
  detail: string;
}

// --- Extracted facts (each list item is individually editable / removable) ---

export interface SkillItem {
  id: string;
  label: string;
}

export interface WorkItem {
  id: string;
  role: string;
  company: string;
  period: string;
  summary: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface AchievementItem {
  id: string;
  text: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
}

export type SocialKind = "linkedin" | "github" | "x" | "website" | "email" | "other";

export interface SocialLink {
  id: string;
  kind: SocialKind;
  label: string;
  url: string;
}

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

// --- Customization answers ---

export type LayoutKind = "single" | "multi";

export type Goal =
  | "get-hired"
  | "sell-services"
  | "capture-leads"
  | "build-authority"
  | "creator"
  | "founder";

export type Tone =
  | "professional"
  | "warm"
  | "bold"
  | "technical"
  | "minimal"
  | "premium";

export type PublicSection =
  | "About"
  | "Experience"
  | "Projects"
  | "Services"
  | "Testimonials"
  | "FAQ"
  | "Booking"
  | "Chat";

export type VisualStyle =
  | "clean-corporate"
  | "modern-gradient"
  | "editorial"
  | "minimal-mono"
  | "warm-rounded";

/** Typography style applied to the rendered profile. */
export type FontChoice = "sans" | "serif" | "mono" | "mixed";

/** A full visual design template (the team's 4 designs + the classic builder one). */
export type ProfileTheme =
  | "ai"
  | "classic"
  | "editorial"
  | "saas-card"
  | "executive"
  | "academic";

export type LayoutBlockType =
  | "hero" | "about" | "stats" | "skills" | "experience"
  | "projects" | "services" | "testimonials" | "faq" | "quote" | "chat" | "contact";

export interface LayoutBlock {
  type: LayoutBlockType;
  heading?: string;
  variant?: string;
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

export interface CustomizationAnswers {
  layout: LayoutKind;
  goal: Goal;
  tone: Tone;
  publicSections: PublicSection[];
  chatVerifiedOnly: boolean;
  chatCollectLeads: boolean;
  bookingCta: boolean;
  visualStyle: VisualStyle;
  /** Which full design template to render. */
  theme: ProfileTheme;
  /** Typography style. */
  font: FontChoice;
}

// --- The generated profile (shape returned by Groq / the mock generator) ---

export interface ProfileStat {
  label: string;
  value: string;
}

export interface Highlight {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

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
  /** Avatar image URL (auto-generated from the name; user can replace). */
  avatarUrl: string;
  /** Shape of the avatar/profile photo. */
  avatarShape?: "circle" | "rounded" | "square";
  /** Ordered list of public sections (subset of the requested ones). */
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
  /** Architect importance scores (section -> 0..100) — drives ordering & sizing. */
  importance?: Record<string, number>;
  /** Set by the API layer — not part of the model's JSON output. */
  generatedBy?: "groq" | "mock";
  model?: string;
}

/** Input contract for both the mock generator and the real Groq route. */
export interface GenerateInput {
  facts: ExtractedFacts;
  answers: CustomizationAnswers;
}

export interface GenerateResult {
  profile: GeneratedProfile;
  /** The exact prompt text that was (or would be) sent to Groq. */
  prompt: string;
  source: "groq" | "mock";
  model: string;
}

// --- Real source extraction (resume PDF, LinkedIn PDF, website, manual) ---

/** Client-held intake — actual File objects + text, before extraction. */
export interface IntakeFiles {
  linkedinFile: File | null;
  resumeFile: File | null;
  websiteUrl: string;
  manualBio: string;
}

// --- Persona Architect: AI reasons about IA before generating UI ---

export interface ArchitectPlan {
  personaType: string;
  reasoning: string;
  visitorsWant: string;
  pattern: string; // portfolio | recruiter | founder | research | creator | student
  recommendedTheme: ProfileTheme;
  /** section -> importance score 0..100 */
  importance: Record<string, number>;
  /** public sections sorted by importance (highest first) */
  order: PublicSection[];
  source: "groq" | "mock";
}

// --- Persona chat (published page): one chat that answers, edits, or declines ---

export type PersonaChatIntent = "answer" | "edit" | "refuse";

/** Response from /api/persona-chat — the published-page chat's unified action. */
export interface PersonaChatResponse {
  intent: PersonaChatIntent;
  /** What the chat bubble says back to the visitor/owner. */
  reply: string;
  /** Verified-source badges (only meaningful for intent === "answer"). */
  sources?: ChatSource[];
  /** Full profile after applying an edit (only for intent === "edit"). */
  updatedProfile?: GeneratedProfile;
  source: "groq" | "mock";
}

export interface ExtractResult {
  facts: ExtractedFacts;
  /** Per-source outcome cards (complete / failed). */
  sources: SourceCard[];
  source: "groq" | "mock";
  model: string;
  notes: string[];
}

// --- Public chat simulation ---

export interface ChatSource {
  kind: SourceKind;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  /** When true, render a lead-capture card under this message. */
  offerLeadCapture?: boolean;
  /** When true, this assistant turn applied a live edit to the page. */
  edited?: boolean;
}
