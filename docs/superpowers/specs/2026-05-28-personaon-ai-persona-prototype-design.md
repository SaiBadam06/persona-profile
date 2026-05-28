# PersonaOn AI Persona Prototype — Design

**Date:** 2026-05-28
**Status:** Approved (M1 scope)
**Owner:** Sainath Setti

## 1. Goal

Build a locally-running prototype that demonstrates the PersonaOn "AI-generated public persona" experience end-to-end. A user opens the app, gets walked through a conversational AI builder powered by Groq, watches a persona page assemble in real time in a live preview, and ends at a fully rendered AI-generated profile page.

This is a **showcase prototype**, not a production system. No accounts, no real publishing, no security hardening. Visual fidelity targets `personaon.com` and `personaonlanding.vercel.app` (dark theme, glassmorphism, gradients, particles, smooth motion).

## 2. Non-Goals (Deferred to later milestones)

- Real authentication, password hashing, sessions, JWT
- Public/shareable publishing (links work locally only)
- Visitor analytics
- Post-generation conversational refinement ("make it more futuristic")
- Multi-page persona layouts (single-page only in M1)
- Voice input
- File upload / resume parsing / RAG over user docs
- LinkedIn / GitHub / external integrations
- 3D effects
- Persona dashboard / management UI / republish flow
- Multi-tenant production deployment

## 3. Architecture

Two-tier as originally specced:

```
┌─────────────────────────┐    HTTP/SSE    ┌────────────────────────┐
│  Next.js 15 App Router  │ ◄────────────► │  Flask API (Python)    │
│  TypeScript + Tailwind  │                │  Groq SDK + orchestrator│
│  Framer Motion, ShadCN  │                │  SQLite (prototype DB)  │
│  tsparticles bg         │                │  SQLAlchemy ORM         │
└─────────────────────────┘                └────────────────────────┘
        :3000                                        :5000
```

- **Frontend** owns rendering, motion, particle FX, and chat UI. All AI calls proxy through Flask.
- **Flask** owns Groq API calls, prompt orchestration, FSM state for the builder, and DB persistence.
- **SQLite via SQLAlchemy** for prototype simplicity — same models will work against Postgres later by changing the connection string.
- **No auth.** A `current_user_id` (UUID generated client-side on first visit) is stored in `localStorage` and sent as `X-User-Id` header on API calls. This is a session stand-in only.

## 4. Surfaces

| Route | Purpose |
|---|---|
| `/` | Branded landing page → "Create your persona" CTA |
| `/build` | Full-screen split-screen AI builder: chat panel left, live persona preview right |
| `/p/[slug]` | The generated persona page (rendered from persona JSON) |

No dashboard, no analytics, no settings pages in M1.

## 5. The AI Builder Loop

A finite-state-machine wizard, not freeform chat. Approximately **8 curated questions** drawn from the original spec, in fixed order:

1. **Purpose** — portfolio / resume / personal brand / founder / researcher / student / creator
2. **Highlight** — what should visitors notice first (skills, projects, experience, achievements, AI chat...)
3. **Style** — minimal / corporate / futuristic / creative / developer / terminal / AI-native / magazine / glassmorphism / bento
4. **Palette** — dark / light / neon / professional / gradient-heavy / monochrome
5. **AI chat role** — hero section / floating assistant / sidebar / embedded / none
6. **Visitor actions** — chat / book call / download resume / view projects / hire / contact (multi-select)
7. **Content priority** — drag-rank: about, experience, projects, skills, testimonials, blogs
8. **Identity content** — name, headline, short bio paste, optional links (LinkedIn, GitHub, X, website)

### Turn protocol

Each turn:

1. Frontend POSTs `{ user_id, builder_session_id, current_state, last_answer }` to `POST /api/builder/turn`.
2. Flask resolves the FSM state, builds the appropriate Groq prompt, streams a response back as SSE.
3. The streamed response is structured JSON with this shape:
   ```json
   {
     "next_state": "ask_palette" | "done",
     "next_question": { "header": "Palette", "body": "...", "options": [...] } | null,
     "persona_delta": { /* JSON-Patch-style updates to apply to persona doc */ },
     "ai_message": "Streaming conversational text shown in the chat panel"
   }
   ```
