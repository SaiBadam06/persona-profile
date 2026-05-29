"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  MapPin,
  Quote,
  Sparkles,
} from "lucide-react";
import { SOCIAL_ICON } from "@/components/icons";
import { PublicChatPreview } from "./PublicChatPreview";
import { cn } from "@/lib/utils";
import type { ExtractedFacts, GeneratedProfile, PublicSection } from "@/lib/types";

type Device = "desktop" | "mobile";

// "Classic" PersonaOn document — single-page and multi-page blue/white layout.

const MULTI_PAGES = ["Overview", "Work", "Services", "Ask Me", "Contact"] as const;
type MultiPage = (typeof MULTI_PAGES)[number];

const HERO_BG: Record<GeneratedProfile["visualStyle"], string> = {
  "clean-corporate": "bg-gradient-to-b from-accent/60 to-background",
  "modern-gradient": "brand-gradient text-white",
  editorial: "bg-foreground text-background",
  "minimal-mono": "bg-secondary",
  "warm-rounded": "bg-gradient-to-b from-[color:oklch(0.95_0.04_245)] to-background",
};

export function ProfileDocument({
  profile,
  facts,
  device = "desktop",
}: {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  device?: Device;
}) {
  const [page, setPage] = useState<MultiPage>("Overview");
  const isMulti = profile.layout === "multi";
  const has = (s: PublicSection) => profile.sections.includes(s);
  const onDark =
    profile.visualStyle === "modern-gradient" || profile.visualStyle === "editorial";

  const first = profile.name.split(" ")[0] || "me";
  const avatarRadius =
    profile.avatarShape === "square" ? "1rem" : profile.avatarShape === "rounded" ? "1.75rem" : "9999px";
  const avatarSize = device === "mobile" ? 128 : 184; // ~2 inch
  const docFont =
    profile.font === "serif"
      ? "'Playfair Display', Georgia, serif"
      : profile.font === "mono"
        ? "var(--font-geist-mono), monospace"
        : undefined;

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  function handleCta(kind: "chat" | "booking" | "contact") {
    if (isMulti) {
      setPage(kind === "chat" ? "Ask Me" : "Contact");
    } else {
      scrollTo(kind === "chat" ? "po-chat" : "po-contact");
    }
  }

  // Section nav (single-page anchors / multi-page is handled separately).
  const navItems = [
    { id: "po-about", label: "About", show: has("About") },
    { id: "po-experience", label: "Experience", show: has("Experience") && profile.experience.length > 0 },
    { id: "po-projects", label: "Projects", show: has("Projects") && profile.projects.length > 0 },
    { id: "po-services", label: "Services", show: has("Services") && profile.services.length > 0 },
    { id: "po-testimonials", label: "Testimonials", show: has("Testimonials") && profile.testimonials.length > 0 },
    { id: "po-faq", label: "FAQ", show: has("FAQ") && profile.faq.length > 0 },
    { id: "po-chat", label: `Chat with ${first}`, show: has("Chat") },
    { id: "po-contact", label: "Contact", show: true },
  ].filter((n) => n.show);

  const hero = (
    <header className={cn("px-6 py-10 sm:px-10 sm:py-14", HERO_BG[profile.visualStyle])}>
      {profile.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className={cn("mb-5 object-cover ring-2", onDark ? "ring-white/25" : "ring-border")}
          style={{ width: avatarSize, height: avatarSize, borderRadius: avatarRadius }}
        />
      )}
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          onDark ? "bg-white/15 text-white" : "bg-card text-primary ring-1 ring-border"
        )}
      >
        <Sparkles className="size-3.5" /> {profile.hero.eyebrow}
      </span>
      <h1
        className={cn(
          "mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-balance",
          device === "mobile" && "text-2xl"
        )}
      >
        {profile.hero.title}
      </h1>
      <p className={cn("mt-3 max-w-xl text-base leading-relaxed", onDark ? "text-white/80" : "text-muted-foreground")}>
        {profile.hero.subtitle}
      </p>
      <p className={cn("mt-3 flex items-center gap-1.5 text-sm", onDark ? "text-white/70" : "text-muted-foreground")}>
        <MapPin className="size-3.5" /> {profile.location}
      </p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button
          onClick={() => handleCta(profile.hero.primaryCta.kind)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
            onDark ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {profile.hero.primaryCta.kind === "booking" && <CalendarCheck className="size-4" />}
          {profile.hero.primaryCta.label}
        </button>
        {profile.hero.secondaryCta && (
          <button
            onClick={() => handleCta(profile.hero.secondaryCta!.kind)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
              onDark ? "border-white/30 text-white hover:bg-white/10" : "border-border bg-card hover:bg-accent"
            )}
          >
            {profile.hero.secondaryCta.label}
          </button>
        )}
      </div>

      {profile.hero.stats.length > 0 && (
        <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
          {profile.hero.stats.map((s) => (
            <div
              key={s.label}
              className={cn("rounded-xl p-3", onDark ? "bg-white/10" : "bg-card ring-1 ring-border")}
            >
              <p className="text-lg font-semibold">{s.value}</p>
              <p className={cn("text-[11px] leading-tight", onDark ? "text-white/70" : "text-muted-foreground")}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </header>
  );

  const about = has("About") && (
    <Section title={profile.about.heading} id="po-about">
      <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        {profile.about.body}
      </p>
      {profile.highlights.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {profile.highlights.map((h) => (
            <div key={h.id} className="rounded-xl border border-border bg-card p-4">
              <p className="brand-gradient-text text-2xl font-bold">{h.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{h.caption}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        {facts.skills.map((s) => (
          <span key={s.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            {s.label}
          </span>
        ))}
      </div>
    </Section>
  );

  const experience = has("Experience") && profile.experience.length > 0 && (
    <Section title="Experience" id="po-experience">
      <div className="space-y-3">
        {profile.experience.map((w) => (
          <div key={w.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-medium">
                {w.role} <span className="text-muted-foreground">· {w.company}</span>
              </p>
              <span className="text-xs text-muted-foreground">{w.period}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.summary}</p>
          </div>
        ))}
      </div>
    </Section>
  );

  const projects = has("Projects") && profile.projects.length > 0 && (
    <Section title="Projects" id="po-projects">
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.projects.map((p) => (
          <div key={p.id} className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
            <div className="flex items-center justify-between">
              <p className="font-medium">{p.name}</p>
              <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );

  const services = has("Services") && profile.services.length > 0 && (
    <Section title="Services" id="po-services">
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.services.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{s.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );

  const testimonials = has("Testimonials") && profile.testimonials.length > 0 && (
    <Section title="What people say" id="po-testimonials">
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.testimonials.map((t) => (
          <figure key={t.id} className="rounded-xl border border-border bg-card p-4">
            <Quote className="size-5 text-primary/40" />
            <blockquote className="mt-2 text-sm leading-relaxed">{t.quote}</blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              {t.author} · {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );

  const faq = has("FAQ") && profile.faq.length > 0 && (
    <Section title="FAQ" id="po-faq">
      <div className="space-y-2">
        {profile.faq.map((f) => (
          <details key={f.id} className="group rounded-xl border border-border bg-card p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              {f.q}
              <ChevronRight className="size-4 text-muted-foreground transition group-open:rotate-90" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );

  const chat = has("Chat") && (
    <Section title={`Ask ${profile.name.split(" ")[0]} anything`} id="po-chat">
      <PublicChatPreview profile={profile} facts={facts} />
    </Section>
  );

  const contact = (
    <Section title="Get in touch" id="po-contact">
      {profile.booking.enabled && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl brand-gradient p-4 text-white">
          <div>
            <p className="font-semibold">{profile.booking.label}</p>
            <p className="text-sm text-white/80">{profile.booking.note}</p>
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-primary">
            <CalendarCheck className="size-4" /> Book now
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {profile.contact.socials.map((l) => {
          const Icon = SOCIAL_ICON[l.kind];
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-accent"
            >
              <Icon className="size-4 text-primary" /> {l.label}
            </a>
          );
        })}
      </div>
    </Section>
  );

  if (isMulti) {
    const pageContent: Record<MultiPage, React.ReactNode> = {
      Overview: (<>{about}{testimonials}</>),
      Work: (<>{experience}{projects}</>),
      Services: (<>{services}{faq}</>),
      "Ask Me": chat,
      Contact: contact,
    };
    const visiblePages = MULTI_PAGES.filter((p) => {
      if (p === "Work") return !!experience || !!projects;
      if (p === "Services") return !!services || !!faq;
      if (p === "Ask Me") return has("Chat");
      return true;
    });

    return (
      <div className="min-h-full bg-background" style={{ fontFamily: docFont }}>
        {hero}
        <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-y border-border bg-card/90 px-4 py-2 backdrop-blur">
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                page === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {p}
            </button>
          ))}
        </nav>
        <div className="pb-10">{pageContent[page]}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-10" style={{ fontFamily: docFont }}>
      {hero}
      {navItems.length > 1 && (
        <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-y border-border bg-card/90 px-4 py-2 backdrop-blur">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
        </nav>
      )}
      {about}
      {experience}
      {services}
      {projects}
      {testimonials}
      {faq}
      {chat}
      {contact}
    </div>
  );
}

const Section = ({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="border-t border-border px-6 py-8 sm:px-10">
    <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
    {children}
  </section>
);
