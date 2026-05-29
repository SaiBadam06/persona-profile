"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ProfileThemeView } from "@/components/profile/themes/ProfileThemes";
import { generateProfileWithGroqMock } from "@/lib/generate-profile";
import { DEFAULT_CUSTOMIZATION, MOCK_EXTRACTED_FACTS } from "@/lib/mock-data";
import type { ProfileTheme } from "@/lib/types";

const DESIGN_W = 1180;

/** A live, correctly-scaled sample of a template rendered from the demo persona.
 *  Uses CSS `zoom` so the layout box shrinks too (the whole page is scrollable). */
export function TemplateMockup({
  theme,
  height = 460,
}: {
  theme: ProfileTheme;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(900);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const profile = useMemo(
    () =>
      generateProfileWithGroqMock({
        facts: MOCK_EXTRACTED_FACTS,
        answers: { ...DEFAULT_CUSTOMIZATION, theme },
      }),
    [theme]
  );

  const scale = Math.min(w / DESIGN_W, 1);
  const innerStyle: CSSProperties = { width: DESIGN_W };
  // `zoom` shrinks both the visual and the layout box (unlike transform: scale).
  (innerStyle as Record<string, unknown>).zoom = scale;

  return (
    <div
      ref={ref}
      className="scrollbar-thin overflow-auto rounded-xl border border-border bg-background"
      style={{ height }}
    >
      <div style={innerStyle} className="pointer-events-none select-none">
        <ProfileThemeView profile={profile} facts={MOCK_EXTRACTED_FACTS} />
      </div>
    </div>
  );
}
