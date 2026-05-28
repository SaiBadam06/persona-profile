# PersonaOn AI Persona Prototype

A locally-running prototype that uses Groq to generate AI-powered persona profile pages. Next.js 15 frontend + Flask backend.

See the design doc: [docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md](docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md)

## Requirements

- Node.js 20+
- Python 3.11+ (3.13 works fine; the project pins `groq==0.13.0`)
- A [Groq API key](https://console.groq.com/keys) — free tier is enough

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit backend\.env and replace GROQ_API_KEY with your real key.
```

If `Activate.ps1` is blocked: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (once).

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
```

## Run (two terminals)

Terminal 1 — backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
flask --app app run --port 5000
```

Terminal 2 — frontend:

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000.

## What to try

- **Landing page** (`/`) — brand showcase with particles, gradient hero, glass cards.
- **Build flow** (`/build`) — conversational AI builder. ~8 questions; ends at a generated persona page.
- **Seeded example** (`/p/sai-deekshith-badam-2`) — example persona rendered from seed data, with a working AI chat in the hero. No build flow required.

## Architecture

- `frontend/` — Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui, Framer Motion, tsparticles, Zustand.
- `backend/` — Flask + SQLAlchemy + SQLite + Groq SDK.
- One shared Persona JSON schema is the contract between the builder output and the renderer input.

## Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

No frontend test suite (this is a prototype — verified manually).

## Project layout

```
PersonaOn Profiles/
├─ frontend/           Next.js 15 app
│  ├─ app/             routes: /, /build, /p/[slug]
│  ├─ components/
│  │  ├─ builder/      chat + preview panels
│  │  ├─ persona/      hero, sections, persona chat
│  │  ├─ fx/           particles, glass, gradient, shimmer
│  │  └─ ui/           shadcn primitives
│  └─ lib/             api client, zustand store, types, utils
├─ backend/            Flask app
│  ├─ ai/              groq client, FSM orchestrator, prompt files
│  ├─ db/              sqlalchemy models + seed
│  ├─ routes/          /api/personas, /api/builder/turn, /api/personas/<slug>/chat
│  └─ tests/           pytest
└─ docs/superpowers/   design spec + implementation plan
```

## API endpoints

- `GET  /healthz` — liveness
- `GET  /api/personas/<slug>` — fetch persona JSON
- `POST /api/personas` — persist a final persona (returns saved persona with collision-safe slug)
- `POST /api/builder/turn` — SSE — drives the wizard
- `POST /api/personas/<slug>/chat` — SSE — visitor chat with persona AI

## Troubleshooting

- **`GROQ_API_KEY is not set`** — edit `backend/.env` and add a real key from console.groq.com.
- **CORS error in browser** — confirm `CORS_ORIGINS=http://localhost:3000` in `backend/.env`.
- **`Activate.ps1` blocked** — see Setup → Backend.
- **Build flow hangs on first question** — backend is not running, or `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to the wrong port.
- **Persona chat says "(error: ...)"** — Groq key missing or invalid. The chat widget surfaces backend errors verbatim.

## Known caveats (prototype scope)

- No auth — `X-User-Id` is a localStorage UUID, not a real session.
- No "publish" gate — generated personas are immediately readable at `/p/<slug>` to anyone hitting your local server.
- Builder FSM state lives in Flask process memory; restarting the server mid-wizard loses session state.
- Persona AI chat only knows what's in the persona JSON (no RAG, no document upload).
- ~6–8 layout permutations possible from wizard answers — not infinite variation.
