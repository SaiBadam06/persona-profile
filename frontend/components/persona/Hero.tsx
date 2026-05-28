"use client";

import { motion } from "framer-motion";
import type { Persona } from "@/lib/types";
import { GradientText } from "@/components/fx/GradientText";
import { PersonaChat } from "./PersonaChat";

export function Hero({ persona }: { persona: Persona }) {
  const showHeroChat = persona.hero.ai_chat_position === "hero";

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.2em] text-white/50"
      >
        {persona.owner_display_name}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
      >
        <GradientText>{persona.hero.headline}</GradientText>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12 }}
        className="mt-6 max-w-2xl text-base text-white/65 md:text-lg"
      >
        {persona.hero.subheadline}
      </motion.p>

      {showHeroChat && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-10"
        >
          <PersonaChat persona={persona} variant="hero" />
        </motion.div>
      )}
    </section>
  );
}
