# PersonaOn AI Persona Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-running Next.js + Flask prototype that lets a user run an AI-powered conversational builder (Groq) and produces a fully-rendered, brand-matched persona page.

**Architecture:** Two-tier — Next.js 15 frontend (Tailwind + shadcn/ui + Framer Motion + tsparticles) talks to a Flask backend (Groq SDK + SQLAlchemy + SQLite) via REST/SSE. A shared Persona JSON schema is the contract between the AI builder output and the renderer input.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, tsparticles, Zustand, lucide-react / Flask, SQLAlchemy, SQLite, Groq Python SDK, Pydantic.

**Spec reference:** [docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md](../specs/2026-05-28-personaon-ai-persona-prototype-design.md)

**Test policy:** Per spec Risk #6, no automated test suite in M1. Each task ends with explicit manual verification steps. Exception: pure-logic helpers (FSM, slugify, schema validation) get small pytest checks because they're cheap and high-value.

**Platform note:** Commands are written for **Windows PowerShell**. Use `;` to chain, not `&&` (PowerShell 7 supports `&&` but PS 5 doesn't; we stick to portable forms). Backslashes are fine in Windows paths; Node and Python both accept forward slashes too.

---

## File Structure

```
PersonaOn Profiles/
├─ .gitignore
├─ README.md
├─ backend/
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ requirements.txt
│  ├─ app.py
│  ├─ config.py
│  ├─ routes/
│  │  ├─ __init__.py
│  │  ├─ builder.py
│  │  ├─ persona.py
│  │  └─ chat.py
│  ├─ ai/
│  │  ├─ __init__.py
│  │  ├─ groq_client.py
│  │  ├─ orchestrator.py
│  │  ├─ schemas.py
│  │  └─ prompts/
│  │     ├─ builder_system.txt
│  │     ├─ polish.txt
│  │     ├─ persona_chat.txt
│  │     └─ builder_states/
│  │        ├─ ask_purpose.txt
│  │        ├─ ask_highlight.txt
│  │        ├─ ask_style.txt
│  │        ├─ ask_palette.txt
│  │        ├─ ask_ai_chat.txt
│  │        ├─ ask_visitor_actions.txt
│  │        ├─ ask_priority.txt
│  │        └─ ask_identity.txt
│  ├─ db/
│  │  ├─ __init__.py
│  │  ├─ models.py
│  │  └─ seed.py
│  └─ tests/
│     ├─ test_orchestrator_fsm.py
│     └─ test_schemas.py
└─ frontend/
   ├─ .env.local.example
   ├─ .gitignore
   ├─ package.json
   ├─ tsconfig.json
   ├─ next.config.mjs
   ├─ tailwind.config.ts
   ├─ postcss.config.mjs
   ├─ app/
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  ├─ build/page.tsx
   │  └─ p/[slug]/page.tsx
   ├─ components/
   │  ├─ builder/
   │  │  ├─ ChatPanel.tsx
   │  │  ├─ PreviewPanel.tsx
   │  │  ├─ QuestionCard.tsx
   │  │  └─ StreamingMessage.tsx
   │  ├─ persona/
   │  │  ├─ PersonaPage.tsx
   │  │  ├─ Hero.tsx
   │  │  ├─ AboutSection.tsx
   │  │  ├─ ProjectsSection.tsx
   │  │  ├─ SkillsSection.tsx
   │  │  ├─ ExperienceSection.tsx
   │  │  ├─ TestimonialsSection.tsx
   │  │  ├─ LinksSection.tsx
   │  │  └─ PersonaChat.tsx
   │  ├─ fx/
   │  │  ├─ ParticleBg.tsx
   │  │  ├─ GlassCard.tsx
   │  │  ├─ GradientText.tsx
   │  │  └─ ShimmerSkeleton.tsx
   │  └─ ui/
   │     ├─ button.tsx
   │     └─ ... (shadcn primitives, added on demand)
   └─ lib/
      ├─ api.ts
      ├─ store.ts
      ├─ types.ts
      └─ utils.ts
```

---

## Phase A — Foundation

### Task 1: Repository init + .gitignore

**Files:**
- Create: `.gitignore`
- Create: `README.md` (stub; expanded in Task 21)

- [ ] **Step 1: Initialize git repo**

Run from `c:\Projects\PersonaOn Profiles`:

```powershell
git init
git branch -M main
```

Expected: `Initialized empty Git repository in ...`

- [ ] **Step 2: Create root `.gitignore`**

Create `.gitignore`:

```gitignore
# Node
node_modules/
.next/
.turbo/
out/
build/
dist/
.npm/

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.python-version
*.egg-info/

# Env / secrets
.env
.env.local
.env.*.local

# DB
*.db
*.sqlite
*.sqlite3

# IDE / OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

- [ ] **Step 3: Create stub `README.md`**

```markdown
# PersonaOn AI Persona Prototype

Local prototype that uses Groq to generate AI-powered persona profile pages.

See [docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md](docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md) for the design.

Run instructions: see Task 21 of the implementation plan.
```

- [ ] **Step 4: Commit**

```powershell
git add .gitignore README.md docs/
git commit -m "chore: initial repo scaffolding and design docs"
```

- [ ] **Step 5: Verify**

Run: `git log --oneline`
Expected: a single commit containing the spec, plan, .gitignore, README.md.

---

### Task 2: Flask backend scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/config.py`
- Create: `backend/app.py`
- Create: `backend/routes/__init__.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
flask==3.0.3
flask-cors==5.0.0
sqlalchemy==2.0.36
pydantic==2.9.2
python-dotenv==1.0.1
groq==0.13.0
pytest==8.3.3
```

- [ ] **Step 2: Create `backend/.env.example`**

```
GROQ_API_KEY=your-groq-key-here
DATABASE_URL=sqlite:///personaon.db
FLASK_ENV=development
FLASK_DEBUG=1
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=dev-only-change-me
```

- [ ] **Step 3: Create `backend/.gitignore`**

```
.venv/
__pycache__/
*.pyc
.env
*.db
.pytest_cache/
```

- [ ] **Step 4: Create `backend/config.py`**

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///personaon.db")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
```

- [ ] **Step 5: Create `backend/routes/__init__.py`**

```python
# routes package
```

- [ ] **Step 6: Create `backend/app.py`**

```python
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok"), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=Config.DEBUG)
```

- [ ] **Step 7: Set up venv and install**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..
```

If `Activate.ps1` is blocked by execution policy, run once as admin:
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

- [ ] **Step 8: Manually verify healthz**

In `backend/` with venv active:

```powershell
flask --app app run --port 5000
```

In another terminal:

```powershell
curl http://127.0.0.1:5000/healthz
```

Expected: `{"status":"ok"}`. Kill the server (`Ctrl+C`).

- [ ] **Step 9: Commit**

```powershell
git add backend/
git commit -m "feat(backend): flask scaffold with healthz and CORS"
```

---

### Task 3: Next.js frontend scaffold

**Files:**
- Create: `frontend/` (entire scaffold via create-next-app)
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.ts`
- Create: `frontend/.env.local.example`
- Create: `frontend/lib/utils.ts`

- [ ] **Step 1: Scaffold Next.js app**

From repo root:

```powershell
npx create-next-app@15 frontend --typescript --tailwind --app --src-dir=false --import-alias "@/*" --no-eslint --use-npm
```

Answer "No" to Turbopack if asked (stay on webpack to avoid early-15 quirks). If prompted on ESLint/etc., accept defaults.

- [ ] **Step 2: Install runtime deps**

```powershell
cd frontend
npm install framer-motion zustand lucide-react clsx tailwind-merge class-variance-authority @tsparticles/react @tsparticles/slim
npm install -D @types/node
cd ..
```

- [ ] **Step 3: Install shadcn/ui CLI and init**

```powershell
cd frontend
npx shadcn@latest init -d
npx shadcn@latest add button card input textarea badge separator
cd ..
```

If `shadcn init -d` asks for choices: base color `Zinc`, CSS variables `yes`. The `-d` flag picks sensible defaults; accept overrides if it prompts.

- [ ] **Step 4: Create `frontend/.env.local.example`**

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Then copy:

```powershell
Copy-Item frontend\.env.local.example frontend\.env.local
```

- [ ] **Step 5: Overwrite `frontend/app/globals.css` with brand baseline**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --primary: 263 90% 65%;       /* violet-500 */
    --primary-foreground: 0 0% 100%;
    --accent: 188 90% 55%;        /* cyan-400 */
    --accent-foreground: 240 10% 4%;
    --border: 0 0% 100% / 0.08;
    --ring: 263 90% 65%;
    --radius: 0.85rem;
  }

  html, body {
    background: #0a0a0f;
    color: hsl(var(--foreground));
    font-feature-settings: "cv11", "ss01", "ss03";
  }

  body {
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.18), transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 110%, rgba(34, 211, 238, 0.10), transparent 60%);
    background-attachment: fixed;
    min-height: 100vh;
  }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
                0 30px 60px -20px rgba(0, 0, 0, 0.6);
  }
  .gradient-text {
    background: linear-gradient(135deg, #c4b5fd 0%, #f0abfc 50%, #67e8f9 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .gradient-border {
    position: relative;
  }
  .gradient-border::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    background: linear-gradient(135deg, #8b5cf6, #d946ef, #22d3ee);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}
```

- [ ] **Step 6: Update `frontend/tailwind.config.ts`**

Replace contents with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

Install the animate plugin:

```powershell
cd frontend
npm install -D tailwindcss-animate
cd ..
```

- [ ] **Step 7: Replace `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonaOn — AI-Generated Public Personas",
  description: "An AI-generated digital identity system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.className}`}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
