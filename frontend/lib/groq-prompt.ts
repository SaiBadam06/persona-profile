import type { GenerateInput, Goal, Tone, VisualStyle } from "./types";

// ---------------------------------------------------------------------------
// Shared Groq prompt construction.
// Used by GroqGenerationPanel (to SHOW the prompt) and by /api/generate-profile
// (to actually SEND it). Keeping one source of truth means the panel never
// lies about what the model receives.
// ---------------------------------------------------------------------------

export const GROQ_MODEL = "llama-3.3-70b-versatile";

const GOAL_LABEL: Record<Goal, string> = {
  "get-hired": "get hired for a full-time role",
  "sell-services": "sell consulting / freelance services",
  "capture-leads": "capture qualified leads",
  "build-authority": "build authority and audience",
  creator: "grow a creator brand",
  founder: "tell a compelling startup founder story",
};

// Per-goal playbook: what to emphasize, the CTA strategy, how the AI chat should
// behave, and what a great visit should end in. Drives role-aware generation so a
// founder's page reads nothing like a job-seeker's, even on the same template.
const GOAL_PLAYBOOK: Record<Goal, string> = {
  "get-hired":
    "Audience: recruiters & hiring managers. Lead with experience, impact metrics, and skills. " +
    "Hero CTA points to chat/contact. Chat should answer role-fit questions and surface availability. " +
    "A great visit ends in a recruiter reaching out about a role.",
  "sell-services":
    "Audience: prospective clients. Lead with services, a clear process, and proof (testimonials, outcomes). " +
    "Hero CTA pushes to book an intro call. Chat should qualify scope/needs and steer toward booking. " +
    "A great visit ends in a booked discovery call.",
  "capture-leads":
    "Audience: warm inbound. Make the next step obvious and low-friction. Emphasize a single offer and social proof. " +
    "Hero CTA captures contact or books a call. Chat should ask 1–2 qualifying questions, then collect the lead. " +
    "A great visit ends in a captured, qualified lead.",
  "build-authority":
    "Audience: peers, press, event organizers. Lead with point of view, writing/speaking, and notable work. " +
    "Hero CTA invites following or reaching out. Chat should speak to their thinking and body of work. " +
    "A great visit ends in a follow, a press/podcast invite, or a subscribe.",
  creator:
    "Audience: fans & collaborators. Lead with projects, output, and what they're building/making. " +
    "Hero CTA pushes to the work or to collaborate. Chat should be energetic and showcase output. " +
    "A great visit ends in a new follower or collaboration request.",
  founder:
    "Audience: investors, candidates, partners, press. Lead with traction (real metrics/stats), what they're building, " +
    "and vision. Hero CTA pushes to book a call or get the deck. Chat should pitch on their behalf and qualify whether " +
    "the visitor is an investor, candidate, or customer, then route accordingly. A great visit ends in a booked call.",
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
  "suggestedQuestions": string[],     // 4-6 questions a visitor might ask the chat
  "chat": { "greeting": string },
  "booking": { "label": string, "note": string },
  "faq": [{ "q": string, "a": string }]
}
Stats: 1–3 items. "value" is ONE metric token only (e.g. "$1.2M", "40k", "2023", "3×", "98%").
"label" is a 1–3 word metric descriptor in Title case (e.g. "ARR", "Paying teams", "Funding raised",
"Years leading product") — never a sentence, a fragment, or a trailing preposition like "...to"/"...at".
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
  lines.push("## GOAL PLAYBOOK");
  lines.push(GOAL_PLAYBOOK[answers.goal]);

  lines.push("");
  lines.push("## TASK");
  lines.push(
    `Generate the profile copy. Optimize the hero, CTAs, suggested questions, chat greeting, and FAQ for the goal "${GOAL_LABEL[answers.goal]}" using the playbook above. Emphasize the sections that audience cares about most.`
  );
  lines.push(OUTPUT_SCHEMA_HINT);

  return lines.join("\n");
}

/** Single combined string for display in the generation panel. */
export function buildGroqPromptDisplay(input: GenerateInput): string {
  return [
    "▸ SYSTEM",
    buildGroqSystemPrompt(),
    "",
    "▸ USER",
    buildGroqUserPrompt(input),
  ].join("\n");
}
