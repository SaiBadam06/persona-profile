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
