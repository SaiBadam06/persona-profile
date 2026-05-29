# PersonaOn Backend (AI service)

Node + Express + TypeScript service that owns all AI work so the Next.js
frontend (Vercel) stays light. Deploy this on **Render**.

## What it does
- `POST /api/extract` — multipart form (`linkedin` PDF, `resume` PDF, `website`, `manualBio`) → parses PDFs (`unpdf`), crawls the website, and asks **Groq** to extract structured facts.
- `POST /api/generate-profile` — JSON `{ facts, answers }` → Groq writes the profile copy (mock fallback on any error).
- `GET /health` — liveness + whether the Groq key is set.

## Run locally
```bash
cd backend
cp .env.example .env      # add your GROQ_API_KEY
npm install
npm run dev               # http://localhost:8787
```

## Deploy on Render
1. Push this repo to GitHub.
2. Render → New → Blueprint, pick the repo (uses `backend/render.yaml`), **or** New → Web Service with root `backend`, build `npm install`, start `npm start`.
3. Set env vars: `GROQ_API_KEY` (required) and `ALLOWED_ORIGINS` (your Vercel URL, e.g. `https://yourapp.vercel.app`).
4. Copy the service URL and set it as `NEXT_PUBLIC_API_BASE` in the Vercel frontend.

Render injects `PORT` automatically.
