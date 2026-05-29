# PersonaOn Publish Flow — Design

Date: 2026-05-29
Status: Approved (pending spec review)

## Goal

Add an AI-driven **publish flow** to the existing PersonaOn prototype: a busy
professional (founder, CEO, recruiter) provides minimal input, the AI generates
a complete, customized public persona page, the user optionally refines it
(AI prompt edits + manual edits), and on an explicit **Publish** click it becomes
a publicly shareable link (`/p/<slug>`). Every published page includes the
existing "Chat with \<name\>" widget that answers as the link owner.

**North-star constraint: minimal effort.** Target users are time-poor. The
default path is *paste once → AI generates everything → one click to publish*.
All deeper customization is optional and never blocks publishing.

## Scope

In scope:
- Fast intake → one-shot AI generation of a complete draft persona.
- Draft → review/edit → publish lifecycle with a publish gate.
- Two render/navigation modes selectable per persona: single-page (anchor-scroll
  nav) and multi-page (tab-switched section views under one shareable URL).
- AI prompt edits and inline manual field edits in the review screen.
- Ownership gate: drafts are owner-only; published pages are public.

Out of scope (prototype):
- Real authentication/accounts (keep the existing `X-User-Id` localStorage UUID).
- File upload / resume parsing from PDF (intake is pasted text + links only).
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

### Backend endpoints (Flask + Groq)

- `POST /api/personas/generate` (SSE) — **fast path.** Body: `{ name, role,
  intake (freeform paste/links), prefs? }`. Streams generation, returns a
  complete **draft** persona (`published=false`) with AI-inferred `nav_mode`,
  `primary_focus`, sections, theme. Owner = `X-User-Id`.
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
- **`/build` (fast intake, default):** one screen — Name, Role, a single freeform
  paste field, an optional row of pre-selected refinement chips (tone, highlight),
  and a always-enabled **Generate** button. Calls `/api/personas/generate`.
  Live progress while streaming.
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
2. User enters name/role + paste, hits **Generate**.
3. `POST /generate` streams → draft persona saved (`published=false`) → redirect
   to review (`/p/<slug>/edit`).
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

## Testing

Backend (pytest):
- `generate` returns a schema-valid draft with `published=false` and AI-set
  `nav_mode`/`primary_focus`.
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
