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
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { answerQuestion } from "@/lib/chat-sim";
import { API_BASE } from "@/lib/config";
import { sendPersonaChat } from "@/lib/persona-chat-client";
import { useChatStore, useProfileEdit } from "@/lib/profile-edit-context";
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

// Shown on the published page to hint that the chat can also restyle the page.
const EDIT_EXAMPLES = ["Make it dark & bold", "Lead with projects"];

export function PublicChatPreview({ profile, facts, className }: Props) {
  const { editable, onProfileChange, chat: liftedChat } = useProfileEdit();
  // Use the page-level chat store when present (so the conversation survives a
  // theme swap); otherwise keep state local (builder preview / demos).
  const localChat = useChatStore(profile.chat.greeting);
  const { messages, setMessages, thinking, setThinking, leadDone, setLeadDone, answered, setAnswered } =
    liftedChat ?? localChat;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const addAssistant = (msg: Omit<ChatMessage, "id" | "role">) =>
    setMessages((m) => [...m, { id: newMsg(), role: "assistant", ...msg }]);

  // Offer lead capture once, after the first answer, when enabled.
  const leadOffer = () => {
    const next = answered + 1;
    setAnswered(next);
    return profile.chat.collectLeads && !leadDone && next >= 1;
  };

  async function ask(question: string) {
    if (!question.trim() || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: newMsg(), role: "user", text: question }]);
    setThinking(true);

    // On the published page the chat can also EDIT the page (or decline
    // off-topic asks). One call returns answer | edit | refuse.
    if (editable) {
      const result = await sendPersonaChat(profile, facts, question);
      if (result) {
        if (result.intent === "edit" && result.updatedProfile) {
          onProfileChange(result.updatedProfile);
          addAssistant({ text: result.reply, edited: true });
        } else if (result.intent === "refuse") {
          addAssistant({ text: result.reply });
        } else {
          addAssistant({ text: result.reply, sources: result.sources, offerLeadCapture: leadOffer() });
        }
        setThinking(false);
        return;
      }
      // null → no key / model failure: fall through to the local sim.
    } else {
      // Read-only preview (e.g. builder): grounded Q&A only.
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, facts, question }),
        });
        const data = await res.json();
        if (res.ok && data.source === "groq" && data.text) {
          addAssistant({ text: data.text, sources: data.sources ?? [], offerLeadCapture: leadOffer() });
          setThinking(false);
          return;
        }
      } catch {
        /* offline / no key — use local fallback */
      }
    }

    const fallback = answerQuestion(question, facts, profile);
    addAssistant({ text: fallback.text, sources: fallback.sources, offerLeadCapture: leadOffer() });
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
        <Avatar name={profile.name} src={profile.avatarUrl} shape={profile.avatarShape} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Chat with {profile.name.split(" ")[0]}
          </p>
          {editable ? (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Wand2 className="size-3 text-primary" /> Ask anything — or tell me to
              restyle this page
            </p>
          ) : profile.chat.verifiedOnly ? (
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
        style={{ minHeight: 360, maxHeight: 520 }}
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
            {m.edited && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent/60 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="size-2.5" /> Updated your page
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

      {/* Suggested questions (+ example edits when the page is editable) */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
          {profile.suggestedQuestions.slice(0, editable ? 3 : 4).map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs transition hover:border-primary/40 hover:bg-accent"
            >
              {q}
            </button>
          ))}
          {editable &&
            EDIT_EXAMPLES.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent/50 px-2.5 py-1 text-xs text-primary transition hover:bg-accent"
              >
                <Wand2 className="size-3" /> {q}
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
          placeholder={
            editable
              ? `Ask about ${profile.name.split(" ")[0]}, or describe a change…`
              : `Ask about ${profile.name.split(" ")[0]}'s work…`
          }
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
