import { NextResponse } from "next/server";
import { buildChatSystemPrompt, buildChatUserPrompt } from "@/lib/chat-prompt";
import { getLlm, hasLlmKey } from "@/lib/llm";
import type { ChatSource, ExtractedFacts, GeneratedProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCE_MAP: Record<string, ChatSource> = {
  linkedin: { kind: "linkedin", label: "LinkedIn" },
  resume: { kind: "resume", label: "Resume" },
  website: { kind: "website", label: "Website" },
};

export async function POST(req: Request) {
  const { profile, facts, question } = ((await req.json().catch(() => ({}))) ?? {}) as {
    profile?: GeneratedProfile;
    facts?: ExtractedFacts;
    question?: string;
  };
  if (!profile || !facts || !question?.trim()) {
    return NextResponse.json({ error: "Expected { profile, facts, question }" }, { status: 400 });
  }
  // No key → signal the client to use its local fallback.
  if (!hasLlmKey()) return NextResponse.json({ source: "mock" }, { status: 200 });

  try {
    const { client, model } = getLlm();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildChatSystemPrompt(profile) },
        { role: "user", content: buildChatUserPrompt(profile, facts, question) },
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      answer?: string;
      sources?: string[];
    };
    const text = (raw.answer ?? "").trim();
    if (!text) throw new Error("empty answer");
    const sources: ChatSource[] = (Array.isArray(raw.sources) ? raw.sources : [])
      .map((s) => SOURCE_MAP[String(s).toLowerCase()])
      .filter(Boolean)
      .slice(0, 3);
    return NextResponse.json({ text, sources, source: "groq" });
  } catch (err) {
    console.error("[chat] failed:", err);
    return NextResponse.json({ source: "mock" }, { status: 200 });
  }
}
