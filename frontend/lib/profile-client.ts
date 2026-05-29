import { API_BASE } from "./config";
import { generateProfileWithGroqMock } from "./generate-profile";
import { buildGroqPromptDisplay, GROQ_MODEL } from "./groq-prompt";
import type { GenerateInput, GenerateResult } from "./types";

// ---------------------------------------------------------------------------
// Client entry point for profile generation.
// Calls the server route (which uses real Groq when a key is configured) and
// transparently falls back to the local mock if the request fails. The UI
// reads `result.source` to label whether copy came from Groq or the mock.
// ---------------------------------------------------------------------------

export async function generateProfile(
  input: GenerateInput
): Promise<GenerateResult> {
  const prompt = buildGroqPromptDisplay(input);

  try {
    const res = await fetch(`${API_BASE}/api/generate-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Route responded ${res.status}`);
    const data = (await res.json()) as GenerateResult;
    return data;
  } catch {
    // Offline / no key / route error — still produce a great result.
    return {
      profile: generateProfileWithGroqMock(input),
      prompt,
      source: "mock",
      model: GROQ_MODEL,
    };
  }
}
