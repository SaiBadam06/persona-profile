import { GlassCard } from "@/components/fx/GlassCard";
import type { ProjectItem } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

export function ProjectsSection({ items }: { items: ProjectItem[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Projects</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((p, i) => (
          <GlassCard key={i} className="group relative overflow-hidden p-6 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{p.title}</div>
                <p className="mt-2 text-sm text-white/65">{p.description}</p>
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/65">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 p-2 text-white/70 transition group-hover:border-white/20 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
