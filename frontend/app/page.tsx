"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Pencil,
  RotateCcw,
  Sparkles,
  type LucideIcon,
  FileStack,
  ScanLine,
  SlidersHorizontal,
  Share2,
} from "lucide-react";
import { SourceIntake } from "@/components/builder/SourceIntake";
import { ExtractionPreview } from "@/components/builder/ExtractionPreview";
import { CustomizationWizard } from "@/components/builder/CustomizationWizard";
import { ProfilePreview } from "@/components/profile/ProfilePreview";
import { ProfileContentEditor } from "@/components/builder/ProfileContentEditor";
import { AiEditPanel } from "@/components/builder/AiEditPanel";
import { SharePanel } from "@/components/profile/SharePanel";
import { PersonaLoader } from "@/components/PersonaLoader";
import { generateProfile } from "@/lib/profile-client";
import { getArchitectPlan } from "@/lib/architect-client";
import {
  DEFAULT_CUSTOMIZATION,
  EMPTY_FACTS,
  MOCK_EXTRACTED_FACTS,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type {
  ArchitectPlan,
  CustomizationAnswers,
  ExtractedFacts,
  GenerateResult,
  IntakeFiles,
} from "@/lib/types";

const EMPTY_INTAKE: IntakeFiles = {
  linkedinFile: null,
  resumeFile: null,
  websiteUrl: "",
  manualBio: "",
};

type StepKey = "sources" | "extract" | "customize" | "publish";

const STEPS: { key: StepKey; label: string; icon: LucideIcon }[] = [
  { key: "sources", label: "Sources", icon: FileStack },
  { key: "extract", label: "Extract", icon: ScanLine },
  { key: "customize", label: "Customize", icon: SlidersHorizontal },
  { key: "publish", label: "Publish", icon: Share2 },
];

export default function BuilderPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [intake, setIntake] = useState<IntakeFiles>(EMPTY_INTAKE);
  const [extractMode, setExtractMode] = useState<"real" | "demo">("real");
  const [facts, setFacts] = useState<ExtractedFacts>(EMPTY_FACTS);
  const [answers, setAnswers] = useState<CustomizationAnswers>(DEFAULT_CUSTOMIZATION);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [publicUrl, setPublicUrl] = useState("https://personaon.com/p/profile");
  const [generating, setGenerating] = useState(false);
  const [architecting, setArchitecting] = useState(false);
  const [plan, setPlan] = useState<ArchitectPlan | null>(null);

  const PUBLISH_IDX = STEPS.findIndex((s) => s.key === "publish");
  const step = STEPS[stepIdx].key;

  function goto(idx: number) {
    setStepIdx(idx);
    setMaxReached((m) => Math.max(m, idx));
  }

  // Step 1 of generate: the Persona Architect proposes IA + template before any UI.
  async function runArchitect() {
    setArchitecting(true);
    try {
      const p = await getArchitectPlan({ facts, answers });
      setPlan(p);
    } catch {
      runGenerate(); // architect unavailable → just generate
    } finally {
      setArchitecting(false);
    }
  }

  // Apply the architect's plan (reorder by importance, optionally switch template), then generate.
  function applyPlan(useTheme: boolean) {
    if (!plan) return;
    const next: CustomizationAnswers = {
      ...answers,
      publicSections: plan.order.length ? plan.order : answers.publicSections,
      ...(useTheme ? { theme: plan.recommendedTheme } : {}),
    };
    setAnswers(next);
    const imp = plan.importance;
    setPlan(null);
    runGenerate(next, imp);
  }

  // Generate the page, then land on Publish.
  async function runGenerate(
    a: CustomizationAnswers = answers,
    importance?: Record<string, number>
  ) {
    setGenerating(true);
    try {
      const r = await generateProfile({ facts, answers: a });
      if (importance) r.profile.importance = importance;
      setResult(r);
      goto(PUBLISH_IDX);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (result) {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/p/${result.profile.slug}`);
      try {
        localStorage.setItem("personaon:lastProfile", JSON.stringify(result.profile));
        localStorage.setItem("personaon:lastFacts", JSON.stringify(facts));
      } catch {
        /* ignore quota / privacy errors */
      }
    }
  }, [result, facts]);

  return (
    <div className="min-h-screen">
      {/* Top app bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/personaon-logo.svg" alt="PersonaOn" className="h-8 w-auto" />
            <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
              Profile builder
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {result && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium transition hover:bg-accent"
              >
                <ExternalLink className="size-3.5" /> View public page
              </a>
            )}
            <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              {facts.name.trim()
                ? facts.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                : "PO"}
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const state = i < stepIdx ? "done" : i === stepIdx ? "current" : "todo";
              const reachable = i <= maxReached;
              return (
                <div key={s.key} className="flex items-center">
                  <button
                    disabled={!reachable}
                    onClick={() => reachable && goto(i)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition",
                      state === "current" && "bg-primary text-primary-foreground",
                      state === "done" && "text-primary hover:bg-accent",
                      state === "todo" && "text-muted-foreground",
                      !reachable && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[10px]",
                        state === "current"
                          ? "bg-white/20"
                          : state === "done"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                      )}
                    >
                      {state === "done" ? <Check className="size-3" /> : i + 1}
                    </span>
                    <StepIcon className="size-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className="mx-0.5 h-px w-3 bg-border sm:w-6" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {step === "sources" && (
              <SourceIntake
                intake={intake}
                onChange={(p) => setIntake((s) => ({ ...s, ...p }))}
                onExtract={() => {
                  setExtractMode("real");
                  goto(1);
                }}
                onUseDemo={() => {
                  setFacts(MOCK_EXTRACTED_FACTS);
                  setExtractMode("demo");
                  goto(1);
                }}
              />
            )}

            {step === "extract" && (
              <ExtractionPreview
                intake={intake}
                mode={extractMode}
                facts={facts}
                onChange={setFacts}
                onBack={() => goto(0)}
                onContinue={() => goto(2)}
              />
            )}

            {step === "customize" && (
              <CustomizationWizard
                answers={answers}
                onChange={(p) => setAnswers((a) => ({ ...a, ...p }))}
                onBack={() => goto(1)}
                onGenerate={runArchitect}
              />
            )}

            {step === "publish" && result && (
              <PublishStep
                result={result}
                facts={facts}
                publicUrl={publicUrl}
                onRegenerate={runGenerate}
                onProfileChange={(p) =>
                  setResult((r) => (r ? { ...r, profile: p } : r))
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {(generating || architecting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <PersonaLoader
            size={132}
            label={architecting ? "Analyzing your profile…" : "Generating your page…"}
          />
        </div>
      )}

      {plan && !generating && (
        <ArchitectModal
          plan={plan}
          onClose={() => setPlan(null)}
          onUsePlan={() => applyPlan(true)}
          onKeepDesign={() => applyPlan(false)}
        />
      )}
    </div>
  );
}

const THEME_NAMES: Record<string, string> = {
  ai: "AI-designed", classic: "Classic", editorial: "Editorial",
  "saas-card": "SaaS Card", executive: "Executive", academic: "Academic",
};

function ArchitectModal({
  plan,
  onClose,
  onUsePlan,
  onKeepDesign,
}: {
  plan: ArchitectPlan;
  onClose: () => void;
  onUsePlan: () => void;
  onKeepDesign: () => void;
}) {
  const ranked = [...plan.order];
  const max = Math.max(1, ...ranked.map((s) => plan.importance[s] ?? 0));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg brand-gradient text-white">
              <Sparkles className="size-4" />
            </span>
            <h3 className="text-base font-semibold">PersonaOn’s plan for your page</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{plan.personaType}.</span>{" "}
            {plan.reasoning}
          </p>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
            <span className="font-medium">Recommended design:</span>{" "}
            <span className="text-primary">{THEME_NAMES[plan.recommendedTheme] ?? plan.recommendedTheme}</span>
            {plan.visitorsWant && (
              <p className="mt-1 text-xs text-muted-foreground">Visitors want: {plan.visitorsWant}</p>
            )}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Content priority &amp; space
          </p>
          <div className="space-y-2">
            {ranked.map((s) => {
              const v = plan.importance[s] ?? 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm">{s}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full brand-gradient" style={{ width: `${(v / max) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{v}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onKeepDesign}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-accent"
          >
            Keep my design
          </button>
          <button
            onClick={onUsePlan}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Sparkles className="size-4" /> Use this plan
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishStep({
  result,
  facts,
  publicUrl,
  onRegenerate,
  onProfileChange,
}: {
  result: GenerateResult;
  facts: ExtractedFacts;
  publicUrl: string;
  onRegenerate: () => void;
  onProfileChange: (p: GenerateResult["profile"]) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [published, setPublished] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {published ? "Your page is live 🎉" : "Your page is ready"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {published
              ? "Share it anywhere — anyone with the link can view and chat."
              : "Tweak any wording below, then publish in one click."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEdit((s) => !s)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition",
              showEdit ? "border-primary bg-accent text-primary" : "border-border bg-card hover:bg-accent"
            )}
          >
            <Pencil className="size-4" /> Edit fields
          </button>
          <button
            onClick={onRegenerate}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-accent"
          >
            <RotateCcw className="size-4" /> Regenerate
          </button>
          <button
            onClick={() => setPublished(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {published ? <CheckCircle2 className="size-4" /> : <Globe className="size-4" />}
            {published ? "Published" : "Publish"}
          </button>
        </div>
      </div>

      {published && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[color:var(--success)]/30 bg-[color:oklch(0.97_0.04_150)] p-3 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0 text-[color:var(--success)]" />
            <span className="font-medium">Live at</span>
          </span>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 break-all font-mono text-primary hover:underline"
          >
            {publicUrl.replace(/^https?:\/\//, "")}
          </a>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-card px-3 text-xs font-medium ring-1 ring-border hover:bg-accent"
          >
            <ExternalLink className="size-3.5" /> Open
          </a>
        </div>
      )}

      {/* AI editor is always available on the publish page */}
      <AiEditPanel profile={result.profile} onChange={onProfileChange} />

      {showEdit && (
        <section className="panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Edit content manually</h3>
            <span className="ml-auto text-xs text-muted-foreground">Changes preview live below</span>
          </div>
          <ProfileContentEditor profile={result.profile} onChange={onProfileChange} />
        </section>
      )}

      <ProfilePreview profile={result.profile} facts={facts} url={publicUrl} />

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Link2 className="size-4 text-primary" /> Share your profile
        </h3>
        <SharePanel profile={result.profile} url={publicUrl} />
      </div>
    </div>
  );
}
