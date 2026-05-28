import { GlassCard } from "@/components/fx/GlassCard";
import type { Persona } from "@/lib/types";

export function AboutSection({ persona, body }: { persona: Persona; body: string }) {
  const isBento = persona.meta.layout_kind === "bento";
  return (
    <GlassCard className={isBento ? "md:col-span-4 p-8" : "p-8"}>
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">About</h2>
      <p className="mt-4 text-balance text-lg leading-relaxed text-white/85">{body}</p>
    </GlassCard>
  );
}
