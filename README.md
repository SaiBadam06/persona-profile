# PersonaOn

AI-powered public profile + chat-page builder. Upload your LinkedIn profile PDF,
resume, and website → real extraction (Groq) → customize → generate → publish a
shareable profile with a public AI chat, in one of several team designs.

## Architecture (split for Vercel + Render)

```
frontend/   Next.js 15 app  → deploy on Vercel   (no AI deps; calls the backend)
backend/    Express + TS API → deploy on Render   (Groq, PDF parsing, web crawl)
```

The frontend calls the backend via `NEXT_PUBLIC_API_BASE`. The Groq key lives
ONLY in the backend.

## Run locally (two terminals)

```bash
# 1) backend  → http://localhost:8787
cd backend
cp .env.example .env          # set GROQ_API_KEY
npm install && npm run dev

# 2) frontend → http://localhost:3000
cd frontend
npm install && npm run dev    # .env.local already points NEXT_PUBLIC_API_BASE at :8787
```

## Deploy

- **Backend → Render:** New Web Service, root `backend`, build `npm install`,
  start `npm start`. Env: `GROQ_API_KEY`, `ALLOWED_ORIGINS=https://<your>.vercel.app`.
  (A `backend/render.yaml` blueprint is included.)
- **Frontend → Vercel:** import the repo, root `frontend`. Env:
  `NEXT_PUBLIC_API_BASE=https://<your-render-service>.onrender.com`.

## Endpoints (backend)
- `POST /api/extract` — multipart (`linkedin` PDF, `resume` PDF, `website`, `manualBio`) → structured facts
- `POST /api/generate-profile` — `{ facts, answers }` → generated profile JSON
- `GET /health`

> Security: rotate the Groq key that was shared in chat. It lives only in `backend/.env` (gitignored).
