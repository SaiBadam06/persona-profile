import type { GeneratedProfile } from "./types";

// AI content editing: take the current profile + an instruction, return a JSON
// patch of ONLY the fields to change. Never invents facts.

export function buildEditSystemPrompt(): string {
  return [
    "You are PersonaOn's profile copy editor.",
    "You receive the current profile's copy as JSON and an instruction.",
    "Return a JSON PATCH containing ONLY the fields you changed, in the same shape.",
    "Rewrite wording per the instruction (e.g. shorten, elaborate, punchier, formal).",
    "NEVER invent new facts, employers, metrics, or skills — only rephrase what's there.",
    "Keep arrays the same length unless explicitly asked to add/remove items.",
  ].join(" ");
}

export function buildEditUserPrompt(profile: GeneratedProfile, instruction: string): string {
  const editable = {
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

  return [
    "CURRENT PROFILE COPY (JSON):",
    JSON.stringify(editable, null, 2),
    "",
    `INSTRUCTION: ${instruction}`,
    "",
    "Return ONLY a JSON object with the changed fields (same shape as above). Omit anything you didn't change.",
  ].join("\n");
}
