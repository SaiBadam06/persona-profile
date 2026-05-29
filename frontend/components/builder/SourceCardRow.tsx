"use client";

import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SOURCE_ICON } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { SourceCard } from "@/lib/types";

const STATUS_META = {
  waiting: { label: "Waiting", icon: Clock, cls: "text-muted-foreground bg-muted" },
  extracting: { label: "Extracting", icon: Loader2, cls: "text-primary bg-accent" },
  complete: { label: "Complete", icon: CheckCircle2, cls: "text-[color:var(--success)] bg-[color:oklch(0.95_0.05_150)]" },
  failed: { label: "Failed", icon: AlertCircle, cls: "text-destructive bg-destructive/10" },
} as const;

export function SourceCardRow({ source }: { source: SourceCard }) {
  const Icon = SOURCE_ICON[source.kind];
  const status = STATUS_META[source.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "panel flex items-center gap-3 rounded-xl p-3 transition-colors",
        source.status === "extracting" && "ring-1 ring-primary/30"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          source.status === "complete"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{source.label}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {source.status === "complete" || source.status === "failed"
            ? source.detail
            : source.value}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
          status.cls
        )}
      >
        <StatusIcon
          className={cn("size-3", source.status === "extracting" && "animate-spin")}
        />
        {status.label}
      </span>
    </motion.div>
  );
}
