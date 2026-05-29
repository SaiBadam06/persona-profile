import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { buildExtractSystemPrompt, buildExtractUserPrompt, type ExtractSourceText } from "@/lib/extract-prompt";
import { activeModel, createWithRetry, extractModel, getLlm, hasLlmKey } from "@/lib/llm";
import type { ExtractedFacts, ExtractResult, SocialKind, SourceCard } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 8000;
let seq = 0;
const id = (p: string) => `${p}-${seq++}`;

async function pdfToText(buf: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).trim();
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebsite(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonaOnBot/1.0; +https://personaon.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return htmlToText(await res.text());
  } finally {
    clearTimeout(t);
  }
}

function normalizeFacts(raw: Record<string, unknown>): ExtractedFacts {
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const kinds: SocialKind[] = ["linkedin", "github", "x", "website", "email", "other"];
  return {
    name: str(raw.name),
    headline: str(raw.headline),
    role: str(raw.role),
    location: str(raw.location),
    skills: arr(raw.skills).map((s) => str(s)).filter(Boolean).map((label) => ({ id: id("sk"), label })),
    workHistory: arr(raw.workHistory).map((w) => {
      const o = (w ?? {}) as Record<string, unknown>;
      return { id: id("w"), role: str(o.role), company: str(o.company), period: str(o.period), summary: str(o.summary) };
    }),
    projects: arr(raw.projects).map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return { id: id("p"), name: str(o.name), description: str(o.description), tags: arr(o.tags).map((t) => str(t)).filter(Boolean) };
    }),
    achievements: arr(raw.achievements).map((a) => str(a)).filter(Boolean).map((text) => ({ id: id("a"), text })),
    services: arr(raw.services).map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { id: id("sv"), name: str(o.name), description: str(o.description) };
    }),
    socialLinks: arr(raw.socialLinks).map((l) => {
      const o = (l ?? {}) as Record<string, unknown>;
      const kind = kinds.includes(o.kind as SocialKind) ? (o.kind as SocialKind) : "other";
      return { id: id("ln"), kind, label: str(o.label), url: str(o.url) };
    }),
  };
}

export async function POST(req: Request) {
  const notes: string[] = [];
  const sources: SourceCard[] = [];
  const texts: ExtractSourceText[] = [];

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const linkedin = form.get("linkedin");
  const resume = form.get("resume");
  const websiteUrl = (form.get("website") as string | null)?.trim() ?? "";
  const manualBio = (form.get("manualBio") as string | null)?.trim() ?? "";

  if (linkedin instanceof File && linkedin.size > 0) {
    try {
      const text = await pdfToText(await linkedin.arrayBuffer());
      if (text.length < 20) throw new Error("empty");
      texts.push({ label: "LinkedIn profile PDF", text: text.slice(0, MAX_TEXT) });
      sources.push({ id: "src-linkedin", kind: "linkedin", label: "LinkedIn PDF", value: linkedin.name, status: "complete", detail: `Read ${text.length.toLocaleString()} characters` });
    } catch {
      sources.push({ id: "src-linkedin", kind: "linkedin", label: "LinkedIn PDF", value: linkedin.name, status: "failed", detail: "No selectable text (scanned PDF?)" });
      notes.push("LinkedIn PDF had no readable text.");
    }
  }
  if (resume instanceof File && resume.size > 0) {
    try {
      const text = await pdfToText(await resume.arrayBuffer());
      if (text.length < 20) throw new Error("empty");
      texts.push({ label: "Resume / CV PDF", text: text.slice(0, MAX_TEXT) });
      sources.push({ id: "src-resume", kind: "resume", label: "Resume / CV", value: resume.name, status: "complete", detail: `Read ${text.length.toLocaleString()} characters` });
    } catch {
      sources.push({ id: "src-resume", kind: "resume", label: "Resume / CV", value: resume.name, status: "failed", detail: "No selectable text (scanned PDF?)" });
      notes.push("Resume PDF had no readable text.");
    }
  }
  if (websiteUrl) {
    try {
      const text = await fetchWebsite(websiteUrl);
      if (text.length < 40) throw new Error("empty");
      texts.push({ label: `Website (${websiteUrl})`, text: text.slice(0, MAX_TEXT) });
      sources.push({ id: "src-website", kind: "website", label: "Website", value: websiteUrl, status: "complete", detail: `Crawled ${text.length.toLocaleString()} characters` });
    } catch {
      sources.push({ id: "src-website", kind: "website", label: "Website", value: websiteUrl, status: "failed", detail: "Couldn't fetch (blocked or offline)" });
      notes.push(`Website ${websiteUrl} couldn't be crawled.`);
    }
  }
  if (manualBio) {
    texts.push({ label: "Manual bio", text: manualBio.slice(0, MAX_TEXT) });
    sources.push({ id: "src-manual", kind: "manual", label: "Manual bio", value: manualBio, status: "complete", detail: "Captured" });
  }

  if (texts.length === 0 || !hasLlmKey()) {
    notes.push(texts.length === 0 ? "No readable source text — start from a blank profile." : "No LLM API key set — extraction unavailable.");
    const empty: ExtractedFacts = { name: "", headline: "", role: "", location: "", skills: [], workHistory: [], projects: [], achievements: [], services: [], socialLinks: [] };
    const result: ExtractResult = { facts: empty, sources, source: "mock", model: activeModel(), notes };
    return NextResponse.json(result);
  }

  try {
    const { client, model } = getLlm(extractModel());
    const completion = await createWithRetry(client, {
      model,
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractSystemPrompt() },
        { role: "user", content: buildExtractUserPrompt(texts) },
      ],
    });
    const facts = normalizeFacts(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
    if (!facts.name && !facts.workHistory.length && !facts.skills.length) notes.push("Model returned little usable data — review and edit.");
    const result: ExtractResult = { facts, sources, source: "groq", model, notes };
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extract] failed:", msg);
    notes.push(`Extraction failed: ${msg.slice(0, 220)}`);
    // Return a BLANK profile (not the demo) + the real reason, so you can see what broke and edit your own.
    const empty: ExtractedFacts = { name: "", headline: "", role: "", location: "", skills: [], workHistory: [], projects: [], achievements: [], services: [], socialLinks: [] };
    return NextResponse.json({ facts: empty, sources, source: "mock", model: activeModel(), notes });
  }
}
