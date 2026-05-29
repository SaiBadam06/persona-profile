import { slugify } from "./utils";
import type {
  GenerateInput,
  GeneratedProfile,
  Goal,
  PublicSection,
  Testimonial,
  Tone,
} from "./types";

// ---------------------------------------------------------------------------
// generateProfileWithGroqMock — deterministic, realistic stand-in for the
// Groq generation step. Returns the exact GeneratedProfile shape the real
// model is asked to produce, so the UI is identical whether copy comes from
// Groq or this mock.
// ---------------------------------------------------------------------------

const HERO_TITLE: Record<Tone, (role: string, name: string) => string> = {
  professional: (role) => role,
  warm: (role, name) => `Hi, I'm ${name.split(" ")[0]} — ${role.toLowerCase()}.`,
  bold: (role) => role.toUpperCase(),
  technical: (role) => role,
  minimal: (role) => role,
  premium: (role) => role,
};

const HERO_EYEBROW: Record<Goal, string> = {
  "get-hired": "Open to senior product roles",
  "sell-services": "Now booking new engagements",
  "capture-leads": "Let's build something together",
  "build-authority": "Writing & speaking on product",
  creator: "Creator · Builder · Writer",
  founder: "Founder, building in public",
};

const ABOUT_HEADING: Record<Tone, string> = {
  professional: "About",
  warm: "A little about me",
  bold: "Who I am",
  technical: "Background",
  minimal: "About",
  premium: "The story",
};

function primaryCta(input: GenerateInput): GeneratedProfile["hero"]["primaryCta"] {
  if (input.answers.bookingCta) return { label: "Book a meeting", kind: "booking" };
  return { label: "Chat with my persona", kind: "chat" };
}

function secondaryCta(
  input: GenerateInput,
  primary: GeneratedProfile["hero"]["primaryCta"]
): GeneratedProfile["hero"]["secondaryCta"] {
  if (primary.kind === "chat") {
    return input.answers.bookingCta
      ? { label: "Book a meeting", kind: "booking" }
      : { label: "Get in touch", kind: "contact" };
  }
  return { label: "Chat with my persona", kind: "chat" };
}

function buildAboutBody(input: GenerateInput): string {
  const { facts, answers } = input;
  const lead = facts.workHistory[0];
  const base = facts.headline;
  const proof = lead
    ? ` Today I'm ${lead.role} at ${lead.company}, where ${lead.summary
        .charAt(0)
        .toLowerCase()}${lead.summary.slice(1)}`
    : "";
  const closer =
    answers.goal === "sell-services" || answers.goal === "capture-leads"
      ? " If you're wrestling with an early product or pricing problem, I'd love to help."
      : answers.goal === "get-hired"
        ? " I'm looking for a team where I can own product from strategy to ship."
        : " I share most of what I learn — ask me anything below.";
  return `${base}${proof}${closer}`;
}

function buildHighlights(input: GenerateInput): GeneratedProfile["highlights"] {
  const { facts } = input;
  return facts.achievements.slice(0, 4).map((a, i) => {
    // Pull a leading number out of the achievement to use as the big stat.
    const match = a.text.match(/(\$?[\d,.]+[KkMmBb%+]?)/);
    return {
      id: `hl-${i}`,
      value: match ? match[1] : `0${i + 1}`,
      label: a.text.replace(/(\$?[\d,.]+[KkMmBb%+]?)/, "").trim() || "Highlight",
      caption: a.text,
    };
  });
}

function buildStats(input: GenerateInput): GeneratedProfile["hero"]["stats"] {
  const { facts } = input;
  const years = facts.workHistory.length
    ? `${new Date().getFullYear() - 2013}+`
    : "10+";
  return [
    { label: "Years in product", value: years },
    { label: "Teams advised", value: "12+" },
    { label: "ARR bootstrapped", value: "$1.2M" },
  ];
}

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    quote:
      "Maya turned six months of circular product debate into a roadmap we shipped in three weeks.",
    author: "Devin Park",
    role: "Founder, Lumen",
  },
  {
    id: "t-2",
    quote:
      "The pricing audit paid for itself in the first month. Clear, specific, no theatre.",
    author: "Priya Nair",
    role: "CEO, Tildë",
  },
  {
    id: "t-3",
    quote: "The best product hire we never had to make full-time.",
    author: "Marcus Hale",
    role: "Co-founder, Relay",
  },
];

