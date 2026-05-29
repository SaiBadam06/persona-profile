"use client";

import type { CSSProperties } from "react";
import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { initials, type ThemeProps } from "./theme-utils";
import type { GeneratedProfile, LayoutBlock, LayoutSpec } from "@/lib/types";

// AI-invented layout renderer. The model designs `profile.layoutSpec` (palette,
// fonts, density, hero treatment, block order/columns); this safely draws it.
// If no spec is present it synthesises a sensible default so it always renders.

function defaultSpec(profile: GeneratedProfile): LayoutSpec {
  const has = (s: string) => profile.sections.includes(s as never);
  const blocks: LayoutBlock[] = [{ type: "hero" }, { type: "about" }, { type: "stats" }];
  if (has("Experience")) blocks.push({ type: "experience" });
  if (has("Projects")) blocks.push({ type: "projects", columns: 2 });
  if (has("Services")) blocks.push({ type: "services", columns: 2 });
  blocks.push({ type: "skills" });
  if (has("Testimonials")) blocks.push({ type: "testimonials", columns: 2 });
  if (has("FAQ")) blocks.push({ type: "faq" });
  if (has("Chat")) blocks.push({ type: "chat" });
  blocks.push({ type: "contact" });
  return {
    palette: { bg: "#ffffff", surface: "#f6f7f9", ink: "#101317", muted: "#5b636e", accent: "#2563eb", accentInk: "#ffffff" },
    font: "sans", density: "balanced", radius: "soft", heroVariant: "split", blocks,
  };
}