```

Install Geist font:

```powershell
cd frontend
npm install geist
cd ..
```

- [ ] **Step 8: Ensure `frontend/lib/utils.ts` has `cn` helper**

shadcn init should have created this. If missing, create:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 9: Manually verify dev server**

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000. Expected: default Next.js page on a dark background with subtle purple/cyan radial gradients. Kill server.

- [ ] **Step 10: Commit**

```powershell
git add frontend/
git commit -m "feat(frontend): next.js 15 scaffold with brand styling baseline"
```

---

### Task 4: FX components (ParticleBg, GlassCard, GradientText, ShimmerSkeleton)

**Files:**
- Create: `frontend/components/fx/ParticleBg.tsx`
- Create: `frontend/components/fx/GlassCard.tsx`
- Create: `frontend/components/fx/GradientText.tsx`
- Create: `frontend/components/fx/ShimmerSkeleton.tsx`

- [ ] **Step 1: Create `frontend/components/fx/ParticleBg.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

type Density = "off" | "subtle" | "dense";

export function ParticleBg({ density = "subtle" }: { density?: Density }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(() => {
    if (density === "off") return null;
    const number = density === "dense" ? 120 : 50;
    return {
      fullScreen: { enable: false },
      background: { color: "transparent" },
      fpsLimit: 60,
      particles: {
        number: { value: number, density: { enable: true, area: 900 } },
        color: { value: ["#a78bfa", "#67e8f9", "#f0abfc"] },
        opacity: { value: { min: 0.15, max: 0.55 } },
        size: { value: { min: 0.6, max: 2.2 } },
        move: {
          enable: true,
          speed: 0.35,
          direction: "none" as const,
          outModes: { default: "out" as const },
          random: true,
          straight: false,
        },
        links: {
          enable: true,
          distance: 130,
          color: "#a78bfa",
          opacity: 0.08,
          width: 1,
        },
      },
      detectRetina: true,
    };
  }, [density]);

  if (!ready || !options) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Particles id="tsparticles" options={options} />
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/components/fx/GlassCard.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass rounded-2xl", className)}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";
```

- [ ] **Step 3: Create `frontend/components/fx/GradientText.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("gradient-text", className)}>{children}</span>;
}
```

- [ ] **Step 4: Create `frontend/components/fx/ShimmerSkeleton.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}
```

- [ ] **Step 5: Manually verify by mounting on landing**

Quick smoke: in `frontend/app/page.tsx`, temporarily import and render `<ParticleBg />` and a `<GlassCard>` with text. Run `npm run dev` → http://localhost:3000 → confirm particles drift across the page and the glass card has frosted blur. Revert page.tsx — Task 5 builds the real landing.

- [ ] **Step 6: Commit**

```powershell
git add frontend/components/fx/
git commit -m "feat(frontend): brand FX components (particles, glass, gradient, shimmer)"
```

---

### Task 5: Landing page

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Replace `frontend/app/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ParticleBg } from "@/components/fx/ParticleBg";
import { GlassCard } from "@/components/fx/GlassCard";
import { GradientText } from "@/components/fx/GradientText";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBg density="subtle" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-violet-400" />
          PersonaOn
        </div>
        <Link
          href="/build"
          className="text-sm text-white/70 transition hover:text-white"
        >
          Try the builder →
        </Link>
      </nav>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            AI-native persona generation
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-8 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          Your <GradientText>digital identity,</GradientText>
          <br />
          generated by AI.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-6 max-w-2xl text-balance text-base text-white/60 md:text-lg"
        >
          Answer a handful of questions. Watch an entire personalized profile assemble itself — layout, copy, theme, motion. No templates. No two pages alike.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/build"
            className="gradient-border group inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Create your persona
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/p/sai-deekshith-badam-2"
            className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
          >
            See an example
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid w-full grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            { title: "Conversational", body: "A short AI dialogue, then your persona is ready." },
            { title: "Adaptive layouts", body: "Bento, magazine, minimal — chosen for who you are." },
            { title: "Persona AI chat", body: "Visitors chat with an AI that knows you." },
          ].map((f) => (
            <GlassCard key={f.title} className="p-6 text-left">
              <div className="text-sm font-semibold tracking-wide text-white/90">{f.title}</div>
              <p className="mt-2 text-sm text-white/55">{f.body}</p>
            </GlassCard>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Manually verify**

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000. Confirm:
- Particles drift.
- Hero animates in.
- Gradient text visible on "digital identity,".
- Gradient-bordered CTA "Create your persona" links to `/build` (404 expected for now).
- Three glass cards visible at the bottom.

- [ ] **Step 3: Commit**

```powershell
git add frontend/app/page.tsx
git commit -m "feat(frontend): branded landing page with particles, hero, glass cards"
```

---

## Phase B — Persona Renderer

### Task 6: Persona JSON types (frontend) and Pydantic schemas (backend)

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `backend/ai/schemas.py`
- Create: `backend/tests/test_schemas.py`
- Modify: `backend/tests/__init__.py` (create empty if missing)

- [ ] **Step 1: Create `frontend/lib/types.ts`**

```ts
export type ExperienceItem = {
  role: string;
  organization: string;
  start: string;
  end?: string | null;
  summary?: string;
};

export type ProjectItem = {
  title: string;
  description: string;
  tags?: string[];
  url?: string;
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Testimonial = {
  quote: string;
  author: string;
  role?: string;
};

export type LinkItem = {
  label: string;
  url: string;
  icon?: "github" | "linkedin" | "x" | "website" | "email";
};

export type Section =
  | { type: "about"; priority: number; content: { body: string } }
  | { type: "experience"; priority: number; content: { items: ExperienceItem[] } }
  | { type: "projects"; priority: number; content: { items: ProjectItem[] } }
  | { type: "skills"; priority: number; content: { groups: SkillGroup[] } }
  | { type: "testimonials"; priority: number; content: { items: Testimonial[] } }
  | { type: "links"; priority: number; content: { items: LinkItem[] } };

export type SectionType = Section["type"];

export type Persona = {
  id: string;
  slug: string;
  owner_user_id: string;
  owner_display_name: string;
  meta: {
    purpose: string;
    style: string;
    palette: string;
    layout_kind: "bento" | "single-column" | "magazine" | "minimal" | "terminal";
  };
  hero: {
    headline: string;
    subheadline: string;
    cta_label: string;
    ai_chat_position: "hero" | "floating" | "sidebar" | "embedded" | "none";
  };
  sections: Section[];
  theme: {
    primary_color: string;
    accent_color: string;
    mode: "dark" | "light";
    particle_density: "off" | "subtle" | "dense";
  };
  generated_at: string;
  version: number;
};
```

- [ ] **Step 2: Create `backend/ai/__init__.py`**

```python
# ai package
```

- [ ] **Step 3: Create `backend/ai/schemas.py`**

```python
from __future__ import annotations
from typing import Literal, Optional, Union, List
from pydantic import BaseModel, Field


LayoutKind = Literal["bento", "single-column", "magazine", "minimal", "terminal"]
ChatPosition = Literal["hero", "floating", "sidebar", "embedded", "none"]
ParticleDensity = Literal["off", "subtle", "dense"]
Mode = Literal["dark", "light"]


class ExperienceItem(BaseModel):
    role: str
    organization: str
    start: str
    end: Optional[str] = None
    summary: Optional[str] = None


class ProjectItem(BaseModel):
    title: str
    description: str
    tags: List[str] = Field(default_factory=list)
    url: Optional[str] = None


class SkillGroup(BaseModel):
    label: str
    items: List[str]


class Testimonial(BaseModel):
    quote: str
    author: str
    role: Optional[str] = None


class LinkItem(BaseModel):
    label: str
    url: str
    icon: Optional[Literal["github", "linkedin", "x", "website", "email"]] = None


class AboutSection(BaseModel):
    type: Literal["about"]
    priority: int
    content: dict  # {"body": str}


class ExperienceSection(BaseModel):
    type: Literal["experience"]
    priority: int
    content: dict  # {"items": [ExperienceItem]}


class ProjectsSection(BaseModel):
    type: Literal["projects"]
    priority: int
    content: dict


class SkillsSection(BaseModel):
    type: Literal["skills"]
    priority: int
    content: dict


class TestimonialsSection(BaseModel):
    type: Literal["testimonials"]
    priority: int
    content: dict


class LinksSection(BaseModel):
    type: Literal["links"]
    priority: int
    content: dict


Section = Union[
    AboutSection, ExperienceSection, ProjectsSection,
    SkillsSection, TestimonialsSection, LinksSection,
]


class PersonaMeta(BaseModel):
    purpose: str
    style: str
    palette: str
    layout_kind: LayoutKind


class PersonaHero(BaseModel):
    headline: str
    subheadline: str
    cta_label: str
    ai_chat_position: ChatPosition


class PersonaTheme(BaseModel):
    primary_color: str
    accent_color: str
    mode: Mode
    particle_density: ParticleDensity


class Persona(BaseModel):
    id: str
    slug: str
    owner_user_id: str
    owner_display_name: str
    meta: PersonaMeta
    hero: PersonaHero
    sections: List[Section]
    theme: PersonaTheme
    generated_at: str
    version: int = 1


# --- Builder turn protocol ---

class QuestionOption(BaseModel):
    label: str
    value: str
    description: Optional[str] = None


class NextQuestion(BaseModel):
    header: str
    body: str
    kind: Literal["single", "multi", "text", "rank"]
    options: List[QuestionOption] = Field(default_factory=list)


class BuilderTurnResponse(BaseModel):
    next_state: str
    next_question: Optional[NextQuestion] = None
    persona_delta: dict = Field(default_factory=dict)
    ai_message: str
```

- [ ] **Step 4: Create `backend/tests/__init__.py`** (empty)

- [ ] **Step 5: Create `backend/tests/test_schemas.py`**

```python
from ai.schemas import Persona, BuilderTurnResponse


SAMPLE_PERSONA = {
    "id": "p1",
    "slug": "jane-doe",
    "owner_user_id": "u1",
    "owner_display_name": "Jane Doe",
    "meta": {"purpose": "portfolio", "style": "futuristic", "palette": "neon", "layout_kind": "bento"},
    "hero": {"headline": "AI researcher", "subheadline": "Building x.", "cta_label": "Chat", "ai_chat_position": "hero"},
    "sections": [
        {"type": "about", "priority": 1, "content": {"body": "Hi."}},
        {"type": "projects", "priority": 2, "content": {"items": [{"title": "P", "description": "D"}]}},
    ],
    "theme": {"primary_color": "#8b5cf6", "accent_color": "#22d3ee", "mode": "dark", "particle_density": "subtle"},
    "generated_at": "2026-05-28T00:00:00Z",
    "version": 1,
}


def test_persona_round_trip():
    p = Persona.model_validate(SAMPLE_PERSONA)
    assert p.slug == "jane-doe"
    dumped = p.model_dump()
    assert dumped["meta"]["layout_kind"] == "bento"


def test_builder_turn_response_minimal():
    r = BuilderTurnResponse(next_state="done", ai_message="All set.")
    assert r.persona_delta == {}
```

- [ ] **Step 6: Run the tests**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
cd ..
```

Expected: 2 passed.

- [ ] **Step 7: Commit**

```powershell
git add frontend/lib/types.ts backend/ai/ backend/tests/
git commit -m "feat: shared persona JSON schema (frontend types + pydantic models)"
```

---

### Task 7: SQLAlchemy models + SQLite init + seeded example persona

**Files:**
- Create: `backend/db/__init__.py`
- Create: `backend/db/models.py`
- Create: `backend/db/seed.py`
- Modify: `backend/app.py` (init DB + run seed at startup)

- [ ] **Step 1: Create `backend/db/__init__.py`**

```python
# db package
```

- [ ] **Step 2: Create `backend/db/models.py`**

```python
from __future__ import annotations
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship

from config import Config


engine = create_engine(Config.DATABASE_URL, future=True, echo=False)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True))
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    personas = relationship("Persona", back_populates="owner", cascade="all, delete-orphan")


