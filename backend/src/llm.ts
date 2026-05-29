import OpenAI from "openai";

// Unified LLM client. Both Groq and NVIDIA NIM are OpenAI-compatible, so we
// switch providers with one env var. Default = Groq (strong + fast).
//   LLM_PROVIDER=groq    (default)  GROQ_API_KEY,   GROQ_MODEL
//   LLM_PROVIDER=nvidia             NVIDIA_API_KEY, NVIDIA_MODEL

export function activeProvider(): string {
  return (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
}

export function activeModel(): string {
  if (activeProvider() === "nvidia") {
    // NOTE: default to a strong model — gemma-2-2b-it is too small for good extraction.
    return process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct";
  }
  return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
}

export function hasLlmKey(): boolean {
  return activeProvider() === "nvidia"
    ? !!process.env.NVIDIA_API_KEY
    : !!process.env.GROQ_API_KEY;
}

export function getLlm(): { client: OpenAI; model: string } {
  if (activeProvider() === "nvidia") {
    return {
      client: new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: process.env.NVIDIA_API_KEY ?? "",
      }),
      model: activeModel(),
    };
  }
  return {
    client: new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY ?? "",
    }),
    model: activeModel(),
  };
}
