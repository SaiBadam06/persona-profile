"use client";

import type { Persona, Section } from "@/lib/types";
import { ParticleBg } from "@/components/fx/ParticleBg";
import { Hero } from "./Hero";
import { AboutSection } from "./AboutSection";
import { ProjectsSection } from "./ProjectsSection";
import { SkillsSection } from "./SkillsSection";
import { ExperienceSection } from "./ExperienceSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { LinksSection } from "./LinksSection";
import { PersonaChat } from "./PersonaChat";
import { motion } from "framer-motion";

function renderSection(s: Section, key: string, persona: Persona) {
  switch (s.type) {
    case "about":         return <AboutSection key={key} persona={persona} body={s.content.body} />;
    case "projects":      return <ProjectsSection key={key} items={s.content.items} />;
    case "skills":        return <SkillsSection key={key} groups={s.content.groups} />;
    case "experience":    return <ExperienceSection key={key} items={s.content.items} />;
    case "testimonials":  return <TestimonialsSection key={key} items={s.content.items} />;
    case "links":         return <LinksSection key={key} items={s.content.items} />;
    default:              return null;
  }
}

export function PersonaPage({ persona }: { persona: Persona }) {
  const sorted = [...persona.sections].sort((a, b) => a.priority - b.priority);
  const layout = persona.meta.layout_kind ?? "single-column";
  const containerClass =
    layout === "bento"
      ? "grid grid-cols-1 md:grid-cols-6 gap-4 max-w-6xl mx-auto px-6 mt-16"
      : "max-w-4xl mx-auto px-6 mt-16 space-y-10";

  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <ParticleBg density={persona.theme.particle_density} />
      <Hero persona={persona} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={containerClass}
      >
        {sorted.map((s, i) => renderSection(s, `${s.type}-${i}`, persona))}
      </motion.div>

      {persona.hero.ai_chat_position === "floating" && (
        <PersonaChat persona={persona} variant="floating" />
      )}
    </main>
  );
}
