"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Code2,
  Eye,
  Flame,
  Gem,
  Heart,
  LayoutDashboard,
  Magnet,
  Megaphone,
  Minus,
  Newspaper,
  Palette,
  Rocket,
  Scroll,
  Smile,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateMockup } from "./TemplateMockup";
import { cn } from "@/lib/utils";
import type {
  CustomizationAnswers,
  FontChoice,
  Goal,
  LayoutKind,
  ProfileTheme,
  PublicSection,
  Tone,
  VisualStyle,
} from "@/lib/types";

const THEME_FONT: Record<ProfileTheme, FontChoice> = {
  ai: "mixed",
  editorial: "mixed",
  "saas-card": "sans",
  executive: "mixed",
  academic: "serif",
  classic: "sans",
};

const FONT_OPTIONS: { value: FontChoice; label: string; hint: string }[] = [
  { value: "mixed", label: "Editorial", hint: "Serif headings + clean body" },
  { value: "sans", label: "Modern", hint: "Clean sans throughout" },
  { value: "serif", label: "Classic", hint: "Elegant serif throughout" },
  { value: "mono", label: "Mono", hint: "Technical monospace" },
];

const THEMES: {
  value: ProfileTheme;
  label: string;
  desc: string;
  preview: React.ReactNode;
}[] = [
  {
    value: "ai",
    label: "✨ AI-designed",
    desc: "Unique layout the AI invents for you",
    preview: (
      <span style={{ display: "block", height: "100%", background: "linear-gradient(135deg,#101317,#2563eb 70%,#0ea5e9)", padding: 6, position: "relative" }}>
        <span style={{ display: "block", width: "55%", height: 6, background: "#ffffffdd", borderRadius: 2 }} />
        <span style={{ display: "flex", gap: 3, marginTop: 5 }}>
          <span style={{ flex: 2, height: 16, background: "#ffffff33", borderRadius: 3 }} />
          <span style={{ flex: 1, height: 16, background: "#ffffff22", borderRadius: 3 }} />
        </span>
        <span style={{ position: "absolute", top: 4, right: 5, fontSize: 11 }}>✦</span>
      </span>
    ),
  },
  {
    value: "editorial",
    label: "Editorial",
    desc: "Broadsheet, serif headline, 3-column",
    preview: (
      <span style={{ display: "block", background: "#fff", height: "100%", padding: 6 }}>
        <span style={{ display: "block", fontFamily: "'Playfair Display',serif", fontSize: 13, color: "#0f0f0e", lineHeight: 1 }}>Aa</span>
        <span style={{ display: "flex", gap: 3, marginTop: 5 }}>
          <span style={{ flex: 1, height: 14, background: "#0f0f0e08", borderRight: "1px solid #0f0f0e14" }} />
          <span style={{ flex: 1, height: 14, background: "#0f0f0e08", borderRight: "1px solid #0f0f0e14" }} />
          <span style={{ flex: 1, height: 14, background: "#0f0f0e08" }} />
        </span>
      </span>
    ),
  },
  {
    value: "saas-card",
    label: "SaaS Card",
    desc: "Profile card, cover, stats",
    preview: (
      <span style={{ display: "block", background: "#f4f2ef", height: "100%", padding: 6 }}>
        <span style={{ display: "block", height: 10, background: "#0f0f0e", borderRadius: 3 }} />
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: -5, paddingLeft: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#5e3570", border: "2px solid #fff" }} />
          <span style={{ flex: 1, height: 4, marginTop: 6, background: "#0f0f0e20", borderRadius: 2 }} />
        </span>
      </span>
    ),
  },
  {
    value: "executive",
    label: "Executive",
    desc: "Dark hero, big stats, timeline",
    preview: (
      <span style={{ display: "block", background: "#f9f8f6", height: "100%" }}>
        <span style={{ display: "block", height: 22, background: "#0f0f0e", padding: 5 }}>
          <span style={{ display: "block", width: "55%", height: 5, background: "#ffffff55", borderRadius: 2 }} />
        </span>
        <span style={{ display: "flex", gap: 3, padding: 4 }}>
          <span style={{ flex: 1, height: 6, background: "#0f0f0e14", borderRadius: 2 }} />
          <span style={{ flex: 1, height: 6, background: "#0f0f0e14", borderRadius: 2 }} />
        </span>
      </span>
    ),
  },
  {
    value: "academic",
    label: "Academic",
    desc: "Research CV, serif, publications",
    preview: (
      <span style={{ display: "block", background: "#fff", height: "100%", padding: 6, borderTop: "2px solid #0f0f0e" }}>
        <span style={{ display: "block", fontFamily: "'Playfair Display',serif", fontSize: 11, color: "#0f0f0e", lineHeight: 1 }}>Aa.</span>
        <span style={{ display: "block", height: 3, width: "80%", marginTop: 5, background: "#0f0f0e14" }} />
        <span style={{ display: "block", height: 3, width: "60%", marginTop: 3, background: "#0f0f0e14" }} />
        <span style={{ display: "block", height: 3, width: "70%", marginTop: 3, background: "#0f0f0e14" }} />
      </span>
    ),
  },
  {
    value: "classic",
    label: "Classic",
    desc: "PersonaOn blue/white, single or multi",
    preview: (
      <span style={{ display: "block", height: "100%", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", padding: 6 }}>
        <span style={{ display: "block", width: "60%", height: 6, background: "#ffffffcc", borderRadius: 2 }} />
        <span style={{ display: "block", width: "40%", height: 4, marginTop: 4, background: "#ffffff88", borderRadius: 2 }} />
      </span>
    ),
  },
];

interface Props {
  answers: CustomizationAnswers;
  onChange: (patch: Partial<CustomizationAnswers>) => void;
  onBack: () => void;
  onGenerate: () => void;
}

const LAYOUTS: { value: LayoutKind; label: string; desc: string; icon: LucideIcon }[] = [
  { value: "single", label: "Single page", desc: "One scrolling page — fast to read", icon: Scroll },
  { value: "multi", label: "Multi-page", desc: "Overview, Work, Services, Ask Me, Contact", icon: LayoutDashboard },
];

const GOALS: { value: Goal; label: string; icon: LucideIcon }[] = [
  { value: "get-hired", label: "Get hired", icon: Briefcase },
  { value: "sell-services", label: "Sell services", icon: BadgeDollarSign },
  { value: "capture-leads", label: "Capture leads", icon: Magnet },
  { value: "build-authority", label: "Build authority", icon: Megaphone },
  { value: "creator", label: "Creator profile", icon: Palette },
  { value: "founder", label: "Founder story", icon: Rocket },
];

const TONES: { value: Tone; label: string; icon: LucideIcon }[] = [
  { value: "professional", label: "Professional", icon: Building2 },
  { value: "warm", label: "Warm", icon: Heart },
  { value: "bold", label: "Bold", icon: Flame },
  { value: "technical", label: "Technical", icon: Code2 },
  { value: "minimal", label: "Minimal", icon: Minus },
  { value: "premium", label: "Premium", icon: Gem },
];

const STYLES: { value: VisualStyle; label: string; swatch: string }[] = [
  { value: "clean-corporate", label: "Clean corporate", swatch: "linear-gradient(135deg,#2563eb,#1d4ed8)" },
  { value: "modern-gradient", label: "Modern gradient", swatch: "linear-gradient(135deg,#2563eb,#7c3aed,#0ea5e9)" },
  { value: "editorial", label: "Editorial", swatch: "linear-gradient(135deg,#0f172a,#334155)" },
  { value: "minimal-mono", label: "Minimal mono", swatch: "linear-gradient(135deg,#e2e8f0,#94a3b8)" },
  { value: "warm-rounded", label: "Warm rounded", swatch: "linear-gradient(135deg,#3b82f6,#60a5fa)" },
];

const TEMPLATE_BEST: Record<ProfileTheme, string> = {
  ai: "A one-of-a-kind page our AI art-directs for you — its own palette, type, and section order. Pick this to stand out.",
  editorial: "Broadsheet / magazine feel: serif headlines, multi-column. Great for writers, founders, and storytellers.",
  "saas-card": "A clean product-style profile card with stats and tidy sections. Great for PMs, operators, and engineers.",
  executive: "Bold dark hero with big stats and a timeline. Great for senior leaders, consultants, and founders.",
  academic: "Research-CV style with structured sections. Great for researchers, academics, and domain experts.",
  classic: "PersonaOn's clean blue/white layout (single or multi-page). A versatile, safe default for anyone.",
};

const SECTIONS: PublicSection[] = [
  "About",
  "Experience",
  "Projects",
  "Services",
  "Testimonials",
  "FAQ",
  "Booking",
  "Chat",
];

export function CustomizationWizard({ answers, onChange, onBack, onGenerate }: Props) {
  const [previewTheme, setPreviewTheme] = useState<ProfileTheme | null>(null);

  const toggleSection = (s: PublicSection) => {
    const has = answers.publicSections.includes(s);
    onChange({
      publicSections: has
        ? answers.publicSections.filter((x) => x !== s)
        : [...answers.publicSections, s],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Customize your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A few choices shape the design, copy, layout, and how the AI chat behaves.
        </p>
      </div>

      <section className="panel rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </span>
          <h3 className="text-sm font-semibold">Choose a design template</h3>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            Designed by the PersonaOn team
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES.map((t) => {
            const active = answers.theme === t.value;
            return (
              <div
                key={t.value}
                className={cn(
                  "overflow-hidden rounded-xl border transition",
                  active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                )}
              >
                <button
                  onClick={() => onChange({ theme: t.value, font: THEME_FONT[t.value] })}
                  className="block w-full text-left"
                >
                  <span className="block h-16 w-full overflow-hidden border-b border-border">
                    {t.preview}
                  </span>
                  <span className="block px-2.5 pt-2">
                    <span className="block text-xs font-semibold">{t.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                      {t.desc}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => setPreviewTheme(t.value)}
                  className="mt-1.5 flex w-full items-center justify-center gap-1.5 border-t border-border py-1.5 text-[11px] font-medium text-primary transition hover:bg-accent"
                >
                  <Eye className="size-3" /> Preview
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {THEMES.find((t) => t.value === answers.theme)?.label ?? "Template"}:
          </span>{" "}
          {TEMPLATE_BEST[answers.theme]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted-foreground">Font:</span>
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ font: f.value })}
              title={f.hint}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                answers.font === f.value
                  ? "border-primary bg-accent text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <QCard n={1} title="Single page or multi-page? (Classic design only)">
        <div className="grid gap-3 sm:grid-cols-2">
          {LAYOUTS.map((l) => (
            <BigOption
              key={l.value}
              icon={l.icon}
              label={l.label}
              desc={l.desc}
              active={answers.layout === l.value}
              onClick={() => onChange({ layout: l.value })}
            />
          ))}
        </div>
      </QCard>

      <QCard n={2} title="What's the goal of this profile?">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {GOALS.map((g) => (
            <PillOption
              key={g.value}
              icon={g.icon}
              label={g.label}
              active={answers.goal === g.value}
              onClick={() => onChange({ goal: g.value })}
            />
          ))}
        </div>
      </QCard>

      <QCard n={3} title="What tone should it use?">
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {TONES.map((t) => (
            <PillOption
              key={t.value}
              icon={t.icon}
              label={t.label}
              active={answers.tone === t.value}
              onClick={() => onChange({ tone: t.value })}
              compact
            />
          ))}
        </div>
      </QCard>

      <QCard n={4} title="Which sections should be public?">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const active = answers.publicSections.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground hover:border-primary/40"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </QCard>

      <QCard n={5} title="AI chat behavior">
        <div className="space-y-2.5">
          <ToggleRow
            label="Answer only from verified sources"
            desc="The chat won't speculate beyond LinkedIn, resume & website."
            checked={answers.chatVerifiedOnly}
            onChange={(v) => onChange({ chatVerifiedOnly: v })}
          />
          <ToggleRow
            label="Collect leads in chat"
            desc="After a useful answer, ask for the visitor's email."
            checked={answers.chatCollectLeads}
            onChange={(v) => onChange({ chatCollectLeads: v })}
          />
          <ToggleRow
            label="Show booking CTA"
            desc="Add a 'Book a call' button to the hero and chat."
            checked={answers.bookingCta}
            onChange={(v) => onChange({ bookingCta: v })}
          />
        </div>
      </QCard>

      <QCard n={6} title="Visual style">
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ visualStyle: s.value })}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                answers.visualStyle === s.value
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span
                className="mb-2 block h-10 w-full rounded-lg"
                style={{ background: s.swatch }}
              />
              <span className="text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </QCard>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-3 backdrop-blur">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ArrowLeft className="size-4" /> Facts
        </Button>
        <Button size="lg" onClick={onGenerate}>
          <Sparkles className="size-4" /> Generate my page
        </Button>
      </div>

      {previewTheme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewTheme(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {THEMES.find((t) => t.value === previewTheme)?.label} — preview
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {TEMPLATE_BEST[previewTheme]}
                </p>
              </div>
              <button
                onClick={() => setPreviewTheme(null)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <TemplateMockup theme={previewTheme} height={520} />
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button
                onClick={() => setPreviewTheme(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-accent"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onChange({ theme: previewTheme, font: THEME_FONT[previewTheme] });
                  setPreviewTheme(null);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {n}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BigOption({
  icon: Icon,
  label,
  desc,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition",
        active
          ? "border-primary bg-accent ring-2 ring-primary/20"
          : "border-border hover:border-primary/40"
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function PillOption({
  icon: Icon,
  label,
  active,
  onClick,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        compact ? "justify-center" : "",
        active
          ? "border-primary bg-accent text-primary ring-1 ring-primary/20"
          : "border-border bg-secondary/60 hover:border-primary/40"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
