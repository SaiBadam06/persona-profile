export interface ExtractSourceText {
  label: string;
  text: string;
}

export const EXTRACT_SCHEMA_HINT = `Return ONLY valid JSON in exactly this shape:
{
  "name": string,
  "headline": string,
  "role": string,
  "location": string,
  "skills": string[],
  "workHistory": [{ "role": string, "company": string, "period": string, "summary": string }],
  "projects": [{ "name": string, "description": string, "tags": string[] }],
  "achievements": string[],
  "services": [{ "name": string, "description": string }],
  "socialLinks": [{ "kind": "linkedin"|"github"|"x"|"website"|"email"|"other", "label": string, "url": string }]
}`;

export function buildExtractSystemPrompt(): string {
  return [
    "You are PersonaOn's information-extraction engine.",
    "You read a person's documents (resume, exported LinkedIn profile PDF, website text, a short bio)",
    "and extract accurate, structured facts about them.",
    "RULES: Use ONLY information present in the provided text. Never invent employers, dates,",
    "metrics, or skills. If something is absent, omit it or leave that array empty.",
    "Normalize roles/titles cleanly (e.g. 'Sr. SWE' -> 'Senior Software Engineer').",
    "Summaries should be one tight sentence each, factual, drawn from the source.",
    "Infer the most recent role as the primary 'role'. Derive a concise 'headline' from the person's own words where possible.",
  ].join(" ");
}

export function buildExtractUserPrompt(sources: ExtractSourceText[]): string {
  const blocks = sources
    .filter((s) => s.text.trim().length > 0)
    .map((s) => `## SOURCE: ${s.label}\n${s.text.trim()}`)
    .join("\n\n");

  return [
    "Extract this person's profile from the following sources.",
    "",
    blocks || "(no readable source text was provided)",
    "",
    "## OUTPUT",
    EXTRACT_SCHEMA_HINT,
  ].join("\n");
}
