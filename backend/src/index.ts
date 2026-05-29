// Load backend/.env locally (Render injects env vars, so guard for its absence).
try {
  process.loadEnvFile();
} catch {
  /* no .env file — rely on the platform's environment */
}

import express from "express";
import cors from "cors";
import multer from "multer";
import { extractText, getDocumentProxy } from "unpdf";
import { activeModel, activeProvider, getLlm, hasLlmKey } from "./llm";
import {
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
  type ExtractSourceText,
} from "./extract-prompt";
import {
  buildGroqPromptDisplay,
  buildGroqSystemPrompt,
  buildGroqUserPrompt,
} from "./groq-prompt";
import { generateProfileWithGroqMock } from "./generate-profile";
import { buildLayoutSystemPrompt, buildLayoutUserPrompt, validateLayoutSpec } from "./layout-prompt";
import { buildEditSystemPrompt, buildEditUserPrompt } from "./edit-prompt";
import { MOCK_EXTRACTED_FACTS } from "./mock-data";
import type {
  ExtractedFacts,
  ExtractResult,
  GenerateInput,
  GeneratedProfile,
  GenerateResult,
  SocialKind,
  SourceCard,
} from "./types";

const PORT = Number(process.env.PORT) || 8787;
const MAX_TEXT = 14000;
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(
  cors({
    origin: ORIGINS.includes("*") ? true : ORIGINS,
  })
);
app.use(express.json({ limit: "2mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

let seq = 0;
const id = (p: string) => `${p}-${seq++}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function pdfToText(buf: Buffer): Promise<string> {
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
  const validKinds: SocialKind[] = ["linkedin", "github", "x", "website", "email", "other"];
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
      const kind = validKinds.includes(o.kind as SocialKind) ? (o.kind as SocialKind) : "other";
      return { id: id("ln"), kind, label: str(o.label), url: str(o.url) };
    }),
  };
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
      // CTAs fixed to "Book a meeting" / "Chat with my persona" — keep base.
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

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/health", (_req, res) => res.json({ ok: true, provider: activeProvider(), model: activeModel(), hasKey: hasLlmKey() }));

app.post(
  "/api/extract",
  upload.fields([{ name: "linkedin", maxCount: 1 }, { name: "resume", maxCount: 1 }]),
  async (req, res) => {
    const notes: string[] = [];
    const sources: SourceCard[] = [];
    const texts: ExtractSourceText[] = [];
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const linkedin = files?.linkedin?.[0];
    const resume = files?.resume?.[0];
    const websiteUrl = (req.body.website as string | undefined)?.trim() ?? "";
    const manualBio = (req.body.manualBio as string | undefined)?.trim() ?? "";

    if (linkedin) {
      try {
        const text = await pdfToText(linkedin.buffer);
        if (text.length < 20) throw new Error("empty");
        texts.push({ label: "LinkedIn profile PDF", text: text.slice(0, MAX_TEXT) });
        sources.push({ id: "src-linkedin", kind: "linkedin", label: "LinkedIn PDF", value: linkedin.originalname, status: "complete", detail: `Read ${text.length.toLocaleString()} characters` });
      } catch {
        sources.push({ id: "src-linkedin", kind: "linkedin", label: "LinkedIn PDF", value: linkedin.originalname, status: "failed", detail: "No selectable text (scanned PDF?)" });
        notes.push("LinkedIn PDF had no readable text.");
      }
    }
    if (resume) {
      try {
        const text = await pdfToText(resume.buffer);
        if (text.length < 20) throw new Error("empty");
        texts.push({ label: "Resume / CV PDF", text: text.slice(0, MAX_TEXT) });
        sources.push({ id: "src-resume", kind: "resume", label: "Resume / CV", value: resume.originalname, status: "complete", detail: `Read ${text.length.toLocaleString()} characters` });
      } catch {
        sources.push({ id: "src-resume", kind: "resume", label: "Resume / CV", value: resume.originalname, status: "failed", detail: "No selectable text (scanned PDF?)" });
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
      return res.json(result);
    }

    try {
      const { client, model } = getLlm();
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 2600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildExtractSystemPrompt() },
          { role: "user", content: buildExtractUserPrompt(texts) },
        ],
      });
      const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
      const facts = normalizeFacts(raw);
      if (!facts.name && !facts.workHistory.length && !facts.skills.length) notes.push("Model returned little usable data — review and edit.");
      const result: ExtractResult = { facts, sources, source: "groq", model, notes };
      return res.json(result);
    } catch (err) {
      console.error("[extract] LLM call failed:", err);
      notes.push("Extraction model call failed — showing the demo profile to edit.");
      const result: ExtractResult = { facts: MOCK_EXTRACTED_FACTS, sources, source: "mock", model: activeModel(), notes };
      return res.json(result);
    }
  }
);

app.post("/api/generate-profile", async (req, res) => {
  const input = req.body as GenerateInput;
  if (!input?.facts || !input?.answers) return res.status(400).json({ error: "Expected { facts, answers }" });

  const prompt = buildGroqPromptDisplay(input);
  const mockProfile = generateProfileWithGroqMock(input);

  if (!hasLlmKey()) {
    const result: GenerateResult = { profile: { ...mockProfile, generatedBy: "mock", model: "mock (no LLM key)" }, prompt, source: "mock", model: activeModel() };
    return res.json(result);
  }

  try {
    const { client, model } = getLlm();
    const completion = await client.chat.completions.create({
      model,
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
    profile.model = model;

    // AI-invented layout: a second call where the model designs the page itself.
    if (input.answers.theme === "ai") {
      try {
        const layoutCompletion = await client.chat.completions.create({
          model,
          temperature: 0.85,
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildLayoutSystemPrompt() },
            { role: "user", content: buildLayoutUserPrompt(profile) },
          ],
        });
        const layoutRaw = JSON.parse(layoutCompletion.choices[0]?.message?.content ?? "{}") as unknown;
        const spec = validateLayoutSpec(layoutRaw);
        if (spec) profile.layoutSpec = spec;
      } catch (e) {
        console.error("[layout] design call failed (renderer will use a default):", e);
      }
    }

    const result: GenerateResult = { profile, prompt, source: "groq", model };
    return res.json(result);
  } catch (err) {
    console.error("[generate-profile] LLM call failed:", err);
    const result: GenerateResult = { profile: { ...mockProfile, generatedBy: "mock", model: "mock (LLM fallback)" }, prompt, source: "mock", model: activeModel() };
    return res.json(result);
  }
});

// --- AI content edit: rephrase the page per an instruction ---

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

app.post("/api/edit-profile", async (req, res) => {
  const { profile, instruction } = (req.body ?? {}) as { profile?: GeneratedProfile; instruction?: string };
  if (!profile || !instruction?.trim()) return res.status(400).json({ error: "Expected { profile, instruction }" });
  if (!hasLlmKey()) return res.json({ profile, source: "mock", model: activeModel() });

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
    return res.json({ profile: applyEditPatch(profile, patch), source: "groq", model });
  } catch (err) {
    console.error("[edit-profile] failed:", err);
    return res.json({ profile, source: "mock", model: activeModel() });
  }
});

app.listen(PORT, () => console.log(`PersonaOn backend listening on :${PORT} (provider ${activeProvider()}, model ${activeModel()}, key ${hasLlmKey() ? "set" : "missing"})`));
