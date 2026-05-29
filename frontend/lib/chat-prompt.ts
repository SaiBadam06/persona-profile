import type { ExtractedFacts, GeneratedProfile } from "./types";

// Grounds the public chat in the person's verified profile data.

export function buildChatSystemPrompt(profile: GeneratedProfile): string {
  const first = profile.name.split(" ")[0] || "this person";
  return [
    `You are ${profile.name}'s AI assistant on their public PersonaOn profile.`,
    `Answer visitor questions in the first person, as if speaking for ${first}, in a ${profile.tone} tone.`,
    profile.chat.verifiedOnly
      ? "Use ONLY the verified profile facts provided. If the answer isn't in them, say you don't have that detail and suggest booking a call or asking something else. NEVER invent facts."
      : "Prefer the provided facts; you may add light, reasonable context but never fabricate specific claims.",
    "Keep answers to 2–4 sentences, warm and specific.",
    'Return JSON: { "answer": string, "sources": string[] } where sources is a subset of ["LinkedIn","Resume","Website"] indicating what you drew from.',
  ].join(" ");
}

export function buildChatUserPrompt(
  profile: GeneratedProfile,
  facts: ExtractedFacts,
  question: string
): string {
  const ctx = [
    `Name: ${facts.name || profile.name}`,
    `Role: ${facts.role || profile.role}`,
    `Headline: ${facts.headline || profile.headline}`,
    `Location: ${facts.location || profile.location}`,
    `About: ${profile.about.body}`,
    `Skills: ${facts.skills.map((s) => s.label).join(", ")}`,
    "Experience:",
    ...facts.workHistory.map((w) => `  - ${w.role} @ ${w.company} (${w.period}): ${w.summary}`),
    "Projects:",
    ...facts.projects.map((p) => `  - ${p.name}: ${p.description}`),
    "Services:",
    ...facts.services.map((s) => `  - ${s.name}: ${s.description}`),
    "Achievements:",
    ...facts.achievements.map((a) => `  - ${a.text}`),
    `Open to bookings: ${profile.booking.enabled ? "yes — " + profile.booking.label : "no"}`,
  ].join("\n");

  return `VERIFIED PROFILE FACTS:\n${ctx}\n\nVISITOR QUESTION: ${question}\n\nReturn the JSON answer now.`;
}
