import type { ExtractedFacts, GeneratedProfile } from "./types";

// The published-page chat is one assistant with three jobs:
//   answer  — reply to a visitor's question, grounded in the verified profile
//   edit    — change this page's copy and/or design when the owner asks
//   refuse  — politely decline anything outside this persona / page
// It returns a single JSON object so the route can branch deterministically.

export function buildPersonaChatSystemPrompt(profile: GeneratedProfile): string {
  const first = profile.name.split(" ")[0] || "this person";
  return [
    `You are ${profile.name}'s AI on their public PersonaOn page. You serve TWO kinds of message and nothing else:`,
    "",
    `1) A VISITOR QUESTION about ${first} → intent "answer".`,
    `   Reply in the first person as ${first}, in a ${profile.tone} tone, 2–4 warm specific sentences.`,
    profile.chat.verifiedOnly
      ? `   Use ONLY the verified facts provided. If a detail isn't there, say so and suggest booking a call. NEVER invent facts.`
      : `   Prefer the provided facts; light reasonable context is fine, but never fabricate specific claims.`,
    `   If booking is open and the visitor shows hiring/buying/meeting intent, end by inviting them to book a call.`,
    "",
    `2) AN INSTRUCTION TO CHANGE THIS PAGE (the owner editing their own profile) → intent "edit".`,
    "   Produce a JSON `patch` with ONLY the fields to change. Vocabulary:",
    "   COPY: name, role, headline, location, hero{eyebrow,title,subtitle}, about{heading,body},",
    "     highlights[], experience[], projects[], services[], faq[], suggestedQuestions[], booking{enabled,label,note}.",
    "     Rewrite wording (shorter, punchier, formal, friendlier) — never invent facts.",
    "   DESIGN: theme('editorial'|'saas-card'|'executive'|'academic'|'ai'|'classic'),",
    "     font('sans'|'serif'|'mono'|'mixed'), layout('single'|'multi'),",
    "     avatarShape('circle'|'rounded'|'square'), order(array of section names to reorder the page).",
    "   Map natural language: 'dark/bold executive'→executive, 'magazine/serif'→editorial+serif,",
    "     'multi page/tabs'→multi, 'round photo'→circle, 'colorful/unique'→ai, 'lead with projects'→order.",
    "   Keep arrays the same length unless explicitly asked to add/remove. Write a short `reply` confirming what you changed.",
    "",
    `3) ANYTHING ELSE — general knowledge, other people, coding, world facts, or requests unrelated to ${first}'s`,
    `   profile or this page → intent "refuse". Briefly say you can only help with ${first}'s profile and page, then`,
    "   suggest a relevant thing they can ask or change. Do NOT answer the off-topic request.",
    "",
    'Return ONLY this JSON: { "intent": "answer"|"edit"|"refuse", "reply": string, "sources"?: string[], "patch"?: object }',
    'where sources is a subset of ["LinkedIn","Resume","Website"] used only for "answer".',
  ].join("\n");
}

export function buildPersonaChatUserPrompt(
  profile: GeneratedProfile,
  facts: ExtractedFacts,
  message: string
): string {
  const design = {
    theme: profile.theme,
    font: profile.font ?? "mixed",
    layout: profile.layout,
    avatarShape: profile.avatarShape ?? "circle",
    sections: profile.sections,
    bookingEnabled: profile.booking.enabled,
  };
  const copy = {
    name: profile.name,
    role: profile.role,
    headline: profile.headline,
    location: profile.location,
    hero: { eyebrow: profile.hero.eyebrow, title: profile.hero.title, subtitle: profile.hero.subtitle },
    about: profile.about,
    highlights: profile.highlights.map((h) => ({ value: h.value, label: h.label, caption: h.caption })),
    experience: profile.experience.map((w) => ({ role: w.role, company: w.company, period: w.period, summary: w.summary })),
    projects: profile.projects.map((p) => ({ name: p.name, description: p.description, tags: p.tags })),
    services: profile.services.map((s) => ({ name: s.name, description: s.description })),
    faq: profile.faq.map((f) => ({ q: f.q, a: f.a })),
    suggestedQuestions: profile.suggestedQuestions,
    booking: { label: profile.booking.label, note: profile.booking.note },
  };
  const groundingFacts = [
    `Skills: ${facts.skills.map((s) => s.label).join(", ")}`,
    "Experience:",
    ...facts.workHistory.map((w) => `  - ${w.role} @ ${w.company} (${w.period}): ${w.summary}`),
    "Projects:",
    ...facts.projects.map((p) => `  - ${p.name}: ${p.description}`),
    "Services:",
    ...facts.services.map((s) => `  - ${s.name}: ${s.description}`),
    "Achievements:",
    ...facts.achievements.map((a) => `  - ${a.text}`),
  ].join("\n");

  return [
    "CURRENT PAGE DESIGN (JSON):",
    JSON.stringify(design),
    "",
    "CURRENT PAGE COPY (JSON):",
    JSON.stringify(copy),
    "",
    "VERIFIED FACTS (for answering questions):",
    groundingFacts,
    "",
    `MESSAGE: ${message}`,
    "",
    "Classify the message, then return the JSON now.",
  ].join("\n");
}
