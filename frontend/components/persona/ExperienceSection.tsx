import { GlassCard } from "@/components/fx/GlassCard";
import type { ExperienceItem } from "@/lib/types";

export function ExperienceSection({ items }: { items: ExperienceItem[] }) {
  return (
    <div className="md:col-span-3">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Experience</h2>
      <div className="mt-4 space-y-3">
        {items.map((e, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{e.role}</div>
                <div className="text-xs text-white/60">{e.organization}</div>
              </div>
              <div className="text-xs text-white/45">
                {e.start}{e.end ? ` — ${e.end}` : " — Present"}
              </div>
            </div>
            {e.summary && <p className="mt-3 text-sm text-white/70">{e.summary}</p>}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
