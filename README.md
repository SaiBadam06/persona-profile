# PersonaOn

AI-powered public profile + chat-page builder. Upload your LinkedIn profile PDF,
resume, and website → real extraction (Groq) → customize → generate → publish a
shareable profile with a public AI chat, in one of several designs (incl. an
AI-invented bento layout).

## Deploy everything on Vercel (recommended — one project)

The AI runs as **Next.js API routes inside `frontend/`**, so a single Vercel
project serves the whole app. No separate backend needed.

1. Push to GitHub (done).
2. Vercel → **Add New → Project** → import this repo.
3. **Root Directory: `frontend`** (important — the repo has `frontend/` and `backend/`).
4. Framework preset: **Next.js** (auto). Build/Output: defaults.
5. **Environment Variables** (Project Settings → Environment Variables):
   - `GROQ_API_KEY` = your Groq key  *(required)*
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`  *(optional)*
   - `LLM_PROVIDER` = `groq`  *(optional; or `nvidia` with `NVIDIA_API_KEY` + `NVIDIA_MODEL`)*
   - `NEXT_PUBLIC_API_BASE` = *(leave empty — client calls same-origin)*
6. **Deploy.** Your app + APIs are live at `https://<project>.vercel.app`.

API routes (same-origin): `POST /api/extract`, `POST /api/generate-profile`, `POST /api/edit-profile`.

## Run locally

```bash
cd frontend
cp .env.local .env.local   # ensure GROQ_API_KEY is set; NEXT_PUBLIC_API_BASE empty
npm install && npm run dev  # http://localhost:3000
```

## Optional: split backend on Render

`backend/` is a standalone Express + TS version of the same API (for a
Vercel-frontend + Render-backend split). Not needed for the single-Vercel deploy
above. To use it: deploy `backend/` on Render (build `npm install`, start
`npm start`, env `GROQ_API_KEY` + `ALLOWED_ORIGINS`), and set the frontend's
`NEXT_PUBLIC_API_BASE` to the Render URL.

> Security: the Groq/NVIDIA keys live only in gitignored `.env*` files — never
> committed. Rotate any key shared in plaintext.