class Persona(Base):
    __tablename__ = "personas"
    id = Column(String, primary_key=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    owner_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    data = Column(Text, nullable=False)  # JSON-encoded Persona
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    owner = relationship("User", back_populates="personas")

    def to_dict(self) -> dict:
        return json.loads(self.data)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_session():
    return SessionLocal()
```

- [ ] **Step 3: Create `backend/db/seed.py`**

```python
import json
import uuid
from datetime import datetime

from db.models import init_db, get_session, User, Persona


SEED_SLUG = "sai-deekshith-badam-2"

SEED_PERSONA = {
    "id": "seed-persona-1",
    "slug": SEED_SLUG,
    "owner_user_id": "seed-user-1",
    "owner_display_name": "Sai Deekshith Badam",
    "meta": {
        "purpose": "ai-researcher",
        "style": "futuristic",
        "palette": "neon",
        "layout_kind": "bento",
    },
    "hero": {
        "headline": "AI researcher building agentic systems.",
        "subheadline": "I design how AI thinks, plans, and talks back.",
        "cta_label": "Chat with my persona",
        "ai_chat_position": "hero",
    },
    "sections": [
        {
            "type": "about",
            "priority": 1,
            "content": {
                "body": "I work at the intersection of agentic AI and human-centered product design. Currently exploring conversational systems that adapt to the person on the other side of the screen.",
            },
        },
        {
            "type": "projects",
            "priority": 2,
            "content": {
                "items": [
                    {
                        "title": "PersonaOn",
                        "description": "AI that generates a personalized public persona from a short conversation.",
                        "tags": ["AI", "Next.js", "Groq"],
                    },
                    {
                        "title": "Agentic Workflows",
                        "description": "Research on multi-step LLM planners that recover from their own mistakes.",
                        "tags": ["Research", "LLM"],
                    },
                ]
            },
        },
        {
            "type": "skills",
            "priority": 3,
            "content": {
                "groups": [
                    {"label": "AI / ML", "items": ["LLM orchestration", "RAG", "Agentic systems", "Prompt engineering"]},
                    {"label": "Engineering", "items": ["TypeScript", "Python", "Flask", "Next.js"]},
                ]
            },
        },
        {
            "type": "experience",
            "priority": 4,
            "content": {
                "items": [
                    {"role": "Founder", "organization": "PersonaOn", "start": "2024", "end": None,
                     "summary": "Building an AI-native persona platform."},
                ]
            },
        },
        {
            "type": "links",
            "priority": 5,
            "content": {
                "items": [
                    {"label": "GitHub", "url": "https://github.com/", "icon": "github"},
                    {"label": "LinkedIn", "url": "https://linkedin.com/", "icon": "linkedin"},
                    {"label": "Website", "url": "https://personaon.com", "icon": "website"},
                ]
            },
        },
    ],
    "theme": {
        "primary_color": "#8b5cf6",
        "accent_color": "#22d3ee",
        "mode": "dark",
        "particle_density": "subtle",
    },
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "version": 1,
}


def seed():
    init_db()
    s = get_session()
    try:
        existing = s.query(Persona).filter_by(slug=SEED_SLUG).first()
        if existing:
            return
        user = s.query(User).filter_by(id="seed-user-1").first()
        if not user:
            user = User(id="seed-user-1")
            s.add(user)
        p = Persona(
            id=SEED_PERSONA["id"],
            slug=SEED_SLUG,
            owner_user_id="seed-user-1",
            data=json.dumps(SEED_PERSONA),
            version=1,
        )
        s.add(p)
        s.commit()
    finally:
        s.close()


if __name__ == "__main__":
    seed()
    print(f"Seeded persona '{SEED_SLUG}'.")
```

- [ ] **Step 4: Update `backend/app.py` to init + seed at startup**

Replace contents:

```python
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db.seed import seed as seed_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    seed_db()

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok"), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=Config.DEBUG)
```

- [ ] **Step 5: Run server and verify DB file**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
flask --app app run --port 5000
```

Expected: server starts; `backend/personaon.db` exists. `Ctrl+C` to stop.

```powershell
ls backend\personaon.db
```

- [ ] **Step 6: Commit**

```powershell
git add backend/db/ backend/app.py
git commit -m "feat(backend): sqlalchemy models, sqlite init, seeded example persona"
```

---

### Task 8: GET /api/personas/<slug> route + frontend API client

**Files:**
- Create: `backend/routes/persona.py`
- Modify: `backend/app.py` (register blueprint)
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create `backend/routes/persona.py`**

```python
from flask import Blueprint, jsonify
from db.models import get_session, Persona

bp = Blueprint("persona", __name__, url_prefix="/api/personas")


@bp.get("/<slug>")
def get_persona(slug: str):
    s = get_session()
    try:
        p = s.query(Persona).filter_by(slug=slug).first()
        if not p:
            return jsonify(error="not_found"), 404
        return jsonify(p.to_dict()), 200
    finally:
        s.close()
```

- [ ] **Step 2: Register the blueprint in `backend/app.py`**

Add inside `create_app()` after `seed_db()`:

```python
    from routes.persona import bp as persona_bp
    app.register_blueprint(persona_bp)
```

Full updated `backend/app.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db.seed import seed as seed_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    seed_db()

    from routes.persona import bp as persona_bp
    app.register_blueprint(persona_bp)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok"), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=Config.DEBUG)
```

- [ ] **Step 3: Verify endpoint**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
flask --app app run --port 5000
```

In another terminal:

```powershell
curl http://127.0.0.1:5000/api/personas/sai-deekshith-badam-2
```

Expected: full JSON of seeded persona. `Ctrl+C` server.

- [ ] **Step 4: Create `frontend/lib/api.ts`**

```ts
import type { Persona } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function ensureUserId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem("personaon_user_id");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("personaon_user_id", id);
  }
  return id;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-User-Id": ensureUserId(),
  };
}

