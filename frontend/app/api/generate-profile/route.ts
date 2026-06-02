import { NextResponse } from "next/server";
import { generateProfileWithGroqMock } from "@/lib/generate-profile";
import { buildGroqPromptDisplay, buildGroqSystemPrompt, buildGroqUserPrompt } from "@/lib/groq-prompt";
import { buildLayoutSystemPrompt, buildLayoutUserPrompt, validateLayoutSpec } from "@/lib/layout-prompt";
import { activeModel, createWithRetry, getLlm, hasLlmKey } from "@/lib/llm";
import type { GenerateInput, GeneratedProfile, GenerateResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Clamp a stat label to a length without cutting a word in half or leaving a
// dangling connector — so "Scaled flagship product to" never renders as "...pr".
function clampStatLabel(s: string, max = 36): string {
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > max) {
    const cut = s.slice(0, max);
    const sp = cut.lastIndexOf(" ");
    s = sp > 12 ? cut.slice(0, sp) : cut;
  }
  return s.replace(/[\s,;:.–—-]*\b(?:to|of|in|on|at|for|and|with|by|from|the|a|an)$/i, "").replace(/[\s,;:–—-]+$/, "").trim();
}

/** Keep stat "value" a short number; push any extra description into the label. */
function sanitizeStats(arr: unknown, fallback: GeneratedProfile["hero"]["stats"]): GeneratedProfile["hero"]["stats"] {
  if (!Array.isArray(arr) || !arr.length) return fallback;
  return (arr as Record<string, unknown>[])
    .map((s) => {
      let value = String(s.value ?? "").trim();
      let label = String(s.label ?? "").trim();
      const m = value.match(/^(\$?\d[\d,.]*\s?[KkMmBb%+]?\+?)/);
      if (m && m[1].length < value.length) {
        const extra = value.slice(m[1].length).replace(/^[\s(:–—-]+/, "").replace(/[)\s]+$/, "").trim();
        if (extra) label = label ? `${extra}` : extra;
        value = m[1].trim();
      }
      return { value: value.slice(0, 10), label: clampStatLabel(label) };
    })
    .filter((s) => s.value)
    .slice(0, 3);
}

function applyModelCopy(base: GeneratedProfile, raw: Record<string, unknown>): GeneratedProfile {
  const out: GeneratedProfile = { ...base };
  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero) {
    out.hero = {
      ...base.hero,
      eyebrow: (hero.eyebrow as string) ?? base.hero.eyebrow,
      title: (hero.title as string) ?? base.hero.title,
      subtitle: (hero.subtitle as string) ?? base.hero.subtitle,
      stats: sanitizeStats(hero.stats, base.hero.stats),
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
