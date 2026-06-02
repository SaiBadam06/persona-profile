import { API_BASE } from "./config";
import type { ExtractedFacts, GeneratedProfile, PersonaChatResponse } from "./types";

/**
 * Send one message to the published-page chat. The route decides whether to
 * answer the visitor, edit the page, or decline. Returns `null` when there is
 * no LLM key / the model failed, so the caller can use its local Q&A fallback.
 */
export async function sendPersonaChat(
  profile: GeneratedProfile,
  facts: ExtractedFacts,
  message: string
): Promise<PersonaChatResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/persona-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, facts, message }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PersonaChatResponse & { source?: string };
    if (data.source !== "groq" || !data.intent) return null;
    return data;
  } catch {
    return null;
  }
}
