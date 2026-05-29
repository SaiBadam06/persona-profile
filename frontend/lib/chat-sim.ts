import type {
  ChatSource,
  ExtractedFacts,
  GeneratedProfile,
} from "./types";

// ---------------------------------------------------------------------------
// Simulated public-chat answers. Matches a visitor question against the
// extracted facts and returns an answer plus the "sources" it drew from
// (rendered as LinkedIn / Resume / Website badges on the public page).
// ---------------------------------------------------------------------------

interface Intent {
  test: RegExp;
  answer: (facts: ExtractedFacts, profile: GeneratedProfile) => string;
  sources: ChatSource[];
}

const SOURCE: Record<string, ChatSource> = {
  linkedin: { kind: "linkedin", label: "LinkedIn" },
  resume: { kind: "resume", label: "Resume" },
  website: { kind: "website", label: "Website" },
};

const INTENTS: Intent[] = [
  {
    test: /\b(arr|bootstrap|revenue|grow|cadence)\b/i,
    answer: (f) => {
      const cadence = f.workHistory.find((w) => /cadence/i.test(w.company));
      return cadence
        ? `${cadence.summary} The short version: stay ruthlessly close to a small set of design partners, charge from day one, and only build what they'll pay for.`
        : "I've focused on building revenue early rather than chasing vanity metrics.";
    },
    sources: [SOURCE.linkedin, SOURCE.resume],
  },
  {
    test: /\b(pricing|packaging|price)\b/i,
    answer: (f) => {
      const svc = f.services.find((s) => /pricing/i.test(s.name));
      return svc
        ? `Yes — that's exactly what my "${svc.name}" engagement is for. ${svc.description} I usually find revenue hiding in the packaging long before the price itself needs to change.`
        : "Pricing is one of my favourite problems — usually the packaging matters more than the number.";
    },
    sources: [SOURCE.website],
  },
  {
    test: /\b(validate|idea|0\s*to\s*1|0→1|discovery|mvp)\b/i,
    answer: (f) => {
      const proj = f.projects.find((p) => /playbook|0/i.test(p.name));
      return `The fastest path is to talk to five real users before writing a line of code. ${
        proj ? `It's the core of ${proj.name} — ${proj.description}` : ""
      } Validate the problem, scope the smallest believable test, then build.`;
    },
    sources: [SOURCE.website, SOURCE.resume],
  },
  {
    test: /\b(fractional|engage|work together|hire you|consult|available|project)\b/i,
    answer: (f) => {
      const svc = f.services[0];
      return `I usually work in one of a few ways${
        svc ? ` — for example, "${svc.name}": ${svc.description}` : ""
      } I take on one or two new engagements a month. The best next step is to book an intro call below.`;
    },
    sources: [SOURCE.website],
  },
  {
    test: /\b(experience|background|career|roles?|history|worked)\b/i,
    answer: (f) =>
      `Over ${
        new Date().getFullYear() - 2013
      }+ years I've gone from first PM hire to Head of Product to founder. Most recently: ${f.workHistory
        .slice(0, 2)
        .map((w) => `${w.role} at ${w.company}`)
        .join(", and before that ")}.`,
    sources: [SOURCE.linkedin, SOURCE.resume],
  },
  {
    test: /\b(skills?|good at|strengths?|expert)\b/i,
    answer: (f) =>
      `My core strengths are ${f.skills
        .slice(0, 4)
        .map((s) => s.label)
        .join(", ")}, with a bias toward shipping over theorising.`,
    sources: [SOURCE.linkedin],
  },
  {
    test: /\b(looking for|next role|opportunit|join)\b/i,
    answer: (f) =>
      `I'm drawn to teams that want product owned end to end — strategy, discovery, and shipping. ${f.headline}`,
    sources: [SOURCE.linkedin, SOURCE.resume],
  },
];

export function answerQuestion(
  question: string,
  facts: ExtractedFacts,
  profile: GeneratedProfile
): { text: string; sources: ChatSource[] } {
  for (const intent of INTENTS) {
    if (intent.test.test(question)) {
      return { text: intent.answer(facts, profile), sources: intent.sources };
    }
  }
  // Default — grounded fallback that respects the "verified only" setting.
  const verified = profile.chat.verifiedOnly;
  return {
    text: verified
      ? `Great question. From what's on ${facts.name.split(" ")[0]}'s verified profile: ${facts.headline} If you want specifics, try asking about experience, pricing, or how to work together — or book a call below.`
      : `Good question! ${facts.headline} Ask me about experience, services, pricing, or availability and I'll point you in the right direction.`,
    sources: verified ? [SOURCE.linkedin] : [],
  };
}
