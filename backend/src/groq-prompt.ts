import type { GenerateInput, Goal, Tone, VisualStyle } from "./types";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

const GOAL_LABEL: Record<Goal, string> = {
  "get-hired": "get hired for a full-time role",
  "sell-services": "sell consulting / freelance services",
  "capture-leads": "capture qualified leads",
  "build-authority": "build authority and audience",
  creator: "grow a creator brand",
  founder: "tell a compelling startup founder story",
};

const TONE_GUIDANCE: Record<Tone, string> = {
  professional: "polished, credible, confident — no fluff",
  warm: "approachable and human, first-person, generous",
  bold: "punchy, opinionated, high-energy",
  technical: "precise, specific, metric-forward",
  minimal: "spare, calm, lots of negative space in the copy",
  premium: "refined and exclusive, like a high-end studio",
};

const STYLE_GUIDANCE: Record<VisualStyle, string> = {
  "clean-corporate": "clean corporate — blue/white, structured, trustworthy",
  "modern-gradient": "modern gradient — vivid blue→indigo accents, energetic",
  editorial: "editorial — serif-ish headings, magazine spacing",
  "minimal-mono": "minimal monochrome — restrained, lots of whitespace",
  "warm-rounded": "warm & rounded — soft corners, friendly blue tones",
};

export const OUTPUT_SCHEMA_HINT = `Return ONLY valid JSON matching this shape:
{
  "slug": string,
  "hero": { "eyebrow": string, "title": string, "subtitle": string,
            "primaryCta": { "label": string, "kind": "chat"|"booking"|"contact" },
            "secondaryCta": { "label": string, "kind": "chat"|"booking"|"contact" } | null,
            "stats": [{ "label": string, "value": string }] },
  "about": { "heading": string, "body": string },
  "highlights": [{ "label": string, "value": string, "caption": string }],
  "suggestedQuestions": string[],
  "chat": { "greeting": string },
  "booking": { "label": string, "note": string },
  "faq": [{ "q": string, "a": string }]
}
Write all copy in the requested tone. Never invent facts beyond the provided profile.`;

export function buildGroqSystemPrompt(): string {
  return [
    "You are PersonaOn's profile copywriter and information architect.",
    "You turn a person's verified facts + their customization choices into the",
    "copy and structure for a polished, shareable public profile and AI chat page.",
    "You write tight, specific, human copy. You never fabricate achievements,",
    "metrics, or experience that are not present in the provided facts.",
  ].join(" ");
}

export function buildGroqUserPrompt(input: GenerateInput): string {
  const { facts, answers } = input;
  const lines: string[] = [];

  lines.push("## EXTRACTED PROFILE FACTS");
  lines.push(`Name: ${facts.name}`);
  lines.push(`Role: ${facts.role}`);
  lines.push(`Headline: ${facts.headline}`);
  lines.push(`Location: ${facts.location}`);
  lines.push(`Skills: ${facts.skills.map((s) => s.label).join(", ")}`);
  lines.push("");
  lines.push("Work history:");
  facts.workHistory.forEach((w) =>
    lines.push(`  - ${w.role} @ ${w.company} (${w.period}) — ${w.summary}`)
  );
  lines.push("Projects:");
  facts.projects.forEach((p) => lines.push(`  - ${p.name}: ${p.description}`));
  lines.push("Achievements:");
  facts.achievements.forEach((a) => lines.push(`  - ${a.text}`));
  lines.push("Services offered:");
  facts.services.forEach((s) => lines.push(`  - ${s.name}: ${s.description}`));
  lines.push(`Social links: ${facts.socialLinks.map((l) => l.label).join(", ")}`);

  lines.push("");
  lines.push("## CUSTOMIZATION ANSWERS");
  lines.push(`Layout: ${answers.layout === "single" ? "single-page" : "multi-page navigation"}`);
  lines.push(`Primary goal: ${GOAL_LABEL[answers.goal]}`);
  lines.push(`Tone: ${answers.tone} (${TONE_GUIDANCE[answers.tone]})`);
  lines.push(`Visual style: ${STYLE_GUIDANCE[answers.visualStyle]}`);
  lines.push(`Public sections: ${answers.publicSections.join(", ")}`);
  lines.push(`Chat answers only from verified sources: ${answers.chatVerifiedOnly ? "yes" : "no"}`);
  lines.push(`Chat collects leads: ${answers.chatCollectLeads ? "yes" : "no"}`);
  lines.push(`Include booking CTA: ${answers.bookingCta ? "yes" : "no"}`);

  lines.push("");
  lines.push("## TASK");
  lines.push(`Generate the profile copy. Optimize the hero and CTAs for the goal "${GOAL_LABEL[answers.goal]}".`);
  lines.push(OUTPUT_SCHEMA_HINT);

  return lines.join("\n");
}

export function buildGroqPromptDisplay(input: GenerateInput): string {
  return ["▸ SYSTEM", buildGroqSystemPrompt(), "", "▸ USER", buildGroqUserPrompt(input)].join("\n");
}
