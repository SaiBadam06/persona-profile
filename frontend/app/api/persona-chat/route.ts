import { NextResponse } from "next/server";
import { applyEditPatch } from "@/lib/apply-edit-patch";
import { buildPersonaChatSystemPrompt, buildPersonaChatUserPrompt } from "@/lib/persona-chat";
import { createWithRetry, getLlm, hasLlmKey } from "@/lib/llm";
import type {
  ChatSource,
  ExtractedFacts,
  GeneratedProfile,
  PersonaChatIntent,
  PersonaChatResponse,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCE_MAP: Record<string, ChatSource> = {
  linkedin: { kind: "linkedin", label: "LinkedIn" },
  resume: { kind: "resume", label: "Resume" },
  website: { kind: "website", label: "Website" },
};

/** Signal the client to fall back to its local Q&A sim (no key / model failure). */
function mock(): NextResponse {
  return NextResponse.json({ source: "mock" } as Partial<PersonaChatResponse>, { status: 200 });
}

export async function POST(req: Request) {
  const { profile, facts, message } = ((await req.json().catch(() => ({}))) ?? {}) as {
    profile?: GeneratedProfile;
    facts?: ExtractedFacts;
    message?: string;
  };
  if (!profile || !facts || !message?.trim()) {
    return NextResponse.json({ error: "Expected { profile, facts, message }" }, { status: 400 });
  }
  if (!hasLlmKey()) return mock();

  try {
    const { client, model } = getLlm();
    const completion = await createWithRetry(client, {
      model,
      temperature: 0.5,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildPersonaChatSystemPrompt(profile) },
        { role: "user", content: buildPersonaChatUserPrompt(profile, facts, message) },
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      intent?: string;
      reply?: string;
      sources?: string[];
      patch?: Record<string, unknown>;
    };

    const reply = (raw.reply ?? "").trim();
    let intent: PersonaChatIntent =
      raw.intent === "edit" || raw.intent === "refuse" ? raw.intent : "answer";

    // An "edit" with no usable patch degrades to a plain answer so the page never
    // silently "succeeds" without changing anything.
    const hasPatch = raw.patch && typeof raw.patch === "object" && Object.keys(raw.patch).length > 0;
    if (intent === "edit" && !hasPatch) intent = "answer";

    if (intent === "edit") {
      const updatedProfile = applyEditPatch(profile, raw.patch as Record<string, unknown>);
      const res: PersonaChatResponse = {
        intent: "edit",
        reply: reply || "Done — I've updated your page.",
        updatedProfile,
        source: "groq",
      };
      return NextResponse.json(res);
    }

    if (intent === "refuse") {
      const first = profile.name.split(" ")[0] || "this person";
      const res: PersonaChatResponse = {
        intent: "refuse",
        reply: reply || `I can only help with ${first}'s profile and this page — ask about their work, or tell me how to restyle the page.`,
        source: "groq",
      };
      return NextResponse.json(res);
    }

    // intent === "answer"
    if (!reply) return mock(); // empty answer → let the client use its local sim
    const sources: ChatSource[] = (Array.isArray(raw.sources) ? raw.sources : [])
      .map((s) => SOURCE_MAP[String(s).toLowerCase()])
      .filter(Boolean)
      .slice(0, 3);
    const res: PersonaChatResponse = { intent: "answer", reply, sources, source: "groq" };
    return NextResponse.json(res);
  } catch (err) {
    console.error("[persona-chat] failed:", err);
    return mock();
  }
}
