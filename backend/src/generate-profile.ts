import { slugify } from "./types";
import type { GenerateInput, GeneratedProfile, Goal, PublicSection, Testimonial, Tone } from "./types";

// Deterministic mock generator — fallback if Groq is unavailable. Mirrors the
// frontend's generator so the JSON shape is identical either way.

const HERO_TITLE: Record<Tone, (role: string, name: string) => string> = {
  professional: (role) => role,
  warm: (role, name) => `Hi, I'm ${name.split(" ")[0]} — ${role.toLowerCase()}.`,
  bold: (role) => role.toUpperCase(),
  technical: (role) => role,
  minimal: (role) => role,
  premium: (role) => role,
};

const HERO_EYEBROW: Record<Goal, string> = {
  "get-hired": "Open to senior roles",
  "sell-services": "Now booking new engagements",
  "capture-leads": "Let's build something together",
  "build-authority": "Writing & speaking",
  creator: "Creator · Builder · Writer",
  founder: "Founder, building in public",
};

const ABOUT_HEADING: Record<Tone, string> = {
  professional: "About", warm: "A little about me", bold: "Who I am",
  technical: "Background", minimal: "About", premium: "The story",
};

function primaryCta(input: GenerateInput): GeneratedProfile["hero"]["primaryCta"] {
  if (input.answers.bookingCta) return { label: "Book a meeting", kind: "booking" };
  return { label: "Chat with my persona", kind: "chat" };
}

function secondaryCta(input: GenerateInput, primary: GeneratedProfile["hero"]["primaryCta"]): GeneratedProfile["hero"]["secondaryCta"] {
  if (primary.kind === "chat") return input.answers.bookingCta ? { label: "Book a meeting", kind: "booking" } : { label: "Get in touch", kind: "contact" };
  return { label: "Chat with my persona", kind: "chat" };
}

function buildAboutBody(input: GenerateInput): string {
  const { facts, answers } = input;
  const lead = facts.workHistory[0];
  const bits = [facts.headline || `${facts.role}.`];
  if (lead && !facts.headline.toLowerCase().includes(lead.company.toLowerCase())) {
    bits.push(`Currently ${lead.role} at ${lead.company}.`);
  }
  if (answers.goal === "sell-services" || answers.goal === "capture-leads")
    bits.push("Open to new projects — let's talk below.");
  else if (answers.goal === "get-hired") bits.push("Open to new opportunities.");
  return bits.join(" ");
}

function buildHighlights(input: GenerateInput): GeneratedProfile["highlights"] {
  return input.facts.achievements.slice(0, 4).map((a, i) => {
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
  const out: GeneratedProfile["hero"]["stats"] = [];
  for (const a of facts.achievements) {
    if (out.length >= 3) break;
    const m = a.text.match(/(\$?[\d][\d,.]*\s?[KkMmBb%+]?)/);
    if (m) {
      const label = a.text.replace(m[1], "").replace(/^[\s—\-:,]+/, "").trim();
      out.push({ value: m[1], label: (label || "Highlight").slice(0, 30) });
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
  { id: "t-1", quote: "Turned six months of circular debate into a roadmap we shipped in three weeks.", author: "Devin Park", role: "Founder, Lumen" },
  { id: "t-2", quote: "Clear, specific, no theatre. Paid for itself in the first month.", author: "Priya Nair", role: "CEO, Tildë" },
];

function buildFaq(input: GenerateInput): GeneratedProfile["faq"] {
  const faq = [
    { id: "f-1", q: "How do you usually work with teams?", a: "Most engagements start with a short diagnostic call, then a focused sprint or an ongoing arrangement — whichever fits your stage." },
    { id: "f-2", q: "How quickly can we start?", a: "I typically have room for one or two new engagements a month. Book an intro call or ask the chat below about availability." },
  ];
  if (input.answers.goal === "get-hired") {
    faq[0] = { id: "f-1", q: "What kind of role are you looking for?", a: "A senior role at a team that wants the work owned end to end — strategy, execution, and shipping." };
  }
  return faq;
}

function buildSuggestedQuestions(input: GenerateInput): string[] {
  const { facts, answers } = input;
  const qs = [`What's ${facts.name.split(" ")[0]}'s background?`];
  if (facts.services.length) qs.push(`Can you help with ${facts.services[0].name.toLowerCase()}?`);
  qs.push("What are you working on right now?");
  if (answers.goal === "sell-services" || answers.bookingCta) qs.push("Are you available to take on a new project right now?");
  if (answers.goal === "get-hired") qs.push("What are you looking for in your next role?");
  return qs.slice(0, 6);
}

const SECTION_ORDER: PublicSection[] = ["About", "Experience", "Services", "Projects", "Testimonials", "FAQ", "Chat", "Booking"];

function resolveSections(input: GenerateInput): PublicSection[] {
  const { facts, answers } = input;
  const requested = new Set(answers.publicSections);
  return SECTION_ORDER.filter((s) => {
    if (!requested.has(s)) return false;
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
  const email = facts.socialLinks.find((l) => l.kind === "email")?.url.replace("mailto:", "") ?? "hello@example.com";

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
    about: { heading: ABOUT_HEADING[answers.tone], body: buildAboutBody(input) },
    highlights: buildHighlights(input),
    experience: facts.workHistory,
    projects: facts.projects,
    services: facts.services,
    testimonials: answers.publicSections.includes("Testimonials") ? MOCK_TESTIMONIALS : [],
    faq: answers.publicSections.includes("FAQ") ? buildFaq(input) : [],
    suggestedQuestions: buildSuggestedQuestions(input),
    chat: {
      verifiedOnly: answers.chatVerifiedOnly,
      collectLeads: answers.chatCollectLeads,
      greeting: `Hi! I'm ${facts.name.split(" ")[0]}'s AI. Ask me anything about ${facts.name.split(" ")[0]}'s work, experience, or how to work together.`,
    },
    booking: { enabled: answers.bookingCta, label: "Schedule a meet", note: "Free, no-pressure call to see if we're a fit." },
    contact: { email, socials: facts.socialLinks },
    generatedBy: "mock",
    model: "generateProfileWithGroqMock",
  };
}
