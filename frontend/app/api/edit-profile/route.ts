import { NextResponse } from "next/server";
import { buildEditSystemPrompt, buildEditUserPrompt } from "@/lib/edit-prompt";
import { activeModel, getLlm, hasLlmKey } from "@/lib/llm";
import type { GeneratedProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function applyEditPatch(base: GeneratedProfile, raw: Record<string, unknown>): GeneratedProfile {
  let n = 0;
  const eid = (p: string) => `${p}-e${n++}`;
  const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
  const arr = (v: unknown): Record<string, unknown>[] | undefined =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : undefined;
  const out: GeneratedProfile = { ...base };

  out.name = str(raw.name) ?? out.name;
  out.role = str(raw.role) ?? out.role;
  out.headline = str(raw.headline) ?? out.headline;
  out.location = str(raw.location) ?? out.location;

  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero) out.hero = { ...out.hero, eyebrow: str(hero.eyebrow) ?? out.hero.eyebrow, title: str(hero.title) ?? out.hero.title, subtitle: str(hero.subtitle) ?? out.hero.subtitle };

  const about = raw.about as Record<string, unknown> | undefined;
  if (about) out.about = { heading: str(about.heading) ?? out.about.heading, body: str(about.body) ?? out.about.body };

  const hl = arr(raw.highlights);
  if (hl) out.highlights = hl.map((h) => ({ id: eid("hl"), value: str(h.value) ?? "", label: str(h.label) ?? "", caption: str(h.caption) ?? "" }));

  const exp = arr(raw.experience);
  if (exp) out.experience = exp.map((w) => ({ id: eid("w"), role: str(w.role) ?? "", company: str(w.company) ?? "", period: str(w.period) ?? "", summary: str(w.summary) ?? "" }));

  const proj = arr(raw.projects);
  if (proj) out.projects = proj.map((p) => ({ id: eid("p"), name: str(p.name) ?? "", description: str(p.description) ?? "", tags: Array.isArray(p.tags) ? (p.tags as unknown[]).map((t) => String(t)) : [] }));

  const svc = arr(raw.services);
  if (svc) out.services = svc.map((s) => ({ id: eid("sv"), name: str(s.name) ?? "", description: str(s.description) ?? "" }));

  const faq = arr(raw.faq);
  if (faq) out.faq = faq.map((f) => ({ id: eid("f"), q: str(f.q) ?? "", a: str(f.a) ?? "" }));

  if (Array.isArray(raw.suggestedQuestions)) out.suggestedQuestions = (raw.suggestedQuestions as unknown[]).map((q) => String(q)).slice(0, 6);

  const booking = raw.booking as Record<string, unknown> | undefined;
  if (booking) out.booking = { ...out.booking, label: str(booking.label) ?? out.booking.label, note: str(booking.note) ?? out.booking.note };

  return out;
}

export async function POST(req: Request) {
  const { profile, instruction } = ((await req.json().catch(() => ({}))) ?? {}) as {
    profile?: GeneratedProfile;
    instruction?: string;
  };
  if (!profile || !instruction?.trim()) return NextResponse.json({ error: "Expected { profile, instruction }" }, { status: 400 });
  if (!hasLlmKey()) return NextResponse.json({ profile, source: "mock", model: activeModel() });

  try {
    const { client, model } = getLlm();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildEditSystemPrompt() },
        { role: "user", content: buildEditUserPrompt(profile, instruction) },
      ],
    });
    const patch = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
    return NextResponse.json({ profile: applyEditPatch(profile, patch), source: "groq", model });
  } catch (err) {
    console.error("[edit] failed:", err);
    return NextResponse.json({ profile, source: "mock", model: activeModel() });
  }
}
