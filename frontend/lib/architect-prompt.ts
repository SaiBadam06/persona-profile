import type { GenerateInput } from "./types";

// The "Persona Architect": reasons about persona → information architecture →
// importance → best layout template, in ONE structured call (before any UI).

export function buildArchitectSystemPrompt(): string {
  return [
    "You are PersonaOn's senior UX & information architect.",
    "Before any UI is generated, you analyze a person's verified data and their goal,",
    "then decide: (1) what kind of professional they are, (2) what visitors most want to see,",
    "(3) an importance score (0-100) for each public section, and (4) which design template fits best.",
    "Every template now reflows its sections through a balanced masonry, so none ever leaves empty",
    "white space — choose purely on fit and feel:",
    "'editorial' (storyteller/founder/writer, serif broadsheet), 'saas-card' (PM/operator/engineer, card UI),",
    "'executive' (senior leader/consultant, dark hero + stats), 'academic' (researcher/student, CV style),",
    "'ai' (bold, unique, stand-out), 'classic' (versatile blue/white).",
    "Score by what a typical visitor for this person's goal cares about — e.g. recruiters weight Experience,",
    "clients weight Services/Projects, researchers weight Projects/Publications, students weight Projects/Skills.",
    "Return ONLY JSON. Never invent facts.",
  ].join(" ");
}

export function buildArchitectUserPrompt(input: GenerateInput): string {
  const { facts, answers } = input;
  const summary = [
    `Name: ${facts.name}`,
    `Role/headline: ${facts.role} — ${facts.headline}`,
    `Counts: ${facts.workHistory.length} roles, ${facts.projects.length} projects, ${facts.services.length} services, ${facts.skills.length} skills, ${facts.achievements.length} achievements`,
    `Top skills: ${facts.skills.slice(0, 8).map((s) => s.label).join(", ")}`,
    `Stated goal: ${answers.goal}. Tone: ${answers.tone}. Booking enabled: ${answers.bookingCta}.`,
    `Public sections chosen: ${answers.publicSections.join(", ")}`,
  ].join("\n");

  return [
    summary,
    "",
    "Decide the information architecture. Return ONLY this JSON:",
    `{
  "personaType": string,            // e.g. "Early-career ML engineer", "Founder", "Researcher"
  "visitorsWant": string,           // one sentence: what visitors most want
  "reasoning": string,              // 2-3 sentences: why this layout & emphasis
  "pattern": "portfolio"|"recruiter"|"founder"|"research"|"creator"|"student",
  "recommendedTheme": "editorial"|"saas-card"|"executive"|"academic"|"ai"|"classic",
  "importance": { ${answers.publicSections.map((s) => `"${s}": 0-100`).join(", ")} }
}`,
    "Give the most valuable sections the highest scores so they get the most space and appear first.",
  ].join("\n");
}
