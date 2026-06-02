import type { GeneratedProfile } from "./types";

export function buildEditSystemPrompt(): string {
  return [
    "You are PersonaOn's profile editor. You receive the current profile + an instruction.",
    "Return a JSON PATCH with ONLY the fields the user asked to change.",
    "",
    "COPY: rewrite wording (shorten, elaborate, punchier, formal) — never invent facts.",
    "DESIGN: you may also restyle the page when asked:",
    "  'theme': 'editorial' | 'saas-card' | 'executive' | 'academic' | 'ai' | 'classic'",
    "    (editorial=storyteller, saas-card=PM/engineer, executive=dark/senior-leader,",
    "     academic=researcher, ai=bold unique bento, classic=clean blue/white)",
    "  'font': 'sans' | 'serif' | 'mono' | 'mixed'",
    "  'layout': 'single' | 'multi'",
    "  'avatarShape': 'circle' | 'rounded' | 'square'",
    "  'order': array of section names to reorder the page (e.g. lead with Projects).",
    "Map natural language to these (e.g. 'dark'/'bold executive'→executive, 'serif/elegant'→serif,",
    "'multi page/tabs'→multi, 'round photo'→circle, 'colorful/unique'→ai).",
    "Keep arrays the same length unless asked to add/remove. Only include changed fields.",
  ].join("\n");
}

export function buildEditUserPrompt(profile: GeneratedProfile, instruction: string): string {
  const design = {
    theme: profile.theme,
    font: profile.font ?? "mixed",
    layout: profile.layout,
    avatarShape: profile.avatarShape ?? "circle",
    sections: profile.sections,
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
  return [
    "CURRENT DESIGN (JSON):",
    JSON.stringify(design),
    "",
    "CURRENT COPY (JSON):",
    JSON.stringify(copy, null, 2),
    "",
    `INSTRUCTION: ${instruction}`,
    "",
    "Return ONLY a JSON object with the changed fields (copy and/or design). Omit unchanged fields.",
  ].join("\n");
}
