import { NextResponse } from "next/server";
import { applyEditPatch } from "@/lib/apply-edit-patch";
import { buildEditSystemPrompt, buildEditUserPrompt } from "@/lib/edit-prompt";
import { activeModel, createWithRetry, getLlm, hasLlmKey } from "@/lib/llm";
import type { GeneratedProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { profile, instruction } = ((await req.json().catch(() => ({}))) ?? {}) as {
    profile?: GeneratedProfile;
    instruction?: string;
  };
  if (!profile || !instruction?.trim()) return NextResponse.json({ error: "Expected { profile, instruction }" }, { status: 400 });
  if (!hasLlmKey()) return NextResponse.json({ profile, source: "mock", model: activeModel() });

  try {
    const { client, model } = getLlm();
    const completion = await createWithRetry(client, {
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
