import { NextResponse } from "next/server";
import { buildArchitectSystemPrompt, buildArchitectUserPrompt } from "@/lib/architect-prompt";
import { activeModel, createWithRetry, getLlm, hasLlmKey } from "@/lib/llm";
import type { ArchitectPlan, GenerateInput, ProfileTheme, PublicSection } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const THEMES: ProfileTheme[] = ["editorial", "saas-card", "executive", "academic", "ai", "classic"];

/** Deterministic fallback plan (no key / failure) — still useful ordering. */
function fallbackPlan(input: GenerateInput): ArchitectPlan {
  const base: Record<string, number> = {
    Projects: 90, Experience: 85, Services: 80, About: 70, Testimonials: 55, Skills: 50, FAQ: 40, Chat: 75, Booking: 45,
  };
  // Re-weight by what each goal's typical visitor cares about most.
  switch (input.answers.goal) {
    case "get-hired": base.Experience = 95; base.Skills = 80; break;
    case "sell-services": base.Services = 95; base.Testimonials = 75; base.Booking = 70; break;
    case "capture-leads": base.Services = 90; base.Booking = 85; base.Testimonials = 70; break;
    case "build-authority": base.Projects = 92; base.About = 85; base.Testimonials = 65; break;
    case "creator": base.Projects = 95; base.About = 78; break;
    case "founder": base.Projects = 95; base.About = 88; base.Experience = 80; base.Booking = 70; break;
  }
  const importance: Record<string, number> = {};
  input.answers.publicSections.forEach((s) => (importance[s] = base[s] ?? 50));
  const order = [...input.answers.publicSections].sort((a, b) => (importance[b] ?? 0) - (importance[a] ?? 0));
  return {
    personaType: input.facts.role || "Professional",
    reasoning: "Ordered by what visitors for your goal most want to see.",
    visitorsWant: "Your strongest, most relevant work first.",
    pattern: "portfolio",
    recommendedTheme: input.answers.theme,
    importance,
    order,
    source: "mock",
  };
}

export async function POST(req: Request) {
  let input: GenerateInput;
  try {
    input = (await req.json()) as GenerateInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!hasLlmKey()) return NextResponse.json(fallbackPlan(input));

  try {
    const { client, model } = getLlm();
    const completion = await createWithRetry(client, {
      model,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildArchitectSystemPrompt() },
        { role: "user", content: buildArchitectUserPrompt(input) },
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;

    const rawImp = (raw.importance ?? {}) as Record<string, unknown>;
    const importance: Record<string, number> = {};
    input.answers.publicSections.forEach((s) => {
      const v = Number(rawImp[s]);
      importance[s] = Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50;
    });
    const order = ([...input.answers.publicSections] as PublicSection[]).sort(
      (a, b) => (importance[b] ?? 0) - (importance[a] ?? 0)
    );
    const recommendedTheme = THEMES.includes(raw.recommendedTheme as ProfileTheme)
      ? (raw.recommendedTheme as ProfileTheme)
      : input.answers.theme;

    const plan: ArchitectPlan = {
      personaType: String(raw.personaType ?? input.facts.role ?? "Professional").slice(0, 80),
      reasoning: String(raw.reasoning ?? "").slice(0, 400),
      visitorsWant: String(raw.visitorsWant ?? "").slice(0, 200),
      pattern: String(raw.pattern ?? "portfolio").slice(0, 40),
      recommendedTheme,
      importance,
      order,
      source: "groq",
    };
    return NextResponse.json(plan);
  } catch (err) {
    console.error("[architect] failed:", err);
    return NextResponse.json(fallbackPlan(input));
  }
}
