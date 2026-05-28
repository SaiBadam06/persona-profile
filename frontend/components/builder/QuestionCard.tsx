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