const FONTS = {
  serif: { head: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
  sans: { head: "var(--font-geist-sans), 'DM Sans', system-ui, sans-serif", body: "var(--font-geist-sans), 'DM Sans', system-ui, sans-serif" },
  mono: { head: "var(--font-geist-mono), 'DM Sans', monospace", body: "'DM Sans', system-ui, sans-serif" },
  mixed: { head: "'Playfair Display', Georgia, serif", body: "var(--font-geist-sans), 'DM Sans', sans-serif" },
} as const;

const DENSITY = { airy: { pad: 64, gap: 28 }, balanced: { pad: 44, gap: 20 }, compact: { pad: 28, gap: 14 } } as const;
const RADIUS = { sharp: 0, soft: 12, round: 22 } as const;

// Bento column spans (of a 6-col grid). Tuned to pair into full rows so dense
// auto-flow tiles tightly with minimal empty space.
const SPAN: Record<string, number> = {
  about: 4, stats: 2, skills: 2, services: 4, experience: 6,
  projects: 6, testimonials: 3, faq: 3, quote: 6, chat: 4, contact: 2,
};

export function AiLayout({ profile, facts, device }: ThemeProps) {
  const spec = profile.layoutSpec ?? defaultSpec(profile);
  const { palette: c } = spec;
  const fonts = FONTS[profile.font ?? spec.font];
  const d = DENSITY[spec.density];
  const radius = RADIUS[spec.radius];
  const mobile = device === "mobile";
  const avatarRad =
    profile.avatarShape === "square" ? 18 : profile.avatarShape === "rounded" ? 32 : "9999px";

  const root: CSSProperties = {
    background: c.bg,
    color: c.ink,
    fontFamily: fonts.body,
    // CSS vars consumed by children
    ["--bg" as string]: c.bg,
    ["--surface" as string]: c.surface,
    ["--ink" as string]: c.ink,
    ["--muted" as string]: c.muted,
    ["--accent" as string]: c.accent,
    ["--accentInk" as string]: c.accentInk,
    ["--radius" as string]: `${radius}px`,
    ["--fhead" as string]: fonts.head,
  };

  const sectionPad = mobile ? 20 : d.pad;
  const card: CSSProperties = {
    background: c.surface,
    border: `1px solid ${c.ink}14`,
    borderRadius: radius,
    padding: 16,
  };
  const headingStyle: CSSProperties = { fontFamily: fonts.head, fontSize: mobile ? 20 : 24, fontWeight: 600, color: c.ink, marginBottom: 16, letterSpacing: "-0.01em" };
  const cols = (n?: number) => (mobile ? 1 : Math.min(Math.max(n ?? 1, 1), 3));
  const first = profile.name.split(" ")[0] || "them";

  function Section({ heading, children, span }: { heading?: string; children: React.ReactNode; span?: number }) {
    return (
      <section
        style={{
          gridColumn: mobile ? "span 1" : `span ${span ?? 6}`,
          background: c.surface,
          border: `1px solid ${c.ink}12`,
          borderRadius: radius,
          padding: mobile ? 16 : 22,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 2px rgba(15,23,42,.04), 0 12px 28px -22px rgba(15,23,42,.25)",
        }}
      >
        {heading && (
          <h2 style={{ ...headingStyle, fontSize: mobile ? 17 : 20, marginBottom: 12 }}>{heading}</h2>
        )}
        <div style={{ flex: 1 }}>{children}</div>
      </section>
    );
  }

  const pill = (text: string, i: number) => (
    <span key={i} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 999, background: `${c.accent}1a`, color: c.accent, fontWeight: 500 }}>{text}</span>
  );

  function Hero() {
    const v = spec.heroVariant;
    const dark = v === "dark-band";
    const bg = dark ? c.ink : c.bg;
    const ink = dark ? c.bg : c.ink;
    const muted = dark ? `${c.bg}99` : c.muted;
    const centered = v === "centered" || v === "minimal";
    const stats = profile.hero.stats.slice(0, 4);

    const ctas = (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22, justifyContent: centered ? "center" : "flex-start" }}>
        <button style={{ background: c.accent, color: c.accentInk, border: "none", borderRadius: radius, padding: "11px 20px", fontWeight: 600, fontSize: 14 }}>
          {profile.hero.primaryCta.label}
        </button>
        {profile.hero.secondaryCta && (
          <button style={{ background: "transparent", color: ink, border: `1px solid ${ink}33`, borderRadius: radius, padding: "11px 20px", fontWeight: 500, fontSize: 14 }}>
            {profile.hero.secondaryCta.label}
          </button>
        )}
      </div>
    );

    const textCol = (
      <div style={{ textAlign: centered ? "center" : "left", maxWidth: centered ? 720 : undefined, margin: centered ? "0 auto" : undefined }}>
        {profile.avatarUrl && (v === "centered" || v === "dark-band" || v === "minimal") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            style={{ width: 132, height: 132, objectFit: "cover", borderRadius: avatarRad, marginBottom: 16, border: `2px solid ${ink}22`, marginLeft: centered ? "auto" : 0, marginRight: centered ? "auto" : 0, display: "block" }}
          />
        )}
        <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.accent, marginBottom: 14 }}>
          {profile.hero.eyebrow}
        </span>
        <h1 style={{ fontFamily: fonts.head, fontSize: mobile ? 32 : v === "minimal" ? 52 : 44, lineHeight: 1.05, letterSpacing: "-0.02em", color: ink, margin: 0 }}>
          {profile.hero.title}
        </h1>
        <p style={{ color: muted, fontSize: mobile ? 15 : 17, lineHeight: 1.55, marginTop: 14, maxWidth: 560, marginLeft: centered ? "auto" : 0, marginRight: centered ? "auto" : 0 }}>
          {profile.hero.subtitle}
        </p>
        {profile.location && <p style={{ color: muted, fontSize: 13, marginTop: 10 }}>{profile.location}</p>}
        {ctas}
      </div>
    );

    const statsBlock = stats.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobile ? 2 : stats.length}, 1fr)`, gap: 12, marginTop: centered ? 34 : 0 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: dark ? `${c.bg}14` : c.surface, border: `1px solid ${ink}14`, borderRadius: radius, padding: 16 }}>
            <div style={{ fontFamily: fonts.head, fontSize: 26, fontWeight: 700, color: ink }}>{s.value}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    );

    const portrait = (
      <div style={{ aspectRatio: "4/5", borderRadius: radius, background: `linear-gradient(150deg, ${c.accent}, ${c.ink})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: radius }} />
        ) : (
          <span style={{ fontFamily: fonts.head, fontSize: 72, color: `${c.bg}cc` }}>{initials(profile.name)}</span>
        )}
      </div>
    );

    return (
      <header style={{ background: bg, padding: `${mobile ? 40 : 64}px ${sectionPad}px` }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {v === "split" && !mobile ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 40, alignItems: "center" }}>
              {textCol}
              {statsBlock || portrait}
            </div>
          ) : v === "side-portrait" && !mobile ? (
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "center" }}>
              {portrait}
              <div>{textCol}{statsBlock}</div>
            </div>
          ) : (
            <div>{textCol}{statsBlock}</div>
          )}
        </div>
      </header>
    );
  }

  function renderBlock(b: LayoutBlock, i: number) {
    switch (b.type) {
      case "hero":
        return <Hero key={i} />;
      case "about":
        return profile.about.body ? (
          <Section key={i} heading={b.heading ?? profile.about.heading} span={SPAN[b.type]}>
            <p style={{ fontSize: mobile ? 15 : 17, lineHeight: 1.7, color: c.muted, maxWidth: 720, fontFamily: spec.font === "serif" ? fonts.head : fonts.body }}>
              {profile.about.body}
            </p>
          </Section>
        ) : null;
      case "stats":
        return profile.hero.stats.length ? (
          <Section key={i} heading={b.heading} span={SPAN[b.type]}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols(b.columns ?? profile.hero.stats.length)}, 1fr)`, gap: 12 }}>
              {profile.hero.stats.map((s) => (
                <div key={s.label} style={card}>
                  <div style={{ fontFamily: fonts.head, fontSize: 28, fontWeight: 700, color: c.accent }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;
      case "skills":
        return facts.skills.length ? (
          <Section key={i} heading={b.heading ?? "Skills"} span={SPAN[b.type]}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{facts.skills.map((s, j) => pill(s.label, j))}</div>
          </Section>
        ) : null;
      case "experience":
        return profile.experience.length ? (
          <Section key={i} heading={b.heading ?? "Experience"} span={SPAN[b.type]}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols(b.columns)}, 1fr)`, gap: 12 }}>
              {profile.experience.map((w) => (
                <div key={w.id} style={card}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{w.role}</div>
                  <div style={{ color: c.accent, fontSize: 12, fontWeight: 600, margin: "2px 0" }}>{w.company}</div>
                  <div style={{ color: c.muted, fontSize: 11, marginBottom: 7 }}>{w.period}</div>
                  <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.6 }}>{w.summary}</div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;
      case "projects":
        return profile.projects.length ? (
          <Section key={i} heading={b.heading ?? "Projects"} span={SPAN[b.type]}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols(b.columns ?? 2)}, 1fr)`, gap: 12 }}>
              {profile.projects.map((p) => (
                <div key={p.id} style={card}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, margin: "6px 0 9px" }}>{p.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {p.tags.map((t, j) => (<span key={j} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${c.ink}0d`, color: c.muted }}>{t}</span>))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;
      case "services":
        return profile.services.length ? (
          <Section key={i} heading={b.heading ?? "Services"} span={SPAN[b.type]}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols(b.columns ?? 2)}, 1fr)`, gap: 12 }}>
              {profile.services.map((s) => (
                <div key={s.id} style={card}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{s.description}</div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;
      case "testimonials":
        return profile.testimonials.length ? (
          <Section key={i} heading={b.heading ?? "What people say"} span={SPAN[b.type]}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols(b.columns ?? 2)}, 1fr)`, gap: 12 }}>
              {profile.testimonials.map((t) => (
                <figure key={t.id} style={{ ...card, margin: 0 }}>
                  <blockquote style={{ fontFamily: fonts.head, fontSize: 16, lineHeight: 1.5, margin: 0 }}>&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption style={{ color: c.muted, fontSize: 12, marginTop: 10 }}>{t.author} · {t.role}</figcaption>
                </figure>
              ))}
            </div>
          </Section>
        ) : null;
      case "faq":
        return profile.faq.length ? (
          <Section key={i} heading={b.heading ?? "FAQ"} span={SPAN[b.type]}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {profile.faq.map((f) => (
                <div key={f.id} style={card}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.q}</div>
                  <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;
      case "quote": {
        const q = profile.testimonials[0]?.quote ?? profile.headline;
        return (
          <Section key={i} span={SPAN[b.type]}>
            <p style={{ fontFamily: fonts.head, fontSize: mobile ? 22 : 30, lineHeight: 1.4, color: c.ink, maxWidth: 820, textAlign: "center", margin: "0 auto", borderLeft: `3px solid ${c.accent}`, paddingLeft: 20, textAlignLast: "left" }}>
              &ldquo;{q}&rdquo;
            </p>
          </Section>
        );
      }
      case "chat":
        return profile.sections.includes("Chat") ? (
          <Section key={i} heading={b.heading ?? `Ask ${first}`} span={SPAN[b.type]}>
            <div style={{ maxWidth: 640 }}>
              <PublicChatPreview profile={profile} facts={facts} />
            </div>
          </Section>
        ) : null;
      case "contact":
        return (
          <Section key={i} heading={b.heading ?? "Get in touch"} span={SPAN[b.type]}>
            {profile.booking.enabled && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", background: c.accent, color: c.accentInk, borderRadius: radius, padding: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{profile.booking.label}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{profile.booking.note}</div>
                </div>
                <button style={{ background: c.accentInk, color: c.accent, border: "none", borderRadius: radius, padding: "9px 16px", fontWeight: 600 }}>Book now</button>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profile.contact.socials.map((l) => {
                const Icon = SOCIAL_ICON[l.kind];
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, ...card, padding: "9px 13px", fontSize: 13, textDecoration: "none", color: c.ink }}>
                    <Icon style={{ width: 15, height: 15, color: c.accent }} /> {l.label}
                  </a>
                );
              })}
            </div>
          </Section>
        );
      default:
        return null;
    }
  }

  const bentoBlocks = spec.blocks.filter((b) => b.type !== "hero");

  return (
    <div style={root}>
      <Hero />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(6, 1fr)",
          gridAutoFlow: "dense",
          gap: d.gap,
          padding: `${d.gap}px ${sectionPad}px ${d.gap + 14}px`,
          alignItems: "stretch",
        }}
      >
        {bentoBlocks.map((b, i) => renderBlock(b, i))}
      </div>
      <div style={{ textAlign: "center", padding: "18px", fontSize: 11, color: c.muted, background: c.bg }}>
        ✦ Layout designed by AI for {profile.name} · PersonaOn
      </div>
    </div>
  );
}
