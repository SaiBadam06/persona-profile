"use client";

import { useEffect, useRef } from "react";
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
  const kicked = useRef(false);

  useEffect(() => {
    if (!kicked.current && store.state === "idle") {
      kicked.current = true;
      runTurn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(answer: string | null) {
    store.setStreaming(true);
    store.setQuestion(null);

    if (answer) {
      store.appendMessage({ id: crypto.randomUUID(), role: "user", content: answer });
    }

    const aiMsgId = crypto.randomUUID();
    store.appendMessage({ id: aiMsgId, role: "ai", content: "", streaming: true });

    try {
      await streamSSE(builderTurnUrl(), {
        session_id: store.sessionId,
        state: store.state === "idle" ? "ask_purpose" : store.state,
        last_answer: answer,
        persona_so_far: store.draftPersona,
      }, ({ event, data }) => {
        if (event === "session") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.session_id) store.setSessionId(parsed.session_id);
          } catch {}
        } else if (event === "delta") {
          try {
            const delta = JSON.parse(data);
            store.applyDelta(delta);
          } catch {}
        } else if (event === "message") {
          store.updateMessage(aiMsgId, data);
        } else if (event === "question") {
          try {
            const q = JSON.parse(data);
            store.setQuestion(q);
          } catch {}
        } else if (event === "state") {
          try {
            const { next_state } = JSON.parse(data);
            store.setState(next_state);
          } catch {}
        } else if (event === "final") {
          try {
            const final = JSON.parse(data) as Persona;
            store.setPersona(final);
            createPersona(final)
              .then((saved) => {
                store.setPersona(saved);
                router.push(`/p/${saved.slug}`);
              })
              .catch(() => {
                router.push(`/p/${final.slug}`);
              });
          } catch {}
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
