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
  updateMessage: (id: string, content: string) => void;
  setQuestion: (q: BuilderQuestion | null) => void;
  setStreaming: (v: boolean) => void;
  setPersona: (p: Persona) => void;
  reset: () => void;
};

function deepMerge<T extends Record<string, unknown>>(a: T, b: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    if (v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur)) {
      out[k] = deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
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
  updateMessage: (id, content) =>
    set((cur) => ({ chat: cur.chat.map((m) => (m.id === id ? { ...m, content } : m)) })),
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
