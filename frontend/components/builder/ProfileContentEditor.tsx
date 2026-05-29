"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GeneratedProfile } from "@/lib/types";

interface Props {
  profile: GeneratedProfile;
  onChange: (profile: GeneratedProfile) => void;
}

const SHAPES = ["circle", "rounded", "square"] as const;

/** Lightweight editor for the generated copy — live-updates the preview. */
export function ProfileContentEditor({ profile, onChange }: Props) {
  const set = (patch: Partial<GeneratedProfile>) => onChange({ ...profile, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);

  const previewRadius =
    profile.avatarShape === "square" ? 10 : profile.avatarShape === "rounded" ? 14 : 9999;

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ avatarUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Profile photo */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/60 p-3 sm:col-span-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt="avatar"
          className="size-16 object-cover ring-1 ring-border"
          style={{ borderRadius: previewRadius }}
        />
        <div className="flex flex-col gap-2">
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition hover:bg-accent"
            >
              <Upload className="size-3.5" /> Change photo
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Shape:</span>
            {SHAPES.map((s) => (
              <button
                key={s}
                onClick={() => set({ avatarShape: s })}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs capitalize transition",
                  (profile.avatarShape ?? "circle") === s
                    ? "border-primary bg-accent text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Field label="Name" value={profile.name} onChange={(v) => set({ name: v })} />
      <Field label="Role" value={profile.role} onChange={(v) => set({ role: v })} />
      <div className="sm:col-span-2">
        <Field label="Headline" value={profile.headline} onChange={(v) => set({ headline: v })} />
      </div>
      <Field label="Location" value={profile.location} onChange={(v) => set({ location: v })} />
      <Field
        label="Hero eyebrow"
        value={profile.hero.eyebrow}
        onChange={(v) => set({ hero: { ...profile.hero, eyebrow: v } })}
      />
      <div className="sm:col-span-2">
        <Field
          label="Hero title"
          value={profile.hero.title}
          onChange={(v) => set({ hero: { ...profile.hero, title: v } })}
        />
      </div>
      <div className="sm:col-span-2">
        <Field
          label="Hero subtitle"
          value={profile.hero.subtitle}
          onChange={(v) => set({ hero: { ...profile.hero, subtitle: v } })}
        />
      </div>
      <Field
        label="Primary button"
        value={profile.hero.primaryCta.label}
        onChange={(v) => set({ hero: { ...profile.hero, primaryCta: { ...profile.hero.primaryCta, label: v } } })}
      />
      <Field
        label="About heading"
        value={profile.about.heading}
        onChange={(v) => set({ about: { ...profile.about, heading: v } })}
      />
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">About body</label>
        <Textarea
          rows={4}
          value={profile.about.body}
          onChange={(e) => set({ about: { ...profile.about, body: e.target.value } })}
        />
      </div>
      {profile.booking.enabled && (
        <div className="sm:col-span-2">
          <Field
            label="Booking CTA label"
            value={profile.booking.label}
            onChange={(v) => set({ booking: { ...profile.booking, label: v } })}
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
