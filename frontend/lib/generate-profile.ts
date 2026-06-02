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

// Goal-aware closing line for the About section — keeps each persona's page on-message.
const ABOUT_TAIL: Record<Goal, string> = {
  "get-hired": "Open to new opportunities.",
  "sell-services": "Open to new projects — let's talk below.",
  "capture-leads": "Looking to connect — reach out below.",
  "build-authority": "I write and speak about my work — say hello below.",
  creator: "Always building something new — come along.",
  founder: "Building in public — open to investors, candidates, and partners.",
};

function buildAboutBody(input: GenerateInput): string {
  const { facts, answers } = input;
  const lead = facts.workHistory[0];
  const bits = [facts.headline || `${facts.role}.`];
  if (lead && !facts.headline.toLowerCase().includes(lead.company.toLowerCase())) {
    bits.push(`Currently ${lead.role} at ${lead.company}.`);
  }
  bits.push(ABOUT_TAIL[answers.goal]);
  return bits.join(" ");
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

// Stat words we never want a label to start or end on — prepositions, articles,
// and connectors that read as dangling fragments ("...flagship to", "at SaaStr").
const STAT_STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "with", "by", "from",
  "that", "our", "their", "its", "his", "her", "my", "was", "were", "is", "are", "as",
  "into", "over", "per", "up", "new", "more", "than", "about", "across", "within", "via",
]);

// Turn an achievement sentence + the number we lifted from it into a SHORT, complete,
// professional metric label — preferring the unit/noun right after the number
// ("$1.2M ARR" → "ARR", "40,000 paying teams" → "Paying teams"), else the leading
// phrase. Never a mid-word truncation or a trailing preposition, so every theme reads formally.
function statLabel(sentence: string, valueToken: string): string {
  const words = (s: string) =>
    (s.match(/[A-Za-z0-9'’&/+%.-]+/g) ?? []).filter((w) => /[A-Za-z]/.test(w));
  const idx = sentence.indexOf(valueToken);
  const after = idx >= 0 ? sentence.slice(idx + valueToken.length) : "";
  const before = idx >= 0 ? sentence.slice(0, idx) : sentence;

  const take = (list: string[], max: number) => {
    const w = [...list];
    while (w.length && STAT_STOPWORDS.has(w[0].toLowerCase())) w.shift();
    const out: string[] = [];
    for (const word of w) {
      if (out.length >= max || STAT_STOPWORDS.has(word.toLowerCase())) break;
      out.push(word);
    }
    return out;
  };

  const afterWords = words(after);
  let chosen: string[] = [];
  // Use the post-number phrase only when it begins with a real word (a unit/noun),
  // not a connector like "in 14 months" or "on founder-led product".
  if (afterWords.length && !STAT_STOPWORDS.has(afterWords[0].toLowerCase())) {
    chosen = take(afterWords, 3);
  }
  if (!chosen.length) chosen = take(words(before), 3);

  const label = chosen.join(" ").trim() || "Highlight";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildStats(input: GenerateInput): GeneratedProfile["hero"]["stats"] {
  const { facts } = input;
  const out: GeneratedProfile["hero"]["stats"] = [];
  // Prefer REAL numbers pulled from the person's achievements — never fabricate.
  for (const a of facts.achievements) {
    if (out.length >= 3) break;
    const m = a.text.match(/(\$?[\d][\d,.]*\s?[KkMmBb%+]?)/);
    if (m) {
      out.push({ value: m[1].trim(), label: statLabel(a.text, m[1]) });
    }
  }
  const add = (value: number, label: string) => {
    if (out.length < 3 && value > 0) out.push({ value: `${value}`, label });
  };
  add(facts.workHistory.length, facts.workHistory.length === 1 ? "Role" : "Roles");
  add(facts.projects.length, "Projects");
  add(facts.skills.length, "Skills");
  return out.slice(0, 3);
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
  const leadFaq: Partial<Record<Goal, { q: string; a: string }>> = {
    "get-hired": {
      q: "What kind of role are you looking for?",
      a: "A senior or head-of-product role at a team that wants product owned end to end — strategy, discovery, and shipping.",
    },
    founder: {
      q: "What are you building?",
      a: "I'm focused on the company in my work below. Happy to talk with investors, prospective teammates, and partners — book a call or ask the chat.",
    },
    "build-authority": {
      q: "What do you write and speak about?",
      a: "The themes across my projects and writing below. I'm open to podcasts, panels, and collaborations — reach out via the chat.",
    },
    creator: {
      q: "What are you working on right now?",
      a: "The latest is in Projects below. I love collaborating — say hi through the chat and tell me what you're making.",
    },
  };
  if (leadFaq[answers.goal]) {
    faq[0] = { id: "f-1", ...leadFaq[answers.goal]! };
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
  const goalQuestion: Partial<Record<Goal, string>> = {
    "get-hired": "What are you looking for in your next role?",
    "capture-leads": "How could we work together?",
    "build-authority": "What's your take on where this field is heading?",
    creator: "What are you working on lately?",
    founder: "What are you building, and are you raising?",
  };
  if (goalQuestion[answers.goal]) qs.push(goalQuestion[answers.goal]!);
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
  // Honor the ORDER of publicSections (the Architect reorders it by importance),
  // dropping any section that has no data to show.
  const order = answers.publicSections.length ? answers.publicSections : SECTION_ORDER;
  return order.filter((s) => {
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
    avatarUrl: "", // empty → polished monogram; user can upload a real photo
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
