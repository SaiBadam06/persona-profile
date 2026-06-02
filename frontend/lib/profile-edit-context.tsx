"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ChatMessage, GeneratedProfile } from "./types";

/**
 * Durable chat state. Lifted to the page level on the published page so the
 * conversation survives a theme/layout swap (which remounts the theme subtree,
 * and with it the embedded chat). `input` stays local to the chat component —
 * it's transient and lifting it would re-render the whole page on every keystroke.
 */
export interface PersonaChatStore {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  thinking: boolean;
  setThinking: Dispatch<SetStateAction<boolean>>;
  leadDone: boolean;
  setLeadDone: Dispatch<SetStateAction<boolean>>;
  answered: number;
  setAnswered: Dispatch<SetStateAction<number>>;
}

/** Build a chat store. Used by the provider (lifted) and as a local fallback. */
export function useChatStore(greeting: string): PersonaChatStore {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "greeting", role: "assistant", text: greeting },
  ]);
  const [thinking, setThinking] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [answered, setAnswered] = useState(0);
  return { messages, setMessages, thinking, setThinking, leadDone, setLeadDone, answered, setAnswered };
}

interface ProfileEditContextValue {
  /** True where the page may be edited by chat (published page), false in read-only previews. */
  editable: boolean;
  /** Push a full updated profile up to the page that owns the state. No-op when not editable. */
  onProfileChange: (next: GeneratedProfile) => void;
  /** Lifted chat state (published page only). Undefined → chat keeps its own local state. */
  chat?: PersonaChatStore;
}

const ProfileEditContext = createContext<ProfileEditContextValue>({
  editable: false,
  onProfileChange: () => {},
});

/**
 * Wraps the published page so the embedded chat ({@link useProfileEdit}) can
 * apply edits to the live profile and keep its conversation across theme swaps —
 * all without touching any of the theme components.
 */
export function ProfileEditProvider({
  onProfileChange,
  chatGreeting,
  children,
}: {
  onProfileChange?: (next: GeneratedProfile) => void;
  /** When provided, chat state is lifted here (seeded with this greeting). */
  chatGreeting?: string;
  children: ReactNode;
}) {
  const chat = useChatStore(chatGreeting ?? "");
  const value = useMemo<ProfileEditContextValue>(
    () => ({
      editable: !!onProfileChange,
      onProfileChange: onProfileChange ?? (() => {}),
      chat: chatGreeting != null ? chat : undefined,
    }),
    [onProfileChange, chatGreeting, chat]
  );
  return <ProfileEditContext.Provider value={value}>{children}</ProfileEditContext.Provider>;
}

export function useProfileEdit() {
  return useContext(ProfileEditContext);
}
