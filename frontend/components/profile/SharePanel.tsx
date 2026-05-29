"use client";

import { useState } from "react";
import {
  Briefcase,
  Check,
  Copy,
  Link2,
  Mail,
  QrCode,
} from "lucide-react";
import { FauxQR } from "./FauxQR";
import { cn } from "@/lib/utils";
import type { GeneratedProfile } from "@/lib/types";

interface Props {
  profile: GeneratedProfile;
  url: string;
}

export function SharePanel({ profile, url }: Props) {
  const first = profile.name.split(" ")[0];
  const post = `I built an AI-powered profile you can actually talk to. Ask it anything about my work as ${profile.role} — it answers from my real LinkedIn, resume & site. 👉 ${url}`;
  const signature = `${profile.name} · ${profile.role}\nChat with my AI profile: ${url}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Public link + QR */}
      <div className="panel rounded-2xl p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-primary" /> Public link
        </h3>
        <CopyField value={url} mono />
        <div className="mt-4 flex items-center gap-4">
          <div className="rounded-xl border border-border p-2">
            <FauxQR value={url} size={104} />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <QrCode className="size-4 text-primary" /> Scan to open
            </p>
            <p className="mt-1 text-xs">
              Drop this QR on a slide, business card, or conference badge.
            </p>
          </div>
        </div>
      </div>

      {/* LinkedIn + email signature */}
      <div className="space-y-4">
        <div className="panel rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="size-4 text-primary" /> Share on LinkedIn
          </h3>
          <p className="mb-3 rounded-xl bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
            {post}
          </p>
          <div className="flex gap-2">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Briefcase className="size-4" /> Post to LinkedIn
            </a>
            <CopyButton text={post} label="Copy" />
          </div>
        </div>

        <div className="panel rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Mail className="size-4 text-primary" /> Email signature
          </h3>
          <pre className="mb-3 whitespace-pre-wrap rounded-xl bg-secondary/60 p-3 font-mono text-xs text-muted-foreground">
            {signature}
          </pre>
          <CopyButton text={signature} label="Copy signature" full />
        </div>
      </div>
    </div>
  );
}

function CopyField({ value, mono }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-1.5 pl-3">
      <span className={cn("flex-1 truncate text-sm", mono && "font-mono text-xs")}>
        {value}
      </span>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1.5 text-xs font-medium ring-1 ring-border transition hover:bg-accent"
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function CopyButton({
  text,
  label,
  full,
}: {
  text: string;
  label: string;
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:bg-accent",
        full && "w-full"
      )}
    >
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
