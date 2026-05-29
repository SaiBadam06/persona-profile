"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaLoader } from "@/components/PersonaLoader";
import { SourceCardRow } from "./SourceCardRow";
import { FactsEditor } from "./FactsEditor";
import {
  buildIntakeCards,
  buildSourceCards,
  DEFAULT_SOURCE_INPUT,
  EXTRACTION_STEPS,
  SOURCE_COMPLETE_DETAIL,
} from "@/lib/mock-data";
import { extractFacts } from "@/lib/extract-client";
import { cn } from "@/lib/utils";
import type { ExtractedFacts, IntakeFiles, SourceCard } from "@/lib/types";

interface Props {
  intake: IntakeFiles;
  mode: "real" | "demo";
  facts: ExtractedFacts;
  onChange: (facts: ExtractedFacts) => void;
  onBack: () => void;
  onContinue: () => void;
}

const STEP_MS = 700;

export function ExtractionPreview({
  intake,
  mode,
  facts,
  onChange,
  onBack,
  onContinue,
}: Props) {
  const [sources, setSources] = useState<SourceCard[]>(() =>
    mode === "real"
      ? buildIntakeCards(intake)
      : buildSourceCards(DEFAULT_SOURCE_INPUT)
  );
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [usedMock, setUsedMock] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Step animation (visual), runs regardless of mode.
    const timers: ReturnType<typeof setTimeout>[] = [];
    EXTRACTION_STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setActiveStep(i);
          setSources((prev) =>
            prev.map((s) =>
              s.kind === step.source && s.status === "waiting"
                ? { ...s, status: "extracting" }
                : s
            )
          );
        }, i * STEP_MS)
      );
    });

    const minDelay = new Promise<void>((r) =>
      setTimeout(r, EXTRACTION_STEPS.length * STEP_MS)
    );

    async function finishDemo() {
      await minDelay;
      setSources((prev) =>
        prev.map((s) => ({
          ...s,
          status: "complete",
          detail: SOURCE_COMPLETE_DETAIL[s.id] ?? s.detail,
        }))
      );
      setActiveStep(EXTRACTION_STEPS.length);
      setDone(true);
    }

    async function finishReal() {
      try {
        const [result] = await Promise.all([extractFacts(intake), minDelay]);
        onChange(result.facts);
        setSources(result.sources);
        setNotes(result.notes ?? []);
        setUsedMock(result.source === "mock");
      } catch {
        await minDelay;
        setSources((prev) =>
          prev.map((s) => ({ ...s, status: "failed", detail: "Extraction failed" }))
        );
        setNotes(["Extraction failed — start from a blank profile and add details below."]);
      } finally {
        setActiveStep(EXTRACTION_STEPS.length);
        setDone(true);
      }
    }

    if (mode === "demo") finishDemo();
    else finishReal();

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.min(activeStep / EXTRACTION_STEPS.length, 1);
  const failedAll = done && sources.length > 0 && sources.every((s) => s.status === "failed");

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="extracting"
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"
          >
            {/* Animated progress */}
            <div className="panel-raised rounded-2xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <PersonaLoader size={40} />
                <div>
                  <h2 className="text-lg font-semibold">Analyzing your sources</h2>
                  <p className="text-sm text-muted-foreground">
                    Reading your documents and building a knowledge base…
                  </p>
                </div>
              </div>

              <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full brand-gradient"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                />
              </div>

              <ul className="space-y-2.5">
                {EXTRACTION_STEPS.map((step, i) => {
                  const state =
                    i < activeStep ? "done" : i === activeStep ? "active" : "todo";
                  return (
                    <li
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        state === "active" && "bg-accent",
                        state === "todo" && "opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full",
                          state === "done"
                            ? "bg-primary text-primary-foreground"
                            : state === "active"
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {state === "done" ? (
                          <Check className="size-3.5" />
                        ) : state === "active" ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span className={cn(state === "done" && "text-muted-foreground")}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Source cards flipping status */}
            <div className="space-y-2.5">
              {sources.map((s) => (
                <SourceCardRow key={s.id} source={s} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="facts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {failedAll ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                  <AlertCircle className="size-4" /> Couldn&apos;t read your sources
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:oklch(0.95_0.05_150)] px-3 py-1 text-sm font-medium text-[color:var(--success)]">
                  <Check className="size-4" /> Extracted from your sources
                </span>
              )}
              <p className="text-sm text-muted-foreground">
                Review what we found. Edit anything, remove what you don&apos;t
                want public.
              </p>
            </div>

            {/* Source outcome chips */}
            {mode === "real" && sources.length > 0 && (
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {sources.map((s) => (
                  <SourceCardRow key={s.id} source={s} />
                ))}
              </div>
            )}

            {/* Notes / warnings */}
            {(notes.length > 0 || usedMock) && (
              <div className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800">
                <ul className="list-inside list-disc space-y-0.5">
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            <FactsEditor facts={facts} onChange={onChange} />

            <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-3 backdrop-blur">
              <Button variant="ghost" size="lg" onClick={onBack}>
                <ArrowLeft className="size-4" /> Sources
              </Button>
              <Button size="lg" onClick={onContinue}>
                Customize profile <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