4. Frontend applies `persona_delta` to its Zustand store. The chat panel renders `ai_message` with a streaming/typing animation. The live preview re-renders from the updated persona JSON.
5. When `next_state === "done"`, Flask makes one final Groq call to polish generated content (bio paragraphs, project descriptions, hero tagline) and persists the finalized persona to SQLite.

### Why FSM, not freeform

Freeform chat with an LLM-built wizard is unreliable for a demo: malformed responses, off-topic drift, inconsistent state. An FSM with structured prompts per state is much more predictable and demo-worthy. The "feels like a conversation" UX is preserved through the streamed `ai_message` field.

## 6. Persona JSON Schema (the contract)

Both the wizard output and the renderer input share one schema:

```ts
type Persona = {
  id: string;                  // UUID
  slug: string;                // e.g., "sai-deekshith-badam"
  owner_user_id: string;
  owner_display_name: string;

  meta: {
    purpose: string;           // from Q1
    style: string;             // from Q3
    palette: string;           // from Q4
    layout_kind: string;       // derived: "bento" | "single-column" | "magazine" | ...
  };

  hero: {
    headline: string;          // AI-generated
    subheadline: string;       // AI-generated
    cta_label: string;
    ai_chat_position: "hero" | "floating" | "sidebar" | "embedded" | "none";
  };

  sections: Array<
    | { type: "about"; priority: number; content: { body: string } }
    | { type: "experience"; priority: number; content: { items: ExperienceItem[] } }
    | { type: "projects"; priority: number; content: { items: ProjectItem[] } }
    | { type: "skills"; priority: number; content: { groups: SkillGroup[] } }
    | { type: "testimonials"; priority: number; content: { items: Testimonial[] } }
    | { type: "links"; priority: number; content: { items: LinkItem[] } }
  >;

  theme: {
    primary_color: string;     // e.g., "#8b5cf6"
    accent_color: string;
    mode: "dark" | "light";
    particle_density: "off" | "subtle" | "dense";
  };

  generated_at: string;        // ISO timestamp
  version: number;             // bumps on regenerate
};
```

`sections[]` is sorted by `priority` ascending in the renderer. Each section type maps to a dedicated React component.

## 7. Flask API

```
POST   /api/builder/turn              SSE — drives the wizard
GET    /api/personas/<slug>           Read persona JSON for renderer
POST   /api/personas                  Create/persist final persona
POST   /api/personas/<slug>/chat      SSE — visitor chatting with persona AI
GET    /healthz                       Liveness probe
```

All routes accept `X-User-Id` header. No auth enforcement in M1; the header is just used to scope persona ownership in the DB.

## 8. Persistence (SQLite via SQLAlchemy)

Two tables only:

```sql
users (
  id TEXT PRIMARY KEY,                -- UUID
  created_at TIMESTAMP
);

personas (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  data JSON NOT NULL,                 -- the full Persona JSON above
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  version INTEGER DEFAULT 1
);
```

Builder session state lives in Flask process memory keyed by `builder_session_id` (an in-memory dict). For a single-user prototype this is fine; multi-user concurrent use is out of scope.

## 9. AI Orchestration

```
backend/ai/
├─ groq_client.py        # thin wrapper around the official groq SDK
├─ prompts/
│  ├─ builder_system.txt # base system prompt for the wizard
│  ├─ builder_states/    # one prompt per FSM state
│  ├─ polish.txt         # final content polish pass
│  └─ persona_chat.txt   # for the visitor-facing persona chat
└─ orchestrator.py       # FSM, prompt rendering, JSON validation, retry
```

- **Model:** `llama-3.3-70b-versatile` for the builder and polish; `llama-3.1-8b-instant` for the persona chat (latency).
- **JSON mode:** use Groq's `response_format={"type": "json_object"}` for any structured response.
- **Validation:** every structured response is validated against a Pydantic model. On parse failure, retry once with the validation error appended to the user message. After two failures, surface a graceful error in the chat UI.
- **Streaming:** use SSE for both builder turns (`ai_message` field streams) and persona chat (raw token stream).

