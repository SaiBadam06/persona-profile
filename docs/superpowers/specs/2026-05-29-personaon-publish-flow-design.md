# PersonaOn Publish Flow — Design

Date: 2026-05-29
Status: Approved (pending spec review)

## Goal

Add an AI-driven **publish flow** to the existing PersonaOn prototype: a busy
professional (founder, CEO, recruiter) uploads their **resume** and/or
**LinkedIn profile PDF**, answers a tiny gap-filling Q&A, and the AI generates a
complete, customized public persona page. The user optionally refines it (AI
prompt edits + manual edits), and on an explicit **Publish** click it becomes a
publicly shareable link (`/p/<slug>`). Every published page includes the existing
"Chat with \<name\>" widget that answers as the link owner.

**North-star constraint: minimal effort.** Target users are time-poor. The
default path is *upload resume/LinkedIn PDF → answer 2-3 quick questions → AI
builds everything → one click to publish*. The AI owns customization (layout,
focus, theme, section ordering). All manual refinement is optional and never
blocks publishing.

### Input reality (important)

- **Resume** and **LinkedIn** are the primary inputs, taken as **uploaded
  documents** (PDF or pasted text). Server-side text extraction feeds the AI.
- LinkedIn is supplied as the user's own **"Save to PDF" profile export**
  (LinkedIn → More → Save to PDF), *not* a profile URL: LinkedIn has no public
  API and scraping a live profile requires login and violates its ToS, so we do
  not fetch `linkedin.com/in/...` URLs.
- **GitHub** is an optional secondary enrichment (public API), not required.

## Scope

In scope:
- **Document ingestion** of resume + LinkedIn-export PDFs (and/or pasted text):
  server-side text extraction → AI synthesizes about/skills/projects/experience.
- A short **gap-filling Q&A** (2-3 questions: audience, role framing, one
  highlight) with AI-suggested defaults.
- One-shot AI generation of a complete draft persona from documents + Q&A.
- Optional **GitHub** enrichment via the public GitHub REST API (top repos →
  projects/skills), no login required.
- Draft → review/edit → publish lifecycle with a publish gate.
- Two render/navigation modes (AI-chosen, user-overridable): single-page
  (anchor-scroll nav) and multi-page (tab-switched section views, one URL).
- AI prompt edits and inline manual field edits in the review screen.
- Ownership gate: drafts are owner-only; published pages are public.

Out of scope (prototype):
- Real authentication/accounts (keep the existing `X-User-Id` localStorage UUID).
- **Fetching/scraping live LinkedIn profile URLs.** No public API; requires login;
  violates ToS. LinkedIn data comes only from the user's own uploaded PDF export.
- OCR of scanned/image-only PDFs (we extract embedded text; image-only PDFs fall
  back to Q&A/paste — see Error handling).
- GitHub authentication beyond an optional server-side token for rate limits.
- Custom domains, analytics, SEO tuning.

## Non-goals / YAGNI

- No multi-turn mandatory interview. The conversational "guided" wizard remains
  available as an optional mode but is not the default.
- No separate real routes per section (`/p/<slug>/projects`). Multi-page mode is
  implemented as in-page tab switching so the shareable link stays a single URL.

## Users & effort budget

| User | Wants | Effort target |
|------|-------|---------------|
| Founder/CEO | Credible, visionary page fast | < 60s to first draft, 1 click to publish |
| Recruiter-facing IC | Skills/projects/experience spotlight | Same |

## Architecture (extends current app)

Reuse: persona JSON schema, `PersonaPage` renderer + section components, the
"Chat with persona" widget, Groq client, SQLAlchemy `Persona` model, the
white/black monochrome theme (Gabarito headings, pastel particles).

### Data model changes (`Persona`)

- `published: bool = false`
- `published_at: datetime | null`
- `meta.nav_mode: "single" | "multi"` (AI-chosen, user-overridable)
- `meta.primary_focus: "skills" | "projects" | "experience" | "balanced"`
- `meta.highlight: string[]` (ordered section types to spotlight)

