import type {
  CustomizationAnswers,
  ExtractedFacts,
  IntakeFiles,
  SourceCard,
  SourceInput,
} from "./types";

/** Blank, editable facts — used when extraction yields nothing. */
export const EMPTY_FACTS: ExtractedFacts = {
  name: "",
  headline: "",
  role: "",
  location: "",
  skills: [],
  workHistory: [],
  projects: [],
  achievements: [],
  services: [],
  socialLinks: [],
};

/** Waiting cards derived from the real intake (files + url + bio). */
export function buildIntakeCards(intake: IntakeFiles): SourceCard[] {
  const cards: SourceCard[] = [];
  if (intake.linkedinFile) {
    cards.push({ id: "src-linkedin", kind: "linkedin", label: "LinkedIn PDF", value: intake.linkedinFile.name, status: "waiting", detail: "Exported LinkedIn profile" });
  }
  if (intake.resumeFile) {
    cards.push({ id: "src-resume", kind: "resume", label: "Resume / CV", value: intake.resumeFile.name, status: "waiting", detail: "Work history & achievements" });
  }
  if (intake.websiteUrl.trim()) {
    cards.push({ id: "src-website", kind: "website", label: "Website", value: intake.websiteUrl.trim(), status: "waiting", detail: "Services & voice" });
  }
  if (intake.manualBio.trim()) {
    cards.push({ id: "src-manual", kind: "manual", label: "Manual bio", value: intake.manualBio.trim(), status: "waiting", detail: "Positioning & tone" });
  }
  return cards;
}

export function hasRealSource(intake: IntakeFiles): boolean {
  return Boolean(
    intake.linkedinFile ||
      intake.resumeFile ||
      intake.websiteUrl.trim() ||
      intake.manualBio.trim()
  );
}

// ---------------------------------------------------------------------------
// Realistic mock data for a founder / product strategist.
// This is what the prototype "extracts" from the connected sources.
// ---------------------------------------------------------------------------

export const DEFAULT_SOURCE_INPUT: SourceInput = {
  linkedinUrl: "https://www.linkedin.com/in/mayarao",
  resumeFileName: "Maya-Rao-Resume-2025.pdf",
  websiteUrl: "https://mayarao.co",
  manualBio:
    "I partner with early-stage founders to find the shortest path from a messy idea to a product people pay for.",
};

/** The ordered animation steps shown during AI extraction. */
export const EXTRACTION_STEPS = [
  { id: "linkedin", label: "Reading LinkedIn profile", source: "linkedin" as const },
  { id: "resume", label: "Parsing resume PDF", source: "resume" as const },
  { id: "achievements", label: "Extracting achievements", source: "resume" as const },
  { id: "tone", label: "Identifying tone & voice", source: "website" as const },
  { id: "kb", label: "Building knowledge base", source: "manual" as const },
];

export function buildSourceCards(input: SourceInput): SourceCard[] {
  const cards: SourceCard[] = [];
  if (input.linkedinUrl.trim()) {
    cards.push({
      id: "src-linkedin",
      kind: "linkedin",
      label: "LinkedIn Profile",
      value: input.linkedinUrl.trim(),
      status: "waiting",
      detail: "Headline, roles, skills & endorsements",
    });
  }
  if (input.resumeFileName.trim()) {
    cards.push({
      id: "src-resume",
      kind: "resume",
      label: "Resume / CV",
      value: input.resumeFileName.trim(),
      status: "waiting",
      detail: "Work history, education & achievements",
    });
  }
  if (input.websiteUrl.trim()) {
    cards.push({
      id: "src-website",
      kind: "website",
      label: "Personal Website",
      value: input.websiteUrl.trim(),
      status: "waiting",
      detail: "Services, case studies & voice",
    });
  }
  if (input.manualBio.trim()) {
    cards.push({
      id: "src-manual",
      kind: "manual",
      label: "Manual Bio",
      value: input.manualBio.trim(),
      status: "waiting",
      detail: "Positioning & tone preferences",
    });
  }
  return cards;
}

/** Per-source completion summary shown once extraction finishes. */
export const SOURCE_COMPLETE_DETAIL: Record<string, string> = {
  "src-linkedin": "Imported 4 roles, 28 skills, 6 endorsements",
  "src-resume": "Parsed 3 pages — 4 roles, 9 achievements",
  "src-website": "Crawled 5 pages — services + 3 case studies",
  "src-manual": "Captured positioning & preferred tone",
};

