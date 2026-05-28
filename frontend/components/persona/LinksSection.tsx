import { GlassCard } from "@/components/fx/GlassCard";
import type { LinkItem } from "@/lib/types";
import { Code, Briefcase, Globe, Mail, AtSign } from "lucide-react";

const ICONS = {
  github: Code,
  linkedin: Briefcase,
  website: Globe,
  email: Mail,
  x: AtSign,
} as const;

export function LinksSection({ items }: { items: LinkItem[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">Find me</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((l, i) => {
          const Icon = l.icon ? ICONS[l.icon] : Globe;
          return (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
