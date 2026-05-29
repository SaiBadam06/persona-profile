"use client";

import type { ExtractedFacts, GeneratedProfile } from "@/lib/types";
import { ProfileDocument } from "@/components/profile/ProfileDocument";
import { ThemeEditorial } from "./ThemeEditorial";
import { ThemeSaasCard } from "./ThemeSaasCard";
import { ThemeExecutive } from "./ThemeExecutive";
import { ThemeAcademic } from "./ThemeAcademic";
import { AiLayout } from "./AiLayout";

interface Props {
  profile: GeneratedProfile;
  facts: ExtractedFacts;
  device?: "desktop" | "mobile";
}

/** Renders the public profile in whichever design template was chosen. */
export function ProfileThemeView({ profile, facts, device }: Props) {
  switch (profile.theme) {
    case "ai":
      return <AiLayout profile={profile} facts={facts} device={device} />;
    case "editorial":
      return <ThemeEditorial profile={profile} facts={facts} device={device} />;
    case "saas-card":
      return <ThemeSaasCard profile={profile} facts={facts} device={device} />;
    case "executive":
      return <ThemeExecutive profile={profile} facts={facts} device={device} />;
    case "academic":
      return <ThemeAcademic profile={profile} facts={facts} device={device} />;
    case "classic":
    default:
      return <ProfileDocument profile={profile} facts={facts} device={device} />;
  }
}
