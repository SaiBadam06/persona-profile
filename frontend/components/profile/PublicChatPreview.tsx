"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Briefcase,
  CalendarCheck,
  Check,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { answerQuestion } from "@/lib/chat-sim";
import { API_BASE } from "@/lib/config";
import { cn } from "@/lib/utils";
import type {
  ChatMessage,
  ChatSource,
  ExtractedFacts,
  GeneratedProfile,
} from "@/lib/types";

interface Props {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  className?: string;
}

const SOURCE_BADGE_ICON = {
  linkedin: Briefcase,
  resume: FileText,
  website: Globe,
  manual: Sparkles,
} as const;

let mid = 0;
const newMsg = () => `m-${mid++}`;

export function PublicChatPreview({ profile, facts, className }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newMsg(), role: "assistant", text: profile.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [answered, setAnswered] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  async function ask(question: string) {
    if (!question.trim() || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: newMsg(), role: "user", text: question }]);
    setThinking(true);

    // Real AI answer grounded in the profile; fall back to the local sim.
    let reply: { text: string; sources?: ChatSource[] } | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, facts, question }),
      });
      const data = await res.json();
      if (res.ok && data.source === "groq" && data.text) {
        reply = { text: data.text, sources: data.sources ?? [] };
      }
    } catch {
      /* offline / no key — use local fallback */
    }
    if (!reply) reply = answerQuestion(question, facts, profile);

    const nextAnswered = answered + 1;
    const offerLead = profile.chat.collectLeads && !leadDone && nextAnswered >= 1;
    setAnswered(nextAnswered);
    setMessages((m) => [
      ...m,
      { id: newMsg(), role: "assistant", text: reply.text, sources: reply.sources, offerLeadCapture: offerLead },
    ]);
    setThinking(false);
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="size-9 shrink-0 object-cover ring-1 ring-border"
            style={{
              borderRadius:
                profile.avatarShape === "square" ? 10 : profile.avatarShape === "rounded" ? 13 : 9999,
            }}
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full brand-gradient text-white">
            <MessageSquare className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Chat with {profile.name.split(" ")[0]}
          </p>
          {profile.chat.verifiedOnly ? (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3 text-primary" /> Answers from verified
              sources
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Ask my AI persona anything
            </p>
          )}
        </div>
        {profile.booking.enabled && (
          <button className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
            <CalendarCheck className="size-3.5" /> Book a meeting
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4"
        style={{ minHeight: 280, maxHeight: 420 }}
      >
        {messages.map((m) => (
          <div key={m.id}>
            <div
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground"
                )}
              >
                {m.text}
              </div>
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                {m.sources.map((s) => (
                  <SourceBadge key={s.kind} source={s} />
                ))}
              </div>
            )}
            {m.offerLeadCapture && !leadDone && (
              <LeadCapture onDone={() => setLeadDone(true)} />
            )}
            {m.offerLeadCapture && leadDone && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-[color:oklch(0.96_0.04_150)] px-3 py-2 text-sm text-[color:var(--success)]">
                <Check className="size-4" /> Thanks — {profile.name.split(" ")[0]}{" "}
                will be in touch.
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-secondary px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
          {profile.suggestedQuestions.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs transition hover:border-primary/40 hover:bg-accent"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${profile.name.split(" ")[0]}'s work…`}
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
          aria-label="Send"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}

function SourceBadge({ source }: { source: ChatSource }) {
  const Icon = SOURCE_BADGE_ICON[source.kind];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Icon className="size-2.5 text-primary" /> {source.label}
    </span>
  );
}

function LeadCapture({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  return (
    <motion.form
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) onDone();
      }}
      className="mt-2 rounded-xl border border-primary/30 bg-accent/60 p-3"
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
        <Mail className="size-3.5 text-primary" /> Want a reply? Leave your email.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Send
        </button>
      </div>
    </motion.form>
  );
}