export const MOCK_EXTRACTED_FACTS: ExtractedFacts = {
  name: "Maya Rao",
  headline:
    "I help early-stage teams turn messy product ideas into software people pay for.",
  role: "Founder & Product Strategist",
  location: "San Francisco, CA",
  skills: [
    { id: "sk-1", label: "0→1 Product Strategy" },
    { id: "sk-2", label: "Go-to-Market" },
    { id: "sk-3", label: "Pricing & Packaging" },
    { id: "sk-4", label: "User Research" },
    { id: "sk-5", label: "Roadmapping" },
    { id: "sk-6", label: "Fundraising Narrative" },
    { id: "sk-7", label: "Team Building" },
    { id: "sk-8", label: "Data-Informed Decisions" },
    { id: "sk-9", label: "Design Partnerships" },
  ],
  workHistory: [
    {
      id: "w-1",
      role: "Founder & CEO",
      company: "Cadence Labs",
      period: "2021 — Present",
      summary:
        "Building the operating system for product teams. Bootstrapped to $1.2M ARR in 14 months with a team of 7.",
    },
    {
      id: "w-2",
      role: "Head of Product",
      company: "Northwind",
      period: "2018 — 2021",
      summary:
        "Owned product for the flagship workspace. Took it from 0 to 40,000 paying teams and led a team of 12 PMs and designers.",
    },
    {
      id: "w-3",
      role: "Senior Product Manager",
      company: "Atlas Analytics",
      period: "2015 — 2018",
      summary:
        "Launched the self-serve analytics tier that became 60% of new revenue. Ran the company's first pricing overhaul.",
    },
    {
      id: "w-4",
      role: "Product Manager",
      company: "Brightline",
      period: "2013 — 2015",
      summary:
        "First PM hire. Shipped the onboarding flow that doubled activation and set the early product culture.",
    },
  ],
  projects: [
    {
      id: "p-1",
      name: "Cadence OS",
      description:
        "A planning workspace that keeps product, design, and engineering aligned around outcomes — not tickets.",
      tags: ["SaaS", "0→1", "Product"],
    },
    {
      id: "p-2",
      name: "The 0→1 Playbook",
      description:
        "An open framework for product discovery used by 4,000+ founders to validate before they build.",
      tags: ["Open Source", "Discovery"],
    },
    {
      id: "p-3",
      name: "Pricing Teardown",
      description:
        "A weekly newsletter dissecting how great SaaS companies package and price. 18k subscribers.",
      tags: ["Newsletter", "Pricing"],
    },
  ],
  achievements: [
    { id: "a-1", text: "Bootstrapped Cadence Labs to $1.2M ARR in 14 months" },
    { id: "a-2", text: "Scaled Northwind's flagship product to 40,000 paying teams" },
    { id: "a-3", text: "Keynote speaker at SaaStr Annual 2023 on founder-led product" },
    { id: "a-4", text: "Advised 12 pre-seed startups through 0→1 discovery sprints" },
  ],
  services: [
    {
      id: "sv-1",
      name: "Fractional Head of Product",
      description:
        "Embedded product leadership for seed-stage teams without a full-time hire yet.",
    },
    {
      id: "sv-2",
      name: "0→1 Product Sprint",
      description:
        "A focused 3-week sprint from fuzzy idea to a validated, build-ready spec.",
    },
    {
      id: "sv-3",
      name: "Pricing & Packaging Audit",
      description:
        "A teardown of your current model with a concrete plan to lift revenue per account.",
    },
    {
      id: "sv-4",
      name: "Founder Advisory",
      description:
        "Monthly 1:1 advisory on product strategy, roadmap, and team for technical founders.",
    },
  ],
  socialLinks: [
    { id: "ln-1", kind: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/mayarao" },
    { id: "ln-2", kind: "github", label: "GitHub", url: "https://github.com/mayarao" },
    { id: "ln-3", kind: "x", label: "X / Twitter", url: "https://x.com/mayarao" },
    { id: "ln-4", kind: "website", label: "mayarao.co", url: "https://mayarao.co" },
    { id: "ln-5", kind: "email", label: "maya@cadencelabs.com", url: "mailto:maya@cadencelabs.com" },
  ],
};

export const DEFAULT_CUSTOMIZATION: CustomizationAnswers = {
  layout: "single",
  goal: "sell-services",
  tone: "professional",
  publicSections: ["About", "Experience", "Services", "Projects", "Chat", "Booking"],
  chatVerifiedOnly: true,
  chatCollectLeads: true,
  bookingCta: true,
  visualStyle: "clean-corporate",
  theme: "classic",
  font: "mixed",
};
