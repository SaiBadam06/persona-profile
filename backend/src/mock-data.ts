import type { ExtractedFacts } from "./types";

/** Fallback persona used only if a Groq generation call fails. */
export const MOCK_EXTRACTED_FACTS: ExtractedFacts = {
  name: "Maya Rao",
  headline: "I help early-stage teams turn messy product ideas into software people pay for.",
  role: "Founder & Product Strategist",
  location: "San Francisco, CA",
  skills: [
    { id: "sk-1", label: "0→1 Product Strategy" },
    { id: "sk-2", label: "Go-to-Market" },
    { id: "sk-3", label: "Pricing & Packaging" },
    { id: "sk-4", label: "User Research" },
    { id: "sk-5", label: "Roadmapping" },
  ],
  workHistory: [
    { id: "w-1", role: "Founder & CEO", company: "Cadence Labs", period: "2021 — Present", summary: "Building the operating system for product teams. Bootstrapped to $1.2M ARR in 14 months." },
    { id: "w-2", role: "Head of Product", company: "Northwind", period: "2018 — 2021", summary: "Took the flagship workspace from 0 to 40,000 paying teams." },
  ],
  projects: [
    { id: "p-1", name: "Cadence OS", description: "A planning workspace that keeps product, design, and engineering aligned around outcomes.", tags: ["SaaS", "0→1"] },
  ],
  achievements: [
    { id: "a-1", text: "Bootstrapped Cadence Labs to $1.2M ARR in 14 months" },
    { id: "a-2", text: "Scaled Northwind's flagship product to 40,000 paying teams" },
  ],
  services: [
    { id: "sv-1", name: "Fractional Head of Product", description: "Embedded product leadership for seed-stage teams." },
    { id: "sv-2", name: "0→1 Product Sprint", description: "A focused 3-week sprint from fuzzy idea to a validated, build-ready spec." },
  ],
  socialLinks: [
    { id: "ln-1", kind: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/mayarao" },
    { id: "ln-2", kind: "email", label: "maya@cadencelabs.com", url: "mailto:maya@cadencelabs.com" },
  ],
};
