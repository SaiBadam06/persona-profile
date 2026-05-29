import { NextResponse } from "next/server";
import { generateProfileWithGroqMock } from "@/lib/generate-profile";
import { buildGroqPromptDisplay, buildGroqSystemPrompt, buildGroqUserPrompt } from "@/lib/groq-prompt";
import { buildLayoutSystemPrompt, buildLayoutUserPrompt, validateLayoutSpec } from "@/lib/layout-prompt";
import { activeModel, createWithRetry, getLlm, hasLlmKey } from "@/lib/llm";
import type { GenerateInput, GeneratedProfile, GenerateResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function applyModelCopy(base: GeneratedProfile, raw: Record<string, unknown>): GeneratedProfile {
  const out: GeneratedProfile = { ...base };
  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero) {
    out.hero = {
      ...base.hero,
      eyebrow: (hero.eyebrow as string) ?? base.hero.eyebrow,
      title: (hero.title as string) ?? base.hero.title,
      subtitle: (hero.subtitle as string) ?? base.hero.subtitle,
      stats: Array.isArray(hero.stats) && hero.stats.length ? (hero.stats as GeneratedProfile["hero"]["stats"]) : base.hero.stats,
    };
  }
  const about = raw.about as Record<string, string> | undefined;
  if (about) out.about = { heading: about.heading ?? base.about.heading, body: about.body ?? base.about.body };
  if (Array.isArray(raw.highlights) && raw.highlights.length) {
    out.highlights = (raw.highlights as Record<string, string>[]).map((h, i) => ({ id: `hl-${i}`, value: h.value ?? "", label: h.label ?? "", caption: h.caption ?? "" }));
  }
  if (Array.isArray(raw.suggestedQuestions) && raw.suggestedQuestions.length) out.suggestedQuestions = (raw.suggestedQuestions as string[]).slice(0, 6);
  const chat = raw.chat as Record<string, string> | undefined;
  if (chat?.greeting) out.chat = { ...base.chat, greeting: chat.greeting };
  const booking = raw.booking as Record<string, string> | undefined;
  if (booking) out.booking = { ...base.booking, label: booking.label ?? base.booking.label, note: booking.note ?? base.booking.note };
  if (Array.isArray(raw.faq) && raw.faq.length && base.faq.length) {
    out.faq = (raw.faq as Record<string, string>[]).map((f, i) => ({ id: `f-${i}`, q: f.q ?? "", a: f.a ?? "" }));
  }
  if (typeof raw.slug === "string" && raw.slug.trim()) out.slug = raw.slug.trim();
  return out;
}

export async function POST(req: Request) {
  let input: GenerateInput;
  try {
    input = (await req.json()) as GenerateInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = buildGroqPromptDisplay(input);
  const mockProfile = generateProfileWithGroqMock(input);
  const model = activeModel();

  if (!hasLlmKey()) {
    const result: GenerateResult = { profile: { ...mockProfile, generatedBy: "mock", model: "mock (no LLM key)" }, prompt, source: "mock", model };
    return NextResponse.json(result);
  }

  try {
    const { client, model: m } = getLlm();
    const completion = await createWithRetry(client, {
      model: m,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildGroqSystemPrompt() },
        { role: "user", content: buildGroqUserPrompt(input) },
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
    const profile = applyModelCopy(mockProfile, raw);
    profile.generatedBy = "groq";
    profile.model = m;

    if (input.answers.theme === "ai") {
      try {
        const layout = await createWithRetry(client, {
          model: m,
          temperature: 0.85,
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildLayoutSystemPrompt() },
            { role: "user", content: buildLayoutUserPrompt(profile) },
          ],
        });
        const spec = validateLayoutSpec(JSON.parse(layout.choices[0]?.message?.content ?? "{}"));
        if (spec) profile.layoutSpec = spec;
      } catch (e) {
        console.error("[generate] layout failed:", e);
      }
    }

    const result: GenerateResult = { profile, prompt, source: "groq", model: m };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate] LLM failed:", err);
    const result: GenerateResult = { profile: { ...mockProfile, generatedBy: "mock", model: "mock (LLM fallback)" }, prompt, source: "mock", model };
    return NextResponse.json(result);
  }
}
