"use client";

import { useState } from "react";
import { Monitor, Smartphone, Sparkles } from "lucide-react";
import { ProfileThemeView } from "./themes/ProfileThemes";
import { cn } from "@/lib/utils";
import type { ExtractedFacts, GeneratedProfile } from "@/lib/types";

type Device = "desktop" | "mobile";

const THEME_LABEL: Record<GeneratedProfile["theme"], string> = {
  ai: "AI-designed",
  classic: "Classic",
  editorial: "Editorial",
  "saas-card": "SaaS Card",
  executive: "Executive",
  academic: "Academic",
};

// Browser/phone frame with a device toggle, wrapping the chosen design template.
export function ProfilePreview({
  profile,
  facts,
  url,
}: {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  url: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-sm font-medium text-primary">
          <Sparkles className="size-3.5" />
          {THEME_LABEL[profile.theme]} design · {profile.tone}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <DeviceBtn active={device === "desktop"} onClick={() => setDevice("desktop")}>
            <Monitor className="size-4" /> Desktop
          </DeviceBtn>
          <DeviceBtn active={device === "mobile"} onClick={() => setDevice("mobile")}>
            <Smartphone className="size-4" /> Mobile
          </DeviceBtn>
        </div>
      </div>

      <div className="panel-raised overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
          </span>
          <span className="mx-auto truncate rounded-md bg-card px-3 py-1 text-xs text-muted-foreground">
            {url.replace(/^https?:\/\//, "")}
          </span>
        </div>

        <div
          className={cn(
            "scrollbar-thin overflow-y-auto bg-background",
            device === "mobile" ? "flex justify-center py-6" : ""
          )}
          style={{ height: 620 }}
        >
          <div
            className={cn(
              device === "mobile"
                ? "w-[390px] shrink-0 overflow-hidden rounded-[2rem] border-[6px] border-foreground/10 shadow-xl"
                : "w-full"
            )}
          >
            <ProfileThemeView profile={profile} facts={facts} device={device} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
