"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Globe,
  Info,
  PenLine,
  Play,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SourceCardRow } from "./SourceCardRow";
import { buildIntakeCards, hasRealSource } from "@/lib/mock-data";
import type { IntakeFiles } from "@/lib/types";

interface Props {
  intake: IntakeFiles;
  onChange: (patch: Partial<IntakeFiles>) => void;
  onExtract: () => void;
  onUseDemo: () => void;
}

export function SourceIntake({ intake, onChange, onExtract, onUseDemo }: Props) {
  const linkedinRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const cards = buildIntakeCards(intake);
  const ready = hasRealSource(intake);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Add your sources</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PersonaOn reads your real documents and builds your profile from them.
            Upload at least one to continue — nothing is published until you
            review it.
          </p>
        </div>

        {/* LinkedIn PDF */}
        <Field
          icon={<Briefcase className="size-4 text-primary" />}
          label="LinkedIn profile PDF"
          hint="On LinkedIn: your profile → More → Save to PDF, then upload it here."
        >
          <FileRow
            inputRef={linkedinRef}
            fileName={intake.linkedinFile?.name ?? ""}
            onPick={(f) => onChange({ linkedinFile: f })}
            onClear={() => onChange({ linkedinFile: null })}
          />
        </Field>

        {/* Resume PDF */}
        <Field
          icon={<FileText className="size-4 text-primary" />}
          label="Resume / CV (PDF)"
        >
          <FileRow
            inputRef={resumeRef}
            fileName={intake.resumeFile?.name ?? ""}
            onPick={(f) => onChange({ resumeFile: f })}
            onClear={() => onChange({ resumeFile: null })}
          />
        </Field>

        {/* Website */}
        <Field
          icon={<Globe className="size-4 text-primary" />}
          label="Personal website"
          hint="We crawl the page text and extract services, projects & voice."
        >
          <Input
            value={intake.websiteUrl}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            placeholder="https://yoursite.com"
          />
        </Field>

        {/* Manual bio */}
        <Field
          icon={<PenLine className="size-4 text-primary" />}
          label="Short bio (optional)"
        >
          <Textarea
            value={intake.manualBio}
            onChange={(e) => onChange({ manualBio: e.target.value })}
            placeholder="In one or two sentences, how do you want to be introduced?"
            rows={3}
          />
        </Field>

        <button
          onClick={onUseDemo}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Play className="size-3.5" /> Don&apos;t have files handy? Load the demo
          founder profile
        </button>
      </div>

      {/* Live source cards */}
      <div className="space-y-4">
        <div className="panel-raised rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Sources to analyze</h3>
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {cards.length} added
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="grid-bg flex h-40 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
              Upload a LinkedIn/resume PDF or add a website to see it here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {cards.map((c) => (
                <SourceCardRow key={c.id} source={c} />
              ))}
            </div>
          )}

          <Button className="mt-5 w-full" size="lg" disabled={!ready} onClick={onExtract}>
            <Sparkles className="size-4" />
            Extract with AI
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Info className="size-3" />
            Real PDF parsing + website crawl, analyzed by Groq.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileRow({
  inputRef,
  fileName,
  onPick,
  onClear,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <Button variant="outline" size="lg" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" /> {fileName ? "Replace PDF" : "Upload PDF"}
      </Button>
      {fileName && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary py-1 pl-2.5 pr-1.5 text-xs">
          <FileText className="size-3.5" /> {fileName}
          <button
            onClick={onClear}
            className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="size-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel rounded-xl p-4"
    >
      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}
