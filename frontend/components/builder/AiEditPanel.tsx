"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { editProfile } from "@/lib/edit-client";
import { cn } from "@/lib/utils";
import type { GeneratedProfile } from "@/lib/types";

const QUICK = [
  { label: "Shorten", instr: "Make all the copy noticeably shorter and tighter — same meaning, fewer words." },
  { label: "Elaborate", instr: "Add a little more useful detail and depth to the about and section copy." },
  { label: "Punchier", instr: "Make the hero and headlines punchier, bolder and more confident." },
  { label: "More formal", instr: "Make the overall tone more formal, polished and professional." },
  { label: "Friendlier", instr: "Make the tone warmer, friendlier and more human/first-person." },
  { label: "Fix grammar", instr: "Fix grammar and spelling and tighten any awkward phrasing." },
];

export function AiEditPanel({
  profile,
  onChange,
}: {
  profile: GeneratedProfile;
  onChange: (p: GeneratedProfile) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(instruction: string, tag: string) {
    if (!instruction.trim() || busy) return;
    setBusy(tag);
    try {
      const updated = await editProfile(profile, instruction);
      onChange(updated);
      if (tag === "custom") setText("");
    } catch {
      /* leave content unchanged on failure */
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wand2 className="size-4" />
        </span>
        <h3 className="text-sm font-semibold">Edit with AI</h3>
        <span className="ml-auto text-xs text-muted-foreground">Rewrites your copy — preview updates live</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => run(q.instr, q.label)}
            disabled={!!busy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:bg-accent disabled:opacity-50",
              busy === q.label && "border-primary text-primary"
            )}
          >
            {busy === q.label ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-primary" />}
            {q.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(text, "custom")}
          placeholder="Or describe a change… e.g. 'make the about more story-driven'"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <button
          onClick={() => run(text, "custom")}
          disabled={!text.trim() || !!busy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {busy === "custom" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          Apply
        </button>
      </div>
    </section>
  );
}
