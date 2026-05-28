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
