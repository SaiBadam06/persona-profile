"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ProfileThemeView } from "@/components/profile/themes/ProfileThemes";
import { PersonaLoader } from "@/components/PersonaLoader";
import { generateProfileWithGroqMock } from "@/lib/generate-profile";
import { DEFAULT_CUSTOMIZATION, MOCK_EXTRACTED_FACTS } from "@/lib/mock-data";
import { ProfileEditProvider } from "@/lib/profile-edit-context";
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

  // Edits made through the on-page chat re-render the whole page (theme/layout
  // included) and persist so they survive a reload.
  const handleProfileChange = useCallback((next: GeneratedProfile) => {
    setData((prev) => (prev ? { ...prev, profile: next } : prev));
    try {
      localStorage.setItem("personaon:lastProfile", JSON.stringify(next));
    } catch {
      /* storage full / unavailable — keep the in-memory update */
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {data ? (
        // Full-width — each theme centers its own content at its intended width.
        <ProfileEditProvider
          onProfileChange={handleProfileChange}
          chatGreeting={data.profile.chat.greeting}
        >
          <ProfileThemeView profile={data.profile} facts={data.facts} />
        </ProfileEditProvider>
      ) : (
        <div className="flex h-screen items-center justify-center p-10">
          <PersonaLoader size={132} label="Loading profile…" />
        </div>
      )}

      <a
        href="/"
        className="mx-auto my-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        <Sparkles className="size-3.5 text-primary" /> Built with PersonaOn
      </a>
    </div>
  );
}
