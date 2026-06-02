"use client";

import { useState } from "react";
import type { ExtractedFacts, GeneratedProfile, PublicSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProfileDocument } from "@/components/profile/ProfileDocument";
import { ThemeEditorial } from "./ThemeEditorial";
import { ThemeSaasCard } from "./ThemeSaasCard";
import { ThemeExecutive } from "./ThemeExecutive";
import { ThemeAcademic } from "./ThemeAcademic";
import { AiLayout } from "./AiLayout";

interface Props {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  device?: "desktop" | "mobile";
}

/** Render a profile in the chosen template (single-scroll). */
function renderTheme(
  profile: GeneratedProfile,
  facts: ExtractedFacts,
  device?: "desktop" | "mobile",
  embedded?: boolean
) {
  switch (profile.theme) {
    case "ai":
      return <AiLayout profile={profile} facts={facts} device={device} />;
    case "editorial":
      return <ThemeEditorial profile={profile} facts={facts} device={device} embedded={embedded} />;
    case "saas-card":
      return <ThemeSaasCard profile={profile} facts={facts} device={device} embedded={embedded} />;
    case "executive":
      return <ThemeExecutive profile={profile} facts={facts} device={device} embedded={embedded} />;
    case "academic":
      return <ThemeAcademic profile={profile} facts={facts} device={device} embedded={embedded} />;
    case "classic":
    default:
      return <ProfileDocument profile={profile} facts={facts} device={device} />;
  }
}

// Richer, relevant groups so no page/column is left empty.
const PAGES: { key: string; label: string; sections: PublicSection[] }[] = [
  { key: "overview", label: "Overview", sections: ["About", "Projects", "FAQ", "Booking"] },
  { key: "work", label: "Work", sections: ["Experience", "Projects"] },
  { key: "services", label: "Services", sections: ["Services", "Testimonials", "FAQ"] },
  { key: "ask", label: "Ask", sections: ["Chat"] },
  { key: "contact", label: "Contact", sections: ["Booking", "Chat"] },
];

/** Multi-page: a top nav swaps which section group the template shows. */
function MultiPageView({ profile, facts, device }: Props) {
  const has = (s: PublicSection) => profile.sections.includes(s);
  const pages = PAGES.filter(
    (p) => p.key === "overview" || p.key === "contact" || p.sections.some(has)
  );
  const [active, setActive] = useState(pages[0]?.key ?? "overview");
  const current = pages.find((p) => p.key === active) ?? pages[0];

  // Scope the template to this page: force single-scroll AND empty the data for
  // sections not on this page (themes render a section when its data is present).
  const inPage = (s: PublicSection) => current.sections.includes(s);
  const scoped: GeneratedProfile = {
    ...profile,
    layout: "single",
    sections:
      current.key === "contact" ? (["Booking"] as PublicSection[]) : current.sections.filter(has),
    experience: inPage("Experience") ? profile.experience : [],
    projects: inPage("Projects") ? profile.projects : [],
    services: inPage("Services") ? profile.services : [],
    testimonials: inPage("Testimonials") ? profile.testimonials : [],
    faq: inPage("FAQ") ? profile.faq : [],
    about: current.key === "overview" ? profile.about : { heading: "", body: "" },
  };

  return (
    <div className="min-h-full bg-background">
      <nav className="sticky top-0 z-20 flex justify-center gap-1 overflow-x-auto border-b border-border bg-card/95 px-3 py-2 backdrop-blur">
        {pages.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition",
              active === p.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <div key={active}>{renderTheme(scoped, facts, device, true)}</div>
    </div>
  );
}

/** Renders the public profile in its chosen design + single/multi-page layout. */
export function ProfileThemeView({ profile, facts, device }: Props) {
  if (profile.layout === "multi") {
    return <MultiPageView profile={profile} facts={facts} device={device} />;
  }
  return renderTheme(profile, facts, device);
}