Existing fields (`hero`, `sections`, `theme`, etc.) unchanged.

### Ingestion: documents (resume + LinkedIn) [+ optional GitHub]

New backend module `ai/ingest_docs.py`:
- Input: one or more uploaded files (resume PDF, LinkedIn-export PDF) and/or
  pasted text.
- PDF text extraction via **`pypdf`** (add to `requirements.txt`). `.txt` and
  pasted text pass through directly.
- Normalizes/concatenates extracted text into a single labeled context blob
  (e.g. `--- RESUME ---\n…\n--- LINKEDIN ---\n…`), truncated to a safe token
  budget before being sent to Groq.
- Returns `{ text, sources: [...] }`, or empty text if nothing extractable
  (→ Error-handling fallback).

Optional `ai/ingest_github.py` (secondary, unchanged behavior):
- Input: a GitHub username/URL. Public GitHub REST API → top non-fork repos
  (projects) + languages/topics (skills) + bio (about). Unauthenticated (60/hr);
  honors `GITHUB_TOKEN` if set. Returns `null` on failure (non-fatal).

### Backend endpoints (Flask + Groq)

- `POST /api/personas/generate` (SSE, **`multipart/form-data`**) — **fast path.**
  Fields: `resume` (file, optional), `linkedin` (file, optional),
  `extra_text` (string, optional paste), `github` (string, optional),
  `qa` (JSON string: audience, role framing, highlight). Server extracts document
  text (+ optional GitHub), then streams generation and returns a complete
  **draft** persona (`published=false`) with AI-inferred `nav_mode`,
  `primary_focus`, sections, theme. Owner = `X-User-Id`. Document-derived
  experience/skills/projects seed the relevant sections; the AI writes copy and
  chooses layout. (Flask reads `request.files`, then returns a streaming SSE
  response.)
- `POST /api/builder/turn` (SSE) — existing guided wizard, retained as optional
  mode; on `final` it now saves a **draft** (not auto-published) and routes to
  review instead of to the public link.
- `POST /api/personas/<slug>/edit` (SSE) — AI prompt edit. Body: `{ instruction }`.
  Sends current persona JSON + instruction to Groq, returns updated persona JSON,
  validated against the schema; rejects/repairs invalid output.
- `PATCH /api/personas/<slug>` — manual field edits (partial JSON patch of
  hero/sections/meta/theme). Owner-only.
- `POST /api/personas/<slug>/publish` — sets `published=true`, `published_at`;
  returns the canonical shareable URL.
- `GET /api/personas/<slug>` — if `published`, public. If not, returns the draft
  **only** when `X-User-Id` matches `owner_user_id`; otherwise `404`.
- `POST /api/personas/<slug>/chat` (SSE) — existing persona chat, available on
  published pages.

All write/edit/publish endpoints require `X-User-Id == owner_user_id` (403 otherwise).

### Frontend

- **Entry CTA** ("Create your persona" / "Publish") → `/build`.
- **`/build` (fast intake, default):** one screen —
  1. **Upload your resume** (PDF/.txt) and/or **LinkedIn profile PDF**
     (drag-drop or file picker). Inline hint: "LinkedIn → More → Save to PDF".
  2. Optional: paste extra text, or add a GitHub username for enrichment.
  3. A short Q&A (2-3 questions: who's the audience, how to frame your role, one
     thing to highlight) shown as chips with AI-friendly defaults, all skippable.
  4. An always-enabled **Generate** button → `/api/personas/generate`
     (`multipart/form-data`).
  Live progress while streaming (e.g. "Reading your resume… Writing your page…").