## 10. Frontend Details

### State management

Zustand store, single source of truth:

```ts
{
  persona: Persona | null;       // mirrored to backend on save
  builderSessionId: string | null;
  fsmState: BuilderState;
  chatHistory: ChatMessage[];
  isStreaming: boolean;
}
```

### Live preview panel

The right side of `/build` mounts the same persona renderer used at `/p/[slug]`, but reads from the Zustand store instead of the API. Re-renders on every `persona_delta` apply. Framer Motion `AnimatePresence` provides crossfade between layout changes.

### Particle background

Use `@tsparticles/react` configured for a subtle floating dot field at low density on the landing page and `/build`. Honor `theme.particle_density` on the rendered persona page (`/p/[slug]`).

### Design references

Primary visual targets: [personaon.com](https://personaon.com) and [personaonlanding.vercel.app](https://personaonlanding.vercel.app).

Additional libraries consulted **for inspiration only** (component patterns, motion, layout ideas) — NOT installed:

- [shadcn/ui](https://ui.shadcn.com/) — actually installed; sole component library
- [Mantine](https://ui.mantine.dev/) — patterns to borrow: Spotlight (command palette), step wizard, notifications, card surfaces
- [Gluestack](https://gluestack.io/) — patterns to borrow: composition primitives, tokens
- [Ant Design](https://ant.design/) — patterns to borrow: Steps for the builder wizard progress, Transfer for drag-rank priority

The implementation uses shadcn/ui exclusively to avoid style conflicts and bundle bloat. Inspiration translates to custom-built components in `components/ui/` and `components/fx/`.

### Brand match

- **Background:** dark base `#0a0a0f` with radial gradient overlay (purple → blue) at low opacity, particles layered above.
- **Surfaces:** glass cards — `backdrop-blur-xl`, `bg-white/[0.03]`, `border border-white/10`, soft drop shadow with color glow.
- **Typography:** Geist Sans for body, Geist Sans display weight for hero. Tight letter-spacing on display headings.
- **CTAs:** gradient borders (`bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500` masked to 1px), animated shimmer on hover.
- **Motion:** Framer Motion for: section enter/exit (stagger), AI chat message stream (per-token), live-preview crossfade on delta apply, particle drift.

### Loading / streaming states

- Streaming token cursor (blinking) on the AI message being typed.
- Skeleton shimmer on the live preview panel while a delta is being computed.
- "AI is thinking..." indicator with pulsing dot animation when a turn is in flight before the first token arrives.

## 11. Folder Layout

```
PersonaOn Profiles/
├─ frontend/                         (Next.js 15)
│  ├─ app/
│  │  ├─ layout.tsx                  (ParticleBg, fonts, providers)
│  │  ├─ page.tsx                    (landing)
│  │  ├─ build/page.tsx              (split-screen builder)
│  │  └─ p/[slug]/page.tsx           (persona renderer; server-fetches JSON)
│  ├─ components/
│  │  ├─ builder/
│  │  │  ├─ ChatPanel.tsx
│  │  │  ├─ PreviewPanel.tsx
│  │  │  ├─ QuestionCard.tsx
│  │  │  └─ StreamingMessage.tsx
│  │  ├─ persona/
│  │  │  ├─ PersonaPage.tsx           (the shared renderer)
│  │  │  ├─ Hero.tsx
│  │  │  ├─ AboutSection.tsx
│  │  │  ├─ ProjectsSection.tsx
│  │  │  ├─ SkillsSection.tsx
│  │  │  ├─ ExperienceSection.tsx
│  │  │  ├─ TestimonialsSection.tsx
│  │  │  ├─ LinksSection.tsx
│  │  │  └─ PersonaChat.tsx           (floating/hero/sidebar variants)
│  │  ├─ fx/
│  │  │  ├─ ParticleBg.tsx
│  │  │  ├─ GlassCard.tsx
│  │  │  ├─ GradientText.tsx
│  │  │  └─ ShimmerSkeleton.tsx
│  │  └─ ui/                          (shadcn primitives: button, dialog, etc.)
│  ├─ lib/
│  │  ├─ api.ts                       (Flask client; SSE helper)
│  │  ├─ store.ts                     (Zustand)
│  │  ├─ types.ts                     (Persona schema)
│  │  └─ utils.ts                     (cn, slugify, etc.)
│  ├─ public/                         (fonts, icons)
│  ├─ tailwind.config.ts
│  ├─ next.config.mjs
│  ├─ package.json
│  └─ .env.local.example              (NEXT_PUBLIC_API_URL)
├─ backend/                          (Flask)
│  ├─ app.py                          (factory, CORS, blueprints)
│  ├─ config.py
│  ├─ routes/
│  │  ├─ builder.py
│  │  ├─ persona.py
│  │  └─ chat.py
│  ├─ ai/
│  │  ├─ __init__.py
│  │  ├─ groq_client.py
│  │  ├─ orchestrator.py
│  │  ├─ schemas.py                   (Pydantic models)
│  │  └─ prompts/
│  │     ├─ builder_system.txt
│  │     ├─ builder_states/
│  │     │  ├─ ask_purpose.txt
│  │     │  ├─ ask_highlight.txt
│  │     │  ├─ ask_style.txt
│  │     │  ├─ ask_palette.txt
│  │     │  ├─ ask_ai_chat.txt
│  │     │  ├─ ask_visitor_actions.txt
│  │     │  ├─ ask_priority.txt
│  │     │  └─ ask_identity.txt
│  │     ├─ polish.txt
│  │     └─ persona_chat.txt
│  ├─ db/
│  │  ├─ __init__.py
│  │  ├─ models.py                    (SQLAlchemy: User, Persona)
│  │  └─ migrations/                  (alembic — minimal)
│  ├─ requirements.txt
│  └─ .env.example                    (GROQ_API_KEY, DATABASE_URL, FLASK_ENV)
└─ docs/superpowers/specs/...
```

## 12. Environment Variables

Backend (`backend/.env`):

```
GROQ_API_KEY=<placeholder>
DATABASE_URL=sqlite:///personaon.db
FLASK_ENV=development
CORS_ORIGINS=http://localhost:3000
```

Frontend (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 13. Local Run

Two processes:

```
# terminal 1
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
flask --app app run --port 5000

# terminal 2
cd frontend
npm install
npm run dev
```

A `README.md` at the repo root will document this and seed a single example persona (`sai-deekshith-badam-2`) on first DB init so `/p/sai-deekshith-badam-2` works out of the box for visual review.

## 14. Risks & Honest Caveats

1. **AI output reliability.** Groq returning malformed JSON will break the wizard. Mitigated by JSON-mode + Pydantic validation + one retry-with-error-context. Expect prompt babysitting during first demo.
2. **"No two pages identical" is aspirational.** The engine produces ~6–8 layout permutations from wizard answers, not infinite variation. We will be honest about this in docs.
3. **Brand match is iterative.** First pass will land ~80% of the personaon.com aesthetic. Closing the gap requires a feedback loop with screenshots.
4. **Persona chat at `/p/[slug]`** is shallow — it only knows what's in the persona JSON. No RAG over uploaded docs; that's a later milestone.
5. **In-memory FSM state** in Flask will not survive a server restart mid-build. For a single-developer prototype this is acceptable; production needs Redis or DB-backed sessions.
6. **No tests in M1.** Manual verification only. A test suite is a later concern; adding it now would more than double the work for a demo-grade prototype.

## 15. Success Criteria for M1

- `npm run dev` + `flask run` produces a working prototype on localhost.
- Landing page at `/` renders with full brand styling, particles, gradients, motion.
- `/build` runs the 8-question wizard end-to-end with real Groq calls and a live-updating preview panel.
- On wizard completion, the user is navigated to `/p/[slug]` showing their AI-generated persona page.
- The persona page renders all configured sections in priority order with the chosen palette/layout.
- The persona AI chat widget is functional at `/p/[slug]` (visitor can ask questions and get streaming responses informed by persona JSON).
- The seeded example persona `sai-deekshith-badam-2` renders on first run with no wizard interaction.
