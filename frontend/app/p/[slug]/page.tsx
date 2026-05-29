"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ProfileThemeView } from "@/components/profile/themes/ProfileThemes";
import { PersonaLoader } from "@/components/PersonaLoader";
import { generateProfileWithGroqMock } from "@/lib/generate-profile";
import { DEFAULT_CUSTOMIZATION, MOCK_EXTRACTED_FACTS } from "@/lib/mock-data";
import type { ExtractedFacts, GeneratedProfile } from "@/lib/types";

export default function PublicProfilePage() {
  const [data, setData] = useState<{
    profile: GeneratedProfile;
    facts: ExtractedFacts;
  } | null>(null);

  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem("personaon:lastProfile");
      const rawFacts = localStorage.getItem("personaon:lastFacts");
      if (rawProfile && rawFacts) {
        setData({ profile: JSON.parse(rawProfile), facts: JSON.parse(rawFacts) });
        return;
      }
    } catch {
      /* fall through to mock */
    }
    setData({
      profile: generateProfileWithGroqMock({
        facts: MOCK_EXTRACTED_FACTS,
        answers: DEFAULT_CUSTOMIZATION,
      }),
      facts: MOCK_EXTRACTED_FACTS,
    });
  }, []);

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto max-w-3xl px-0 sm:px-4 sm:py-6">
        <div className="overflow-hidden bg-background shadow-sm sm:rounded-2xl sm:border sm:border-border">
          {data ? (
            <ProfileThemeView profile={data.profile} facts={data.facts} />
          ) : (
            <div className="flex h-[60vh] items-center justify-center p-10">
              <PersonaLoader size={64} label="Loading profile…" />
            </div>
          )}
        </div>

        <a
          href="/"
          className="mx-auto my-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Sparkles className="size-3.5 text-primary" /> Built with PersonaOn
        </a>
      </div>
    </div>
  );
}