export async function getPersona(slug: string): Promise<Persona | null> {
  const res = await fetch(`${BASE}/api/personas/${slug}`, {
    cache: "no-store",
    headers: typeof window === "undefined" ? { "Content-Type": "application/json" } : headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getPersona failed: ${res.status}`);
  return (await res.json()) as Persona;
}

export async function createPersona(persona: Persona): Promise<Persona> {
  const res = await fetch(`${BASE}/api/personas`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(persona),
  });
  if (!res.ok) throw new Error(`createPersona failed: ${res.status}`);
  return (await res.json()) as Persona;
}

export type SSEHandler = (event: { event?: string; data: string }) => void;

export async function streamSSE(
  url: string,
  body: unknown,
  onChunk: SSEHandler,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal,
  });
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = raw.split("\n");
      let ev: string | undefined;
      const dataParts: string[] = [];
      for (const line of lines) {
        if (line.startsWith("event:")) ev = line.slice(6).trim();
        else if (line.startsWith("data:")) dataParts.push(line.slice(5).trim());
      }
      if (dataParts.length) onChunk({ event: ev, data: dataParts.join("\n") });
    }
  }
}

export function builderTurnUrl() {
  return `${BASE}/api/builder/turn`;
}

export function personaChatUrl(slug: string) {
  return `${BASE}/api/personas/${slug}/chat`;
}
```

- [ ] **Step 5: Commit**

```powershell
git add backend/routes/persona.py backend/app.py frontend/lib/api.ts
git commit -m "feat: GET /api/personas/<slug> + frontend api client with SSE helper"
```

---

### Task 9: Persona renderer page + Hero + AboutSection

**Files:**
- Create: `frontend/app/p/[slug]/page.tsx`
- Create: `frontend/components/persona/PersonaPage.tsx`
- Create: `frontend/components/persona/Hero.tsx`
- Create: `frontend/components/persona/AboutSection.tsx`

- [ ] **Step 1: Create `frontend/app/p/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { PersonaPage } from "@/components/persona/PersonaPage";

async function fetchPersona(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const res = await fetch(`${base}/api/personas/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load persona");
  return res.json();
}

export default async function PersonaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const persona = await fetchPersona(slug);
  if (!persona) notFound();
  return <PersonaPage persona={persona} />;
}
```

- [ ] **Step 2: Create `frontend/components/persona/PersonaPage.tsx`**

```tsx
"use client";

import type { Persona, Section } from "@/lib/types";
import { ParticleBg } from "@/components/fx/ParticleBg";
import { Hero } from "./Hero";
import { AboutSection } from "./AboutSection";
import { ProjectsSection } from "./ProjectsSection";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { LinksSection } from "./LinksSection";
import { PersonaChat } from "./PersonaChat";
import { motion } from "framer-motion";

function renderSection(s: Section, key: string, persona: Persona) {
  switch (s.type) {
    case "about":         return <AboutSection key={key} persona={persona} body={s.content.body} />;
    case "projects":      return <ProjectsSection key={key} items={s.content.items} />;
    case "skills":        return <SkillsSection key={key} groups={s.content.groups} />;
    case "experience":    return <ExperienceSection key={key} items={s.content.items} />;
    case "testimonials":  return <TestimonialsSection key={key} items={s.content.items} />;
    case "links":         return <LinksSection key={key} items={s.content.items} />;
    default:              return null;
  }
}

export function PersonaPage({ persona }: { persona: Persona }) {
  const sorted = [...persona.sections].sort((a, b) => a.priority - b.priority);
  const layout = persona.meta.layout_kind ?? "single-column";
  const containerClass =
    layout === "bento"
      ? "grid grid-cols-1 md:grid-cols-6 gap-4 max-w-6xl mx-auto px-6 mt-16"
      : "max-w-4xl mx-auto px-6 mt-16 space-y-10";

  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <ParticleBg density={persona.theme.particle_density} />
      <Hero persona={persona} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={containerClass}
      >
        {sorted.map((s, i) => renderSection(s, `${s.type}-${i}`, persona))}
      </motion.div>

      {persona.hero.ai_chat_position === "floating" && (
        <PersonaChat persona={persona} variant="floating" />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Create `frontend/components/persona/Hero.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import type { Persona } from "@/lib/types";
import { GradientText } from "@/components/fx/GradientText";
import { PersonaChat } from "./PersonaChat";

export function Hero({ persona }: { persona: Persona }) {
  const showHeroChat = persona.hero.ai_chat_position === "hero";

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.2em] text-white/50"
      >
        {persona.owner_display_name}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
      >
        <GradientText>{persona.hero.headline}</GradientText>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12 }}
        className="mt-6 max-w-2xl text-base text-white/65 md:text-lg"
      >
        {persona.hero.subheadline}
      </motion.p>

      {showHeroChat && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-10"
        >
          <PersonaChat persona={persona} variant="hero" />
        </motion.div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create `frontend/components/persona/AboutSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { Persona } from "@/lib/types";

export function AboutSection({ persona, body }: { persona: Persona; body: string }) {
  const isBento = persona.meta.layout_kind === "bento";
  return (
    <GlassCard className={isBento ? "md:col-span-4 p-8" : "p-8"}>
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">About</h2>
      <p className="mt-4 text-balance text-lg leading-relaxed text-white/85">{body}</p>
    </GlassCard>
  );
}
```

- [ ] **Step 5: Create stub files for sections used in `PersonaPage` so it compiles**

Create placeholders that we will fill in Task 10. For each of: `ProjectsSection.tsx`, `SkillsSection.tsx`, `ExperienceSection.tsx`, `TestimonialsSection.tsx`, `LinksSection.tsx`, `PersonaChat.tsx` — create minimal exports:

`frontend/components/persona/ProjectsSection.tsx`:

```tsx
export function ProjectsSection(_: { items: unknown[] }) {
  return null;
}
```

`frontend/components/persona/SkillsSection.tsx`:

```tsx
export function SkillsSection(_: { groups: unknown[] }) {
  return null;
}
```

`frontend/components/persona/ExperienceSection.tsx`:

```tsx
export function ExperienceSection(_: { items: unknown[] }) {
  return null;
}
```

`frontend/components/persona/TestimonialsSection.tsx`:

```tsx
export function TestimonialsSection(_: { items: unknown[] }) {
  return null;
}
```

`frontend/components/persona/LinksSection.tsx`:

```tsx
export function LinksSection(_: { items: unknown[] }) {
  return null;
}
```

`frontend/components/persona/PersonaChat.tsx`:

```tsx
import type { Persona } from "@/lib/types";

export function PersonaChat(_: { persona: Persona; variant: "hero" | "floating" | "sidebar" | "embedded" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
      Persona chat coming soon.
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Start backend, then frontend:

```powershell
# terminal 1
cd backend; .\.venv\Scripts\Activate.ps1; flask --app app run --port 5000

# terminal 2
cd frontend; npm run dev
```

Open http://localhost:3000/p/sai-deekshith-badam-2. Confirm:
- Hero name + gradient headline + subheadline visible.
- About section appears as a glass card.
- Other sections render `null` placeholders (no errors).
- Particles drift in background.

- [ ] **Step 7: Commit**

```powershell
git add frontend/app/p/ frontend/components/persona/
git commit -m "feat(frontend): persona renderer scaffold with hero + about + section stubs"
```

---

### Task 10: Fill in remaining section components

**Files:**
- Modify: `frontend/components/persona/ProjectsSection.tsx`
- Modify: `frontend/components/persona/SkillsSection.tsx`
- Modify: `frontend/components/persona/ExperienceSection.tsx`
- Modify: `frontend/components/persona/TestimonialsSection.tsx`
- Modify: `frontend/components/persona/LinksSection.tsx`

- [ ] **Step 1: Replace `ProjectsSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { ProjectItem } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

export function ProjectsSection({ items }: { items: ProjectItem[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Projects</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((p, i) => (
          <GlassCard key={i} className="group relative overflow-hidden p-6 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{p.title}</div>
                <p className="mt-2 text-sm text-white/65">{p.description}</p>
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/65">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 p-2 text-white/70 transition group-hover:border-white/20 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `SkillsSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { SkillGroup } from "@/lib/types";

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="md:col-span-3">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Skills</h2>
      <div className="mt-4 space-y-3">
        {groups.map((g, i) => (
          <GlassCard key={i} className="p-5">
            <div className="text-sm font-semibold text-white/90">{g.label}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/75">
                  {s}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `ExperienceSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { ExperienceItem } from "@/lib/types";

export function ExperienceSection({ items }: { items: ExperienceItem[] }) {
  return (
    <div className="md:col-span-3">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Experience</h2>
      <div className="mt-4 space-y-3">
        {items.map((e, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{e.role}</div>
                <div className="text-xs text-white/60">{e.organization}</div>
              </div>
              <div className="text-xs text-white/45">
                {e.start}{e.end ? ` — ${e.end}` : " — Present"}
              </div>
            </div>
            {e.summary && <p className="mt-3 text-sm text-white/70">{e.summary}</p>}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `TestimonialsSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { Testimonial } from "@/lib/types";

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">What people say</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((t, i) => (
          <GlassCard key={i} className="p-6">
            <p className="text-base italic text-white/85">"{t.quote}"</p>
            <div className="mt-4 text-sm text-white/65">
              <span className="font-semibold text-white/85">{t.author}</span>
              {t.role && <span className="text-white/50"> — {t.role}</span>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Replace `LinksSection.tsx`**

```tsx
import { GlassCard } from "@/components/fx/GlassCard";
import type { LinkItem } from "@/lib/types";
import { Github, Linkedin, Globe, Mail, Twitter } from "lucide-react";

const ICONS = {
  github: Github,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
  x: Twitter,
} as const;

export function LinksSection({ items }: { items: LinkItem[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Find me</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((l, i) => {
          const Icon = l.icon ? ICONS[l.icon] : Globe;
          return (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify visually**

Reload http://localhost:3000/p/sai-deekshith-badam-2. Confirm:
- Projects, Skills, Experience, Links all render with the seeded data.
- Hover on project card → slight lift transition.
- Glass styling consistent across cards.

- [ ] **Step 7: Commit**

```powershell
git add frontend/components/persona/
git commit -m "feat(frontend): full section components (projects, skills, experience, testimonials, links)"
```

---

## Phase C — Backend AI

### Task 11: Groq client wrapper

**Files:**
- Create: `backend/ai/groq_client.py`

- [ ] **Step 1: Create `backend/ai/groq_client.py`**

```python
from __future__ import annotations
import json
from typing import Generator, Optional
from groq import Groq
from config import Config


BUILDER_MODEL = "llama-3.3-70b-versatile"
CHAT_MODEL = "llama-3.1-8b-instant"


_client: Optional[Groq] = None


def client() -> Groq:
    global _client
    if _client is None:
        if not Config.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env.")
        _client = Groq(api_key=Config.GROQ_API_KEY)
    return _client


def complete_json(system: str, user: str, model: str = BUILDER_MODEL) -> dict:
    """One-shot JSON completion. Returns the parsed dict.

    Raises ValueError if Groq returns non-JSON content.
    """
    resp = client().chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.6,
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Groq returned non-JSON: {content[:300]}") from e


def stream_tokens(system: str, user: str, model: str = CHAT_MODEL) -> Generator[str, None, None]:
    """Yield raw token strings from a streamed chat completion."""
    stream = client().chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        stream=True,
        temperature=0.7,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
```

- [ ] **Step 2: Smoke test (requires a real GROQ_API_KEY)**

In a Python shell with `backend/.venv` active and a real key in `backend/.env`:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -c "from ai.groq_client import complete_json; print(complete_json('You return JSON.', 'Return JSON like {\"hello\": \"world\"}.'))"
```

Expected: a dict containing `{"hello": "world"}` (or similar). If key is missing, expect a RuntimeError — that's fine for now; finish the plan and supply the key before Phase D verification.

- [ ] **Step 3: Commit**

```powershell
git add backend/ai/groq_client.py
git commit -m "feat(backend): groq client wrapper (json + streaming)"
```

---

### Task 12: AI orchestrator FSM (with unit tests)

**Files:**
- Create: `backend/ai/orchestrator.py`
- Create: `backend/tests/test_orchestrator_fsm.py`

- [ ] **Step 1: Create `backend/ai/orchestrator.py`**

```python
from __future__ import annotations
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from pydantic import ValidationError

from ai.groq_client import complete_json, BUILDER_MODEL
from ai.schemas import BuilderTurnResponse, Persona


# FSM order — matches the spec's 8 wizard steps.
STATES = [
    "ask_purpose",
    "ask_highlight",
    "ask_style",
    "ask_palette",
    "ask_ai_chat",
    "ask_visitor_actions",
    "ask_priority",
    "ask_identity",
    "done",
]


PROMPTS_DIR = Path(__file__).parent / "prompts"


def next_state(current: str) -> str:
    if current not in STATES:
        return STATES[0]
    idx = STATES.index(current)
    return STATES[min(idx + 1, len(STATES) - 1)]


def load_prompt(name: str) -> str:
    path = PROMPTS_DIR / name
    return path.read_text(encoding="utf-8")


def build_user_payload(persona_so_far: dict, last_answer: Optional[str], current_state: str) -> str:
    return json.dumps({
        "current_state": current_state,
        "last_answer": last_answer,
        "persona_so_far": persona_so_far,
    }, ensure_ascii=False)


def run_turn(
    current_state: str,
    persona_so_far: dict,
    last_answer: Optional[str],
) -> BuilderTurnResponse:
    """Drive one builder FSM turn via Groq. Returns a validated BuilderTurnResponse."""
    if current_state == "done":
        return BuilderTurnResponse(next_state="done", ai_message="Your persona is ready.")

    state_prompt = load_prompt(f"builder_states/{current_state}.txt")
    system = load_prompt("builder_system.txt") + "\n\n" + state_prompt
    user = build_user_payload(persona_so_far, last_answer, current_state)

    raw = complete_json(system=system, user=user, model=BUILDER_MODEL)
    try:
        return BuilderTurnResponse.model_validate(raw)
    except ValidationError as e:
        # Single retry with the validation error fed back to the model.
        retry_user = user + f"\n\nPrevious response failed validation: {e}. Return valid JSON matching the schema."
        raw2 = complete_json(system=system, user=retry_user, model=BUILDER_MODEL)
        return BuilderTurnResponse.model_validate(raw2)


def polish(persona_draft: dict) -> dict:
    """Final pass — polish copy and ensure schema compliance."""
    system = load_prompt("polish.txt")
    user = json.dumps({"draft": persona_draft}, ensure_ascii=False)
    raw = complete_json(system=system, user=user, model=BUILDER_MODEL)
    # Fill in required fields if missing.
    raw.setdefault("id", str(uuid.uuid4()))
    raw.setdefault("owner_user_id", persona_draft.get("owner_user_id", "anon"))
    raw.setdefault("generated_at", datetime.utcnow().isoformat() + "Z")
    raw.setdefault("version", 1)
    return Persona.model_validate(raw).model_dump()
```

- [ ] **Step 2: Create `backend/tests/test_orchestrator_fsm.py`**

```python
from ai.orchestrator import next_state, STATES


def test_state_order_starts_with_purpose():
    assert STATES[0] == "ask_purpose"


def test_next_state_advances():
    assert next_state("ask_purpose") == "ask_highlight"
    assert next_state("ask_highlight") == "ask_style"


def test_next_state_terminates_at_done():
    assert next_state("ask_identity") == "done"
    assert next_state("done") == "done"


def test_unknown_state_resets_to_first():
    assert next_state("garbage") == "ask_purpose"
```

- [ ] **Step 3: Run tests**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
cd ..
```

Expected: 6 passed (2 from schema + 4 from FSM).

- [ ] **Step 4: Commit**

```powershell
git add backend/ai/orchestrator.py backend/tests/test_orchestrator_fsm.py
git commit -m "feat(backend): FSM orchestrator for builder turns with validation retry"
```

---

### Task 13: Builder prompts (system + 8 states + polish + chat)

**Files:**
- Create: `backend/ai/prompts/builder_system.txt`
- Create: `backend/ai/prompts/polish.txt`
- Create: `backend/ai/prompts/persona_chat.txt`
- Create: `backend/ai/prompts/builder_states/ask_purpose.txt`
- Create: `backend/ai/prompts/builder_states/ask_highlight.txt`
- Create: `backend/ai/prompts/builder_states/ask_style.txt`
- Create: `backend/ai/prompts/builder_states/ask_palette.txt`
- Create: `backend/ai/prompts/builder_states/ask_ai_chat.txt`
- Create: `backend/ai/prompts/builder_states/ask_visitor_actions.txt`
- Create: `backend/ai/prompts/builder_states/ask_priority.txt`
- Create: `backend/ai/prompts/builder_states/ask_identity.txt`

- [ ] **Step 1: `builder_system.txt`**

```
You are the PersonaOn AI Builder — a warm, sharp design consultant helping the user generate a personalized public persona page. You speak briefly, with confidence and personality.

You MUST output one JSON object matching this exact schema:

{
  "next_state": "string — the next FSM state name, OR 'done'",
  "next_question": {
    "header": "short label (≤ 14 chars)",
    "body": "the question text shown to the user",
    "kind": "single | multi | text | rank",
    "options": [{ "label": "Display", "value": "machine_value", "description": "optional one-liner" }]
  } | null,
  "persona_delta": { /* JSON object — partial Persona fields to merge into persona_so_far */ },
  "ai_message": "1-2 sentence conversational message shown in the chat panel BEFORE the question"
}

Rules:
- Update only the fields you are confident about. Leave others alone.
- Never invent project names, employers, or testimonials. If the user has not provided them, leave the corresponding section out.
- All colors must be valid hex (e.g., "#8b5cf6").
- Keep ai_message under 220 characters. Be human, not corporate.
- If a state name is provided, advance the FSM by setting next_state to the next logical state.
```

- [ ] **Step 2: `polish.txt`**

```
You are polishing a draft PersonaOn persona into a final, schema-valid JSON object.

Input: {"draft": <partial persona>}

You MUST return one JSON object matching this Persona schema:

{
  "id": "string",
  "slug": "kebab-case slug derived from owner_display_name",
  "owner_user_id": "string",
  "owner_display_name": "string",
  "meta": {"purpose": "string", "style": "string", "palette": "string", "layout_kind": "bento|single-column|magazine|minimal|terminal"},
  "hero": {"headline": "string", "subheadline": "string", "cta_label": "string", "ai_chat_position": "hero|floating|sidebar|embedded|none"},
  "sections": [ { "type": "about|experience|projects|skills|testimonials|links", "priority": number, "content": { ... type-specific ... } } ],
  "theme": {"primary_color": "#hex", "accent_color": "#hex", "mode": "dark|light", "particle_density": "off|subtle|dense"},
  "generated_at": "ISO timestamp",
  "version": 1
}

Polish rules:
- Write a sharp, specific 1-sentence headline. Avoid clichés ("passionate", "results-driven").
- Subheadline: one supporting sentence, also specific.
- Fill any missing required fields with sensible defaults inferred from the draft.
- Never fabricate facts; if a section has no data, omit the section.
- Sort sections by priority ascending. About is typically priority 1.
```

- [ ] **Step 3: `persona_chat.txt`**

```
You are an AI persona representing {{owner_display_name}}, speaking to a visitor of their public profile.

Your knowledge is limited to this persona JSON (the truth):

{{persona_json}}

Rules:
- Speak as the persona owner, in first person.
- Never invent facts not in the persona JSON. If asked something you don't know, say so briefly and pivot to what is known.
- Keep answers concise (≤ 4 short sentences) unless asked for detail.
- Tone: confident, friendly, specific. Match the energy of the persona's purpose/style.
```

- [ ] **Step 4: State prompts (each is small, focused)**

`builder_states/ask_purpose.txt`:

```
You are at state "ask_purpose". Ask the user what the main purpose of their persona is.

Return JSON with:
- next_state: "ask_highlight"
- next_question with kind="single" and options for: portfolio, resume, personal-brand, freelancer, founder, ai-researcher, student, creator
- persona_delta: {} (this is the first turn; no answer to apply yet UNLESS last_answer is non-null, in which case set meta.purpose)
- ai_message: a warm opener — what should the world know you for?
```

`builder_states/ask_highlight.txt`:

```
You are at state "ask_highlight". Based on the user's purpose (in persona_so_far.meta.purpose), ask what visitors should notice first.

Update persona_delta with meta.purpose if last_answer is provided.

next_question kind="single", options drawn from: skills, projects, experience, achievements, ai-chat, contact, research, certifications.
next_state: "ask_style"
ai_message: react briefly to their purpose, then ask the highlight question.
```

`builder_states/ask_style.txt`:

```
State "ask_style". Apply last_answer (which is the "highlight" choice) into persona_delta as a hint — you can derive a sections[0] entry or note it in meta.

Ask the user to pick a visual style. options: minimal, corporate, futuristic, creative, developer, terminal, ai-native, magazine, glassmorphism, bento.
next_state: "ask_palette"
```

`builder_states/ask_palette.txt`:

```
State "ask_palette". Apply meta.style from last_answer.

Ask for color personality. options: dark, light, neon, professional, gradient-heavy, monochrome, dynamic.
next_state: "ask_ai_chat"
```

`builder_states/ask_ai_chat.txt`:

```
State "ask_ai_chat". Apply meta.palette and derive theme.primary_color + theme.accent_color from the palette choice. Also set theme.mode to "dark" unless the user picked "light". Derive theme.particle_density from style/palette ("dense" for neon/futuristic, "subtle" otherwise, "off" for minimal).

Ask the user about AI chat placement. options: hero, floating, sidebar, embedded, none.
next_state: "ask_visitor_actions"
```

`builder_states/ask_visitor_actions.txt`:

```
State "ask_visitor_actions". Apply hero.ai_chat_position from last_answer.

Ask what visitors should be able to do — kind="multi". options: chat, book-call, download-resume, view-projects, hire, contact, follow-socials.
next_state: "ask_priority"
```

`builder_states/ask_priority.txt`:

```
State "ask_priority". Apply hero.cta_label inferred from the strongest selected visitor action.

Ask the user to rank sections — kind="rank". options: about, experience, projects, skills, testimonials, blogs.
next_state: "ask_identity"
```

`builder_states/ask_identity.txt`:

```
State "ask_identity". Apply the priority ranking by creating sections[] entries with priority based on the user's order.

Ask kind="text" for the user's identity: name, headline you'd want, a short paragraph about you, and any social links (LinkedIn, GitHub, X, website) — one free-text input.

Set next_state to "done" after applying this answer.
ai_message: explain that you'll polish everything into a final persona once they answer.
```

- [ ] **Step 5: Verify FSM loads prompts**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -c "from ai.orchestrator import load_prompt; print(load_prompt('builder_system.txt')[:60]); print(load_prompt('builder_states/ask_purpose.txt')[:60])"
cd ..
```

Expected: first 60 chars of each prompt printed without error.

- [ ] **Step 6: Commit**

```powershell
git add backend/ai/prompts/
git commit -m "feat(backend): builder system + state prompts + polish + persona-chat prompt"
```

---

### Task 14: POST /api/builder/turn (SSE)

**Files:**
- Create: `backend/routes/builder.py`
- Modify: `backend/app.py` (register blueprint)

- [ ] **Step 1: Create `backend/routes/builder.py`**

```python
import json
import uuid
from flask import Blueprint, request, Response, stream_with_context, jsonify

from ai.orchestrator import run_turn, polish, STATES

bp = Blueprint("builder", __name__, url_prefix="/api/builder")


# In-memory builder session store (prototype only).
SESSIONS: dict[str, dict] = {}


def _sse(event: str, data: dict | str) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


@bp.post("/turn")
def builder_turn():
    body = request.get_json(force=True, silent=True) or {}
    session_id = body.get("session_id") or str(uuid.uuid4())
    last_answer = body.get("last_answer")
    incoming_state = body.get("state") or "ask_purpose"
    persona_so_far = body.get("persona_so_far") or SESSIONS.get(session_id, {}).get("persona", {})

    @stream_with_context
    def gen():
        try:
            yield _sse("session", {"session_id": session_id})
            response = run_turn(incoming_state, persona_so_far, last_answer)

            # Merge delta locally for next turn convenience.
            merged = _deep_merge(persona_so_far, response.persona_delta or {})
            SESSIONS[session_id] = {"persona": merged, "state": response.next_state}

            yield _sse("delta", response.persona_delta or {})
            yield _sse("message", response.ai_message)
            if response.next_question:
                yield _sse("question", response.next_question.model_dump())
            yield _sse("state", {"next_state": response.next_state})

            if response.next_state == "done":
                final = polish(merged)
                SESSIONS[session_id]["persona"] = final
                yield _sse("final", final)
        except Exception as e:
            yield _sse("error", {"message": str(e)})

    return Response(gen(), mimetype="text/event-stream")


@bp.get("/session/<session_id>")
def get_session(session_id: str):
    sess = SESSIONS.get(session_id)
    if not sess:
        return jsonify(error="not_found"), 404
    return jsonify(sess), 200


def _deep_merge(a: dict, b: dict) -> dict:
    out = dict(a)
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        elif isinstance(v, list):
            out[k] = v  # replace lists wholesale to avoid duplicate sections
        else:
            out[k] = v
    return out
```

- [ ] **Step 2: Register blueprint in `backend/app.py`**

Inside `create_app()`, add (alongside the existing persona blueprint):

```python
    from routes.builder import bp as builder_bp
    app.register_blueprint(builder_bp)
```

- [ ] **Step 3: Verify endpoint exists**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
flask --app app run --port 5000
```

In another terminal (POST without a real Groq key will error inside the stream — that's expected; we only verify the route is reachable):

```powershell
curl -X POST http://127.0.0.1:5000/api/builder/turn -H "Content-Type: application/json" -d "{}"
```

Expected with a real `GROQ_API_KEY`: streaming SSE events with `event: session`, `event: delta`, `event: message`, `event: question`, `event: state`. Without a key: an `event: error` line. Either confirms the route is wired.

- [ ] **Step 4: Commit**

```powershell
git add backend/routes/builder.py backend/app.py
git commit -m "feat(backend): POST /api/builder/turn SSE endpoint with FSM orchestration"
```

---

### Task 15: POST /api/personas + POST /api/personas/<slug>/chat

**Files:**
- Modify: `backend/routes/persona.py`
- Create: `backend/routes/chat.py`
- Modify: `backend/app.py`

- [ ] **Step 1: Update `backend/routes/persona.py` to add POST**

Replace contents:

```python
import json
import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request

from db.models import get_session, Persona, User
from ai.schemas import Persona as PersonaSchema

bp = Blueprint("persona", __name__, url_prefix="/api/personas")


def _slugify(value: str) -> str:
    import re
    v = re.sub(r"[^a-z0-9\s-]", "", value.lower()).strip()
    v = re.sub(r"\s+", "-", v)
    v = re.sub(r"-+", "-", v)
    return v.strip("-") or "persona"


@bp.get("/<slug>")
def get_persona(slug: str):
    s = get_session()
    try:
        p = s.query(Persona).filter_by(slug=slug).first()
        if not p:
            return jsonify(error="not_found"), 404
        return jsonify(p.to_dict()), 200
    finally:
        s.close()


@bp.post("")
def create_persona():
    body = request.get_json(force=True, silent=True) or {}
    user_id = request.headers.get("X-User-Id") or body.get("owner_user_id") or str(uuid.uuid4())

    # Ensure required fields then validate via Pydantic
    body.setdefault("id", str(uuid.uuid4()))
    body.setdefault("owner_user_id", user_id)
    body.setdefault("generated_at", datetime.utcnow().isoformat() + "Z")
    body.setdefault("version", 1)
    if not body.get("slug"):
        body["slug"] = _slugify(body.get("owner_display_name") or "persona")

    persona = PersonaSchema.model_validate(body).model_dump()

    s = get_session()
    try:
        # Ensure user exists
        u = s.query(User).filter_by(id=user_id).first()
        if not u:
            u = User(id=user_id)
            s.add(u)

        # Slug collision handling — append short suffix until unique.
        base_slug = persona["slug"]
        slug = base_slug
        n = 2
        while s.query(Persona).filter_by(slug=slug).first() is not None:
            slug = f"{base_slug}-{n}"
            n += 1
        persona["slug"] = slug

        row = Persona(
            id=persona["id"],
            slug=slug,
            owner_user_id=user_id,
            data=json.dumps(persona),
            version=persona["version"],
        )
        s.add(row)
        s.commit()
        return jsonify(persona), 201
    except Exception as e:
        s.rollback()
        return jsonify(error="create_failed", detail=str(e)), 400
    finally:
        s.close()
```

- [ ] **Step 2: Create `backend/routes/chat.py`**

```python
import json
from flask import Blueprint, request, Response, stream_with_context, jsonify

from db.models import get_session, Persona
from ai.groq_client import stream_tokens
from ai.orchestrator import load_prompt

bp = Blueprint("persona_chat", __name__, url_prefix="/api/personas")


def _sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


@bp.post("/<slug>/chat")
def persona_chat(slug: str):
    s = get_session()
    try:
        p = s.query(Persona).filter_by(slug=slug).first()
        if not p:
            return jsonify(error="not_found"), 404
        persona_json = p.to_dict()
    finally:
        s.close()

    body = request.get_json(force=True, silent=True) or {}
    user_message = (body.get("message") or "").strip()
    if not user_message:
        return jsonify(error="empty_message"), 400

    template = load_prompt("persona_chat.txt")
    system = (template
              .replace("{{owner_display_name}}", persona_json.get("owner_display_name", ""))
              .replace("{{persona_json}}", json.dumps(persona_json, ensure_ascii=False)))

    @stream_with_context
    def gen():
        try:
            for tok in stream_tokens(system=system, user=user_message):
                yield _sse("token", tok)
            yield _sse("done", "1")
        except Exception as e:
            yield _sse("error", str(e))

    return Response(gen(), mimetype="text/event-stream")
```

- [ ] **Step 3: Register chat blueprint in `backend/app.py`**

Inside `create_app()`:

```python
    from routes.chat import bp as chat_bp
    app.register_blueprint(chat_bp)
```

Final `backend/app.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db.seed import seed as seed_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    seed_db()

    from routes.persona import bp as persona_bp
    from routes.builder import bp as builder_bp
    from routes.chat import bp as chat_bp

    app.register_blueprint(persona_bp)
    app.register_blueprint(builder_bp)
    app.register_blueprint(chat_bp)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok"), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=Config.DEBUG)
```

- [ ] **Step 4: Verify all routes load**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
flask --app app run --port 5000
```

Expected: no import errors; server listens on 5000. `Ctrl+C` to stop.

```powershell
curl http://127.0.0.1:5000/api/personas/sai-deekshith-badam-2
```

Expected: persona JSON still returned (regression check).

- [ ] **Step 5: Commit**

```powershell
git add backend/routes/ backend/app.py
git commit -m "feat(backend): POST /api/personas (persist) + POST /api/personas/<slug>/chat (SSE)"
```

---

## Phase D — Builder UI

### Task 16: Zustand store + persona chat wiring

**Files:**
- Create: `frontend/lib/store.ts`
- Modify: `frontend/components/persona/PersonaChat.tsx`

- [ ] **Step 1: Create `frontend/lib/store.ts`**

```ts
import { create } from "zustand";
import type { Persona } from "@/lib/types";

export type BuilderState =
  | "idle"
  | "ask_purpose"
  | "ask_highlight"
  | "ask_style"
  | "ask_palette"
  | "ask_ai_chat"
  | "ask_visitor_actions"
  | "ask_priority"
  | "ask_identity"
  | "done";

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  streaming?: boolean;
};

export type BuilderQuestion = {
  header: string;
  body: string;
  kind: "single" | "multi" | "text" | "rank";
  options: Array<{ label: string; value: string; description?: string }>;
};

type Store = {
  sessionId: string | null;
  state: BuilderState;
  persona: Persona | null;
  draftPersona: Record<string, unknown>;
  chat: ChatMessage[];
  question: BuilderQuestion | null;
  isStreaming: boolean;

  setSessionId: (id: string) => void;
  setState: (s: BuilderState) => void;
  applyDelta: (delta: Record<string, unknown>) => void;
  appendMessage: (m: ChatMessage) => void;
  setQuestion: (q: BuilderQuestion | null) => void;
  setStreaming: (v: boolean) => void;
  setPersona: (p: Persona) => void;
  reset: () => void;
};

function deepMerge<T extends Record<string, any>>(a: T, b: Record<string, any>): T {
  const out: any = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) {
      out[k] = deepMerge(a[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const useBuilder = create<Store>((set) => ({
  sessionId: null,
  state: "idle",
  persona: null,
  draftPersona: {},
  chat: [],
  question: null,
  isStreaming: false,

  setSessionId: (id) => set({ sessionId: id }),
  setState: (s) => set({ state: s }),
  applyDelta: (delta) => set((cur) => ({ draftPersona: deepMerge(cur.draftPersona, delta) })),
  appendMessage: (m) => set((cur) => ({ chat: [...cur.chat, m] })),
  setQuestion: (q) => set({ question: q }),
  setStreaming: (v) => set({ isStreaming: v }),
  setPersona: (p) => set({ persona: p, draftPersona: p as unknown as Record<string, unknown> }),
  reset: () =>
    set({
      sessionId: null,
      state: "idle",
      persona: null,
      draftPersona: {},
      chat: [],
      question: null,
      isStreaming: false,
    }),
}));
```

- [ ] **Step 2: Replace `frontend/components/persona/PersonaChat.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import type { Persona } from "@/lib/types";
import { personaChatUrl, streamSSE } from "@/lib/api";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { id: string; role: "user" | "ai"; content: string };

export function PersonaChat({
  persona,
  variant,
}: {
  persona: Persona;
  variant: "hero" | "floating" | "sidebar" | "embedded";
}) {
  const [open, setOpen] = useState(variant !== "floating");
  const [messages, setMessages] = useState<Msg[]>([
    { id: "intro", role: "ai", content: `Hi — I'm ${persona.owner_display_name}'s AI persona. Ask me anything about my work.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const aiId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: aiId, role: "ai", content: "" }]);
    setBusy(true);
    abortRef.current = new AbortController();

    try {
      await streamSSE(
        personaChatUrl(persona.slug),
        { message: text },
        ({ event, data }) => {
          if (event === "token") {
            setMessages((m) =>
              m.map((msg) => (msg.id === aiId ? { ...msg, content: msg.content + data } : msg))
            );
          } else if (event === "error") {
            setMessages((m) =>
              m.map((msg) => (msg.id === aiId ? { ...msg, content: `(error: ${data})` } : msg))
            );
          }
        },
        abortRef.current.signal,
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) => (msg.id === aiId ? { ...msg, content: `(network error)` } : msg))
      );
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-violet-500/90 text-white"
                    : "border border-white/10 bg-white/[0.04] text-white/85"
                )}
              >
                {m.content || (m.role === "ai" && busy ? <span className="inline-block animate-pulse">▍</span> : null)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-white/10 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${persona.owner_display_name.split(" ")[0]} anything...`}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3 py-2 text-white shadow-lg shadow-violet-500/20 transition disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  if (variant === "hero") {
    return <div className="glass h-[420px] rounded-2xl">{body}</div>;
  }

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={() => setOpen((v) => !v)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-medium text-white shadow-xl shadow-violet-500/30"
        >
          <Sparkles className="h-4 w-4" />
          Chat with {persona.owner_display_name.split(" ")[0]}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="glass fixed bottom-24 right-6 z-30 h-[500px] w-[380px] rounded-2xl"
            >
              {body}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return <div className="glass h-[420px] rounded-2xl">{body}</div>;
}
```

- [ ] **Step 3: Verify persona chat works**

With backend running + a valid `GROQ_API_KEY`:

Open http://localhost:3000/p/sai-deekshith-badam-2. The hero AI chat should be visible (seed sets `ai_chat_position: "hero"`). Type "What do you build?" and press send. Confirm tokens stream in.

If you don't have a key yet, you'll see the error message inside the chat panel — that's expected and proves the wiring is correct. Add the key and reload.

- [ ] **Step 4: Commit**

```powershell
git add frontend/lib/store.ts frontend/components/persona/PersonaChat.tsx
git commit -m "feat(frontend): zustand store + working persona chat with SSE streaming"
```

---

### Task 17: Builder split-screen page + chat + preview panels

**Files:**
- Create: `frontend/app/build/page.tsx`
- Create: `frontend/components/builder/ChatPanel.tsx`
- Create: `frontend/components/builder/PreviewPanel.tsx`
- Create: `frontend/components/builder/QuestionCard.tsx`
- Create: `frontend/components/builder/StreamingMessage.tsx`

- [ ] **Step 1: Create `frontend/components/builder/StreamingMessage.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";

export function StreamingMessage({ role, content, streaming }: { role: "ai" | "user"; content: string; streaming?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={role === "user" ? "flex justify-end" : "flex justify-start"}
    >
      <div
        className={
          role === "user"
            ? "max-w-[85%] rounded-2xl bg-violet-500/90 px-3.5 py-2 text-sm text-white"
            : "max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm leading-relaxed text-white/85"
        }
      >
        {content}
        {streaming && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `frontend/components/builder/QuestionCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { BuilderQuestion } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function QuestionCard({
  q,
  onSubmit,
  disabled,
}: {
  q: BuilderQuestion;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [rank, setRank] = useState<string[]>(q.options.map((o) => o.value));

  if (q.kind === "single") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45">{q.header}</div>
        <div className="text-sm text-white/85">{q.body}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {q.options.map((o) => (
            <button
              key={o.value}
              disabled={disabled}
              onClick={() => onSubmit(o.value)}
              className="group rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white/85 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
            >
              <div className="font-medium">{o.label}</div>
              {o.description && <div className="mt-0.5 text-xs text-white/45">{o.description}</div>}
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (q.kind === "multi") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45">{q.header}</div>
        <div className="text-sm text-white/85">{q.body}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {q.options.map((o) => {
            const on = multi.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => setMulti((cur) => (on ? cur.filter((v) => v !== o.value) : [...cur, o.value]))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  on
                    ? "border-violet-400/60 bg-violet-500/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <button
          disabled={disabled || multi.length === 0}
          onClick={() => onSubmit(multi.join(","))}
          className="mt-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  if (q.kind === "rank") {
    function move(idx: number, dir: -1 | 1) {
      setRank((cur) => {
        const next = [...cur];
        const j = idx + dir;
        if (j < 0 || j >= next.length) return cur;
        [next[idx], next[j]] = [next[j], next[idx]];
        return next;
      });
    }
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45">{q.header}</div>
        <div className="text-sm text-white/85">{q.body}</div>
        <ul className="mt-3 space-y-1.5">
          {rank.map((v, i) => {
            const o = q.options.find((x) => x.value === v)!;
            return (
              <li key={v} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85">
                <span><span className="text-white/45">{i + 1}.</span> {o.label}</span>
                <span className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} className="rounded px-1.5 text-white/60 hover:text-white">↑</button>
                  <button onClick={() => move(i, 1)} className="rounded px-1.5 text-white/60 hover:text-white">↓</button>
                </span>
              </li>
            );
          })}
        </ul>
        <button
          disabled={disabled}
          onClick={() => onSubmit(rank.join(","))}
          className="mt-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  // text
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">{q.header}</div>
      <div className="text-sm text-white/85">{q.body}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
        placeholder="Type your answer..."
      />
      <button
        disabled={disabled || !text.trim()}
        onClick={() => onSubmit(text.trim())}
        className="mt-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Continue
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `frontend/components/builder/ChatPanel.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useBuilder } from "@/lib/store";
import { StreamingMessage } from "./StreamingMessage";
import { QuestionCard } from "./QuestionCard";
import { Sparkles } from "lucide-react";

export function ChatPanel({ onAnswer }: { onAnswer: (a: string) => void }) {
  const { chat, question, isStreaming, state } = useBuilder();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, question?.body]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium text-white/85">PersonaOn Builder</span>
        <span className="ml-auto text-xs text-white/40">{state === "done" ? "Done" : state}</span>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {chat.map((m) => (
          <StreamingMessage key={m.id} role={m.role} content={m.content} streaming={m.streaming} />
        ))}
        {question && (
          <div className="pt-2">
            <QuestionCard q={question} onSubmit={onAnswer} disabled={isStreaming} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/components/builder/PreviewPanel.tsx`**

```tsx
"use client";

import { useBuilder } from "@/lib/store";
import { ShimmerSkeleton } from "@/components/fx/ShimmerSkeleton";
import { PersonaPage } from "@/components/persona/PersonaPage";
import type { Persona } from "@/lib/types";

const PLACEHOLDER: Persona = {
  id: "preview",
  slug: "preview",
  owner_user_id: "preview",
  owner_display_name: "Your Name",
  meta: { purpose: "portfolio", style: "futuristic", palette: "neon", layout_kind: "single-column" },
  hero: {
    headline: "Your persona, generated by AI.",
    subheadline: "Answer a few questions in the panel on the left — this preview updates in real time.",
    cta_label: "Chat",
    ai_chat_position: "none",
  },
  sections: [{ type: "about", priority: 1, content: { body: "Your about section will appear here once you start." } }],
  theme: { primary_color: "#8b5cf6", accent_color: "#22d3ee", mode: "dark", particle_density: "subtle" },
  generated_at: new Date().toISOString(),
  version: 1,
};

function mergePreview(draft: Record<string, unknown>): Persona {
  return {
    ...PLACEHOLDER,
    ...(draft as Partial<Persona>),
    meta: { ...PLACEHOLDER.meta, ...((draft as any).meta ?? {}) },
    hero: { ...PLACEHOLDER.hero, ...((draft as any).hero ?? {}) },
    theme: { ...PLACEHOLDER.theme, ...((draft as any).theme ?? {}) },
    sections: ((draft as any).sections as Persona["sections"]) ?? PLACEHOLDER.sections,
  };
}

export function PreviewPanel() {
  const { draftPersona, isStreaming } = useBuilder();
  const preview = mergePreview(draftPersona);
  return (
    <div className="relative h-full overflow-y-auto rounded-2xl border border-white/10 bg-black/40">
      {isStreaming && (
        <div className="absolute inset-x-0 top-0 z-10 p-2">
          <ShimmerSkeleton className="h-1 w-full opacity-60" />
        </div>
      )}
      <PersonaPage persona={preview} />
    </div>
  );
}
```

- [ ] **Step 5: Create `frontend/app/build/page.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBuilder } from "@/lib/store";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { builderTurnUrl, streamSSE, createPersona } from "@/lib/api";
import { ParticleBg } from "@/components/fx/ParticleBg";
import type { Persona } from "@/lib/types";

export default function BuildPage() {
  const router = useRouter();
  const store = useBuilder();

  useEffect(() => {
    if (store.state === "idle") {
      // Kick off first turn
      runTurn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(answer: string | null) {
    store.setStreaming(true);
    store.setQuestion(null);

    const aiMsgId = crypto.randomUUID();
    let streamingText = "";
    store.appendMessage({ id: aiMsgId, role: "ai", content: "", streaming: true });

    try {
      await streamSSE(builderTurnUrl(), {
        session_id: store.sessionId,
        state: store.state === "idle" ? "ask_purpose" : store.state,
        last_answer: answer,
        persona_so_far: store.draftPersona,
      }, ({ event, data }) => {
        if (event === "session") {
          const parsed = JSON.parse(data);
          if (parsed.session_id) store.setSessionId(parsed.session_id);
        } else if (event === "delta") {
          const delta = JSON.parse(data);
          store.applyDelta(delta);
        } else if (event === "message") {
          // 'data' is plain string here (we JSON-encoded it on the server side as a string)
          streamingText = typeof data === "string" ? data.replace(/^"|"$/g, "") : data;
          store.appendMessage({ id: aiMsgId, role: "ai", content: streamingText });
        } else if (event === "question") {
          const q = JSON.parse(data);
          store.setQuestion(q);
        } else if (event === "state") {
          const { next_state } = JSON.parse(data);
          store.setState(next_state);
        } else if (event === "final") {
          const final = JSON.parse(data) as Persona;
          store.setPersona(final);
          // Persist and navigate.
          createPersona(final).then((saved) => {
            store.setPersona(saved);
            router.push(`/p/${saved.slug}`);
          }).catch(() => {
            router.push(`/p/${final.slug}`);
          });
        } else if (event === "error") {
          store.appendMessage({ id: crypto.randomUUID(), role: "ai", content: `(error: ${data})` });
        }
      });
    } finally {
      store.setStreaming(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden p-4">
      <ParticleBg density="subtle" />
      <div className="relative z-10 grid h-[calc(100vh-2rem)] grid-cols-1 gap-4 md:grid-cols-[420px_1fr]">
        <section className="glass overflow-hidden rounded-2xl">
          <ChatPanel onAnswer={(a) => runTurn(a)} />
        </section>
        <section className="overflow-hidden">
          <PreviewPanel />
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Fix `message` SSE encoding to be plain string**

The server currently JSON-encodes the `ai_message` string (so it arrives as `"hello"`). Let's update the server to send plain text for the `message` event, so the frontend doesn't have to strip quotes.

Edit `backend/routes/builder.py`. Change the `message` line in `gen()`:

```python
            yield _sse("message", response.ai_message)
```

to:

```python
            yield f"event: message\ndata: {response.ai_message}\n\n"
```

(Bypasses the JSON encoder for this one event so the body is the raw string.)

Then in `frontend/app/build/page.tsx`, simplify:

```ts
        } else if (event === "message") {
          streamingText = data;
          store.appendMessage({ id: aiMsgId, role: "ai", content: streamingText });
        }
```

- [ ] **Step 7: Verify the end-to-end builder flow**

Restart backend + frontend. Open http://localhost:3000/build. Expected:

1. Particles animate, split-screen visible (chat on left, preview on right).
2. First AI message arrives shortly after page load with the "purpose" question.
3. Clicking an option triggers the next turn; preview panel updates as `meta`/`hero`/`theme` fields arrive in deltas.
4. After 8 turns, the page navigates to `/p/<slug>` showing your generated persona.

If Groq returns malformed responses occasionally, the orchestrator's one retry covers most cases. If a turn fails twice, the `(error: ...)` message appears in chat and you can refresh to start over.

- [ ] **Step 8: Commit**

```powershell
git add frontend/app/build/ frontend/components/builder/ backend/routes/builder.py frontend/app/build/page.tsx
git commit -m "feat: builder split-screen UI with chat, preview, FSM-driven turns and persistence"
```

---

## Phase E — Polish & Docs

### Task 18: README with run instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
# PersonaOn AI Persona Prototype

A locally-running prototype that uses Groq to generate AI-powered persona profile pages. Built with Next.js 15 + Flask.

See the design doc: [docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md](docs/superpowers/specs/2026-05-28-personaon-ai-persona-prototype-design.md)

## Requirements

- Node.js 20+
- Python 3.11+
- A [Groq API key](https://console.groq.com/keys) (free tier works for the prototype)

## Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit backend\.env and put your real GROQ_API_KEY in it.
```

### 2. Frontend

```powershell
cd ..\frontend
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

- **Landing page** (`/`): brand showcase, particles, hero.
- **Build flow** (`/build`): the conversational AI builder. ~8 questions, ends at a generated persona page.
- **Seeded example** (`/p/sai-deekshith-badam-2`): persona rendered from the seed data, with a working AI chat in the hero.

## Architecture

- `frontend/` — Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Framer Motion, tsparticles, Zustand.
- `backend/` — Flask + SQLAlchemy + SQLite + Groq SDK.
- Shared Persona JSON schema is the contract between the AI builder output and the renderer input.

## Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

Frontend has no test suite in this prototype (per spec).

## Troubleshooting

- **"GROQ_API_KEY is not set"** — edit `backend/.env` and add a real key.
- **CORS errors in browser** — confirm `CORS_ORIGINS=http://localhost:3000` in `backend/.env`.
- **`Activate.ps1` blocked** — `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (once, as your user).
- **`pip install groq` fails on Python 3.13** — use 3.11 or 3.12.
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: README with setup and run instructions"
```

- [ ] **Step 3: Final smoke verification**

Full path:

1. Backend running, frontend running, real Groq key in `.env`.
2. Visit `/` — landing renders with particles + gradient hero. ✅
3. Visit `/p/sai-deekshith-badam-2` — seeded persona renders with hero chat. Send "What do you build?" — tokens stream. ✅
4. Visit `/build` — builder loads, asks purpose, answer flows through ~8 questions, ends on a generated persona page. ✅

Capture screenshots of all four states for your portfolio if you want.

- [ ] **Step 4: Tag**

```powershell
git tag -a v0.1-prototype -m "M1 prototype: AI persona generation end-to-end"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Implemented in |
|---|---|
| §3 Architecture (two-tier Next + Flask + SQLite) | Tasks 2, 3, 7 |
| §4 Three surfaces (`/`, `/build`, `/p/[slug]`) | Tasks 5, 17, 9 |
| §5 Builder FSM (~8 questions, structured turns) | Tasks 12, 13, 14 |
| §6 Persona JSON schema (frontend types + Pydantic) | Task 6 |
| §7 Flask API (4 routes + healthz) | Tasks 2, 8, 14, 15 |
| §8 SQLite + 2 tables + seed | Task 7 |
| §9 Groq client, prompts, validation+retry | Tasks 11, 12, 13 |
| §10 Frontend state (Zustand), live preview, FX, brand | Tasks 3, 4, 16, 17 |
| §11 Folder layout | Mirrored across all tasks |
| §12 Env vars | Tasks 2, 3 |
| §13 Local run docs | Task 18 |
| §15 Success criteria (full smoke) | Task 18 Step 3 |

No gaps.

**Placeholder scan:** No "TBD" / "implement later" / "similar to Task N" markers. Each step has either complete code or an exact verification command.

**Type consistency check:** Persona / Section / Hero / Theme field names match between `frontend/lib/types.ts` (Task 6) and `backend/ai/schemas.py` (Task 6) and the seed JSON (Task 7). FSM state names match between `STATES` in `orchestrator.py` (Task 12), the prompts directory layout (Task 13), and `BuilderState` in `store.ts` (Task 16). SSE event names match between `routes/builder.py` (Task 14) and the consumer in `app/build/page.tsx` (Task 17 — including the message-encoding fix in Step 6).

Plan is ready.
