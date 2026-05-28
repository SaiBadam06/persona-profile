import { GlassCard } from "@/components/fx/GlassCard";
import type { Testimonial } from "@/lib/types";

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  return (
    <div className="md:col-span-6">
      <h2 className="text-xs uppercase tracking-[0.18em] text-white/50">What people say</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((t, i) => (
          <GlassCard key={i} className="p-6">
            <p className="text-base italic text-white/85">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 text-sm text-white/65">
              <span className="font-semibold text-white/85">{t.author}</span>
              {t.role && <span className="text-white/50"> — {t.role}</span>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
