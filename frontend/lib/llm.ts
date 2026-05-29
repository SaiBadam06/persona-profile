import OpenAI from "openai";

// Unified LLM client — Groq (default) or NVIDIA NIM, both OpenAI-compatible.
//   LLM_PROVIDER=groq (default)  GROQ_API_KEY,   GROQ_MODEL
//   LLM_PROVIDER=nvidia          NVIDIA_API_KEY, NVIDIA_MODEL

export function activeProvider(): string {
  return (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
}

export function activeModel(): string {
  if (activeProvider() === "nvidia") {
    return process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct";
  }
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

/** Lighter, higher-rate-limit model for the big extraction prompt. */
export function extractModel(): string {
  if (activeProvider() === "nvidia") {
    return process.env.NVIDIA_EXTRACT_MODEL ?? "meta/llama-3.1-8b-instruct";
  }
  return process.env.GROQ_EXTRACT_MODEL ?? "llama-3.1-8b-instant";
}

export function hasLlmKey(): boolean {
  return activeProvider() === "nvidia"
    ? !!process.env.NVIDIA_API_KEY
    : !!process.env.GROQ_API_KEY;
}

export function getLlm(modelOverride?: string): { client: OpenAI; model: string } {
  const model = modelOverride ?? activeModel();
  if (activeProvider() === "nvidia") {
    return {
      client: new OpenAI({ baseURL: "https://integrate.api.nvidia.com/v1", apiKey: process.env.NVIDIA_API_KEY ?? "" }),
      model,
    };
  }
  return {
    client: new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY ?? "" }),
    model,
  };
}

/** Run a chat completion with one retry on 429 (rate limit). */
export async function createWithRetry(
  client: OpenAI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any
): Promise<{ choices: { message?: { content?: string | null } }[] }> {
  try {
    return await client.chat.completions.create(args);
  } catch (e) {
    const s = `${(e as { status?: number })?.status ?? ""} ${(e as Error)?.message ?? ""}`;
    if (s.includes("429") || /rate.?limit/i.test(s)) {
      await new Promise((r) => setTimeout(r, 4000));
      return await client.chat.completions.create(args);
    }
    throw e;
  }
}
