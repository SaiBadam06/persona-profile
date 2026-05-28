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
    } catch {
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
