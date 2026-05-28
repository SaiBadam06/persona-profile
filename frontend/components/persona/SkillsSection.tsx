import { GlassCard } from "@/components/fx/GlassCard";
import type { SkillGroup } from "@/lib/types";

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="md:col-span-3">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Skills</h2>
      <div className="mt-4 space-y-3">
        {groups.map((g, i) => (
          <GlassCard key={i} className="p-5">
            <div className="text-sm font-semibold text-white/90">{g.label}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/75">
                  {s}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