function buildFaq(input: GenerateInput): GeneratedProfile["faq"] {
  const { answers } = input;
  const faq = [
    {
      id: "f-1",
      q: "How do you usually work with early-stage teams?",
      a: "Most engagements start with a short diagnostic call, then either a focused 0→1 sprint or an ongoing fractional arrangement — whichever fits the stage you're at.",
    },
    {
      id: "f-2",
      q: "What does a 0→1 product sprint actually deliver?",
      a: "Three weeks from a fuzzy idea to a validated, build-ready spec: customer interviews, a sharpened problem statement, scoped MVP, and a go-to-market angle.",
    },
    {
      id: "f-3",
      q: "How quickly can we start?",
      a: "I typically have room for one or two new engagements a month. The fastest path is to book an intro call or ask the chat below about availability.",
    },
  ];
  if (answers.goal === "get-hired") {
    faq[0] = {
      id: "f-1",
      q: "What kind of role are you looking for?",
      a: "A senior or head-of-product role at a team that wants product owned end to end — strategy, discovery, and shipping.",
    };
  }
  return faq;
}

function buildSuggestedQuestions(input: GenerateInput): string[] {
  const { facts, answers } = input;
  const qs = [
    "What's the fastest way to validate a new product idea?",
  ];
  if (facts.achievements.some((a) => /ARR|bootstrap/i.test(a.text))) {
    qs.push("How did you bootstrap Cadence Labs to $1.2M ARR?");
  }
  if (facts.services.some((s) => /pricing/i.test(s.name))) {
    qs.push("Can you help us fix our pricing?");
  }
  qs.push("What does a fractional product engagement look like?");
  if (answers.goal === "sell-services" || answers.bookingCta) {
    qs.push("Are you available to take on a new project right now?");
  }
  if (answers.goal === "get-hired") {
    qs.push("What are you looking for in your next role?");
  }
  return qs.slice(0, 6);
}

const SECTION_ORDER: PublicSection[] = [
  "About",
  "Experience",
  "Services",
  "Projects",
  "Testimonials",
  "FAQ",
  "Chat",
  "Booking",
];

function resolveSections(input: GenerateInput): PublicSection[] {
  const { facts, answers } = input;
  const requested = new Set(answers.publicSections);
  return SECTION_ORDER.filter((s) => {
    if (!requested.has(s)) return false;
    // Drop sections that have no data to show.
    if (s === "Experience") return facts.workHistory.length > 0;
    if (s === "Projects") return facts.projects.length > 0;
    if (s === "Services") return facts.services.length > 0;
    if (s === "Booking") return answers.bookingCta;
    return true;
  });
}

export function generateProfileWithGroqMock(input: GenerateInput): GeneratedProfile {
  const { facts, answers } = input;
  const primary = primaryCta(input);
  const email =
    facts.socialLinks.find((l) => l.kind === "email")?.url.replace("mailto:", "") ??
    "hello@example.com";

  return {
    slug: slugify(facts.name) || "profile",
    name: facts.name,
    headline: facts.headline,
    role: facts.role,
    location: facts.location,
    layout: answers.layout,
    tone: answers.tone,
    visualStyle: answers.visualStyle,
    theme: answers.theme,
    font: answers.font,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(facts.name || "PersonaOn")}&backgroundColor=2563eb&textColor=ffffff`,
    avatarShape: "circle",
    sections: resolveSections(input),
    hero: {
      eyebrow: HERO_EYEBROW[answers.goal],
      title: HERO_TITLE[answers.tone](facts.role, facts.name),
      subtitle: facts.headline,
      primaryCta: primary,
      secondaryCta: secondaryCta(input, primary),
      stats: buildStats(input),
    },
    about: {
      heading: ABOUT_HEADING[answers.tone],
      body: buildAboutBody(input),
    },
    highlights: buildHighlights(input),
    experience: facts.workHistory,
    projects: facts.projects,
    services: facts.services,
    testimonials: answers.publicSections.includes("Testimonials")
      ? MOCK_TESTIMONIALS
      : [],
    faq: answers.publicSections.includes("FAQ") ? buildFaq(input) : [],
    suggestedQuestions: buildSuggestedQuestions(input),
    chat: {
      verifiedOnly: answers.chatVerifiedOnly,
      collectLeads: answers.chatCollectLeads,
      greeting: `Hi! I'm ${facts.name.split(" ")[0]}'s AI. Ask me anything about ${
        facts.name.split(" ")[0]
      }'s work, experience, or how to work together.`,
    },
    booking: {
      enabled: answers.bookingCta,
      label: "Schedule a meet",
      note: "Free, no-pressure call to see if we're a fit.",
    },
    contact: { email, socials: facts.socialLinks },
    generatedBy: "mock",
    model: "generateProfileWithGroqMock",
  };
}