- **Review screen** (`/p/<slug>/edit`, owner-only — the draft already has a slug):
  split view —
  - Left: live `PersonaPage` preview in the persona's `nav_mode`, with
    **inline click-to-edit** text fields (hero headline/subheadline, about body,
    project/experience titles & summaries, skills) → `PATCH`.
  - Right: an **AI prompt box** ("make the hero punchier", "put projects first",
    "switch to multi-page") → `/edit` SSE, re-previews; plus quick toggles for
    `nav_mode` and `primary_focus`; plus a prominent **Publish** button.
- **Publish result:** shows `/p/<slug>` with a copy button + "View live".
- **Public page** (`/p/<slug>`): published `PersonaPage` + "Chat with \<name\>".

### Renderer: `nav_mode`

- `single` — sticky top nav listing section labels; clicking anchor-scrolls to the
  section `id`. All sections rendered on one page.
- `multi` — sticky top nav whose items switch the active section view (tab state,
  synced to `?tab=<section>` for deep-linking). One shareable URL.
- Default chosen by AI from role/content; overridable in review.

## Data flow

1. CTA → `/build`.
2. User uploads resume/LinkedIn PDF (+ optional GitHub / quick Q&A), hits **Generate**.
3. `POST /generate` → server extracts document text (+ optional GitHub) → Groq
   synthesizes → draft persona saved (`published=false`) → redirect to review
   (`/p/<slug>/edit`).
4. Review: optional AI prompt edits (`/edit`) and inline manual edits (`PATCH`);
   preview updates live. Publishing is available at any time.
5. **Publish** (`/publish`) → `published=true` → shareable link shown.
6. Visitor opens link → published page + chat-as-owner.

## Error handling

- Groq failures during generate/edit: stream an `error` event; UI surfaces it and
  keeps the last good draft (never loses work).
- AI edit returns invalid JSON: backend attempts one repair pass; if still invalid,
  returns `error` and leaves the persona unchanged.
- Publishing an already-published persona is idempotent.
- Visiting an unpublished slug as a non-owner: `404` (page "not found / not public").
- Empty intake: Generate is allowed but AI is prompted to produce a tasteful
  placeholder draft the user can edit.
- **PDF with no extractable text** (scanned/image-only) or extraction error:
  stream a non-fatal `notice` ("couldn't read that file — add text or answer a few
  questions") and continue from any other context + Q&A. Never hard-fail.
- **File validation:** reject non-PDF/.txt or oversized uploads (e.g. > 8 MB) with
  a clear `error`; the user can re-pick.
- **GitHub fetch failures** (optional path): invalid username (`404`), rate limit
  (`403`/`429`), or network error → non-fatal `notice`, continue without it.

## New dependencies

- Backend: `pypdf` (PDF text extraction) added to `backend/requirements.txt`.
  `requests` (or `httpx`) for the optional GitHub call if not already present.
- Frontend: none new (native file input / drag-drop; existing fetch + SSE).

## Testing

Backend (pytest):
- Document ingestion: extracts text from a sample PDF and a `.txt`; returns empty
  text for an image-only/invalid PDF without raising; rejects oversized/wrong-type
  files.
- Optional GitHub ingestion (mocked, no live network): maps responses to
  projects/skills; `404`/rate-limit → `null` without raising.
- `generate` returns a schema-valid draft with `published=false` and AI-set
  `nav_mode`/`primary_focus`; works with document text and in the no-document
  (Q&A-only) fallback.
- `edit` applies an instruction and returns schema-valid JSON; invalid model
  output leaves the persona unchanged.
- `PATCH` updates only provided fields; rejects non-owner.
- `publish` flips `published`/`published_at`; idempotent.
- `GET` of an unpublished slug: owner gets it, non-owner gets `404`; published
  slug is public.

Frontend: manual verification of intake → generate → review (AI + manual edit) →
publish → public link + chat, in both `nav_mode`s.

## Reused components (no rewrite)

`PersonaPage`, `Hero`, `AboutSection`, `ProjectsSection`, `SkillsSection`,
`ExperienceSection`, `TestimonialsSection`, `LinksSection`, `PersonaChat`,
`ParticleBg`, `Brand`, the Groq client, and the persona schema.
