"use client";

import {
  Award,
  Briefcase,
  Layers,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SOCIAL_ICON } from "@/components/icons";
import type {
  AchievementItem,
  ExtractedFacts,
  ProjectItem,
  ServiceItem,
  SkillItem,
  SocialLink,
  WorkItem,
} from "@/lib/types";

interface Props {
  facts: ExtractedFacts;
  onChange: (facts: ExtractedFacts) => void;
}

let idSeq = 1000;
const nextId = (p: string) => `${p}-${idSeq++}`;

export function FactsEditor({ facts, onChange }: Props) {
  const patch = (p: Partial<ExtractedFacts>) => onChange({ ...facts, ...p });

  function updateItem<T extends { id: string }>(
    key: keyof ExtractedFacts,
    id: string,
    field: keyof T,
    value: unknown
  ) {
    const list = facts[key] as unknown as T[];
    patch({
      [key]: list.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    } as Partial<ExtractedFacts>);
  }

  function removeItem(key: keyof ExtractedFacts, id: string) {
    const list = facts[key] as unknown as { id: string }[];
    patch({ [key]: list.filter((it) => it.id !== id) } as Partial<ExtractedFacts>);
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="panel rounded-2xl p-5">
        <SectionHead icon={<Sparkles className="size-4" />} title="Identity" />
        <div className="grid gap-3 sm:grid-cols-2">
          <LabeledInput
            label="Name"
            value={facts.name}
            onChange={(v) => patch({ name: v })}
          />
          <LabeledInput
            label="Role"
            value={facts.role}
            onChange={(v) => patch({ role: v })}
          />
          <div className="sm:col-span-2">
            <LabeledInput
              label="Headline"
              value={facts.headline}
              onChange={(v) => patch({ headline: v })}
            />
          </div>
          <LabeledInput
            label="Location"
            value={facts.location}
            onChange={(v) => patch({ location: v })}
          />
        </div>
      </section>

      {/* Skills */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Layers className="size-4" />}
          title="Skills"
          count={facts.skills.length}
          onAdd={() =>
            patch({
              skills: [...facts.skills, { id: nextId("sk"), label: "New skill" }],
            })
          }
        />
        <div className="flex flex-wrap gap-2">
          {facts.skills.map((s: SkillItem) => (
            <span
              key={s.id}
              className="group inline-flex items-center gap-1 rounded-full border border-border bg-secondary py-1 pl-3 pr-1.5 text-sm"
            >
              <input
                value={s.label}
                onChange={(e) =>
                  updateItem<SkillItem>("skills", s.id, "label", e.target.value)
                }
                className="w-[var(--w)] bg-transparent outline-none"
                style={{ width: `${Math.max(s.label.length, 4)}ch` }}
              />
              <button
                onClick={() => removeItem("skills", s.id)}
                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove skill"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Work history */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Briefcase className="size-4" />}
          title="Work history"
          count={facts.workHistory.length}
          onAdd={() =>
            patch({
              workHistory: [
                ...facts.workHistory,
                { id: nextId("w"), role: "", company: "", period: "", summary: "" },
              ],
            })
          }
        />
        <div className="space-y-3">
          {facts.workHistory.map((w: WorkItem) => (
            <ItemCard key={w.id} onRemove={() => removeItem("workHistory", w.id)}>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  value={w.role}
                  placeholder="Role"
                  onChange={(e) =>
                    updateItem<WorkItem>("workHistory", w.id, "role", e.target.value)
                  }
                />
                <Input
                  value={w.company}
                  placeholder="Company"
                  onChange={(e) =>
                    updateItem<WorkItem>("workHistory", w.id, "company", e.target.value)
                  }
                />
                <Input
                  value={w.period}
                  placeholder="2020 — Present"
                  onChange={(e) =>
                    updateItem<WorkItem>("workHistory", w.id, "period", e.target.value)
                  }
                />
              </div>
              <Textarea
                className="mt-2"
                rows={2}
                value={w.summary}
                placeholder="What you did and the impact"
                onChange={(e) =>
                  updateItem<WorkItem>("workHistory", w.id, "summary", e.target.value)
                }
              />
            </ItemCard>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Layers className="size-4" />}
          title="Projects"
          count={facts.projects.length}
          onAdd={() =>
            patch({
              projects: [
                ...facts.projects,
                { id: nextId("p"), name: "", description: "", tags: [] },
              ],
            })
          }
        />
        <div className="space-y-3">
          {facts.projects.map((p: ProjectItem) => (
            <ItemCard key={p.id} onRemove={() => removeItem("projects", p.id)}>
              <Input
                value={p.name}
                placeholder="Project name"
                onChange={(e) =>
                  updateItem<ProjectItem>("projects", p.id, "name", e.target.value)
                }
              />
              <Textarea
                className="mt-2"
                rows={2}
                value={p.description}
                placeholder="One-line description"
                onChange={(e) =>
                  updateItem<ProjectItem>("projects", p.id, "description", e.target.value)
                }
              />
              <Input
                className="mt-2"
                value={p.tags.join(", ")}
                placeholder="Tags, comma separated"
                onChange={(e) =>
                  updateItem<ProjectItem>(
                    "projects",
                    p.id,
                    "tags",
                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                  )
                }
              />
            </ItemCard>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Award className="size-4" />}
          title="Achievements"
          count={facts.achievements.length}
          onAdd={() =>
            patch({
              achievements: [...facts.achievements, { id: nextId("a"), text: "" }],
            })
          }
        />
        <div className="space-y-2">
          {facts.achievements.map((a: AchievementItem) => (
            <div key={a.id} className="flex items-center gap-2">
              <Input
                value={a.text}
                placeholder="A measurable win"
                onChange={(e) =>
                  updateItem<AchievementItem>("achievements", a.id, "text", e.target.value)
                }
              />
              <RemoveBtn onClick={() => removeItem("achievements", a.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Wrench className="size-4" />}
          title="Services"
          count={facts.services.length}
          onAdd={() =>
            patch({
              services: [
                ...facts.services,
                { id: nextId("sv"), name: "", description: "" },
              ],
            })
          }
        />
        <div className="space-y-3">
          {facts.services.map((s: ServiceItem) => (
            <ItemCard key={s.id} onRemove={() => removeItem("services", s.id)}>
              <Input
                value={s.name}
                placeholder="Service name"
                onChange={(e) =>
                  updateItem<ServiceItem>("services", s.id, "name", e.target.value)
                }
              />
              <Textarea
                className="mt-2"
                rows={2}
                value={s.description}
                placeholder="What the client gets"
                onChange={(e) =>
                  updateItem<ServiceItem>("services", s.id, "description", e.target.value)
                }
              />
            </ItemCard>
          ))}
        </div>
      </section>

      {/* Social links */}
      <section className="panel rounded-2xl p-5">
        <SectionHead
          icon={<Link2 className="size-4" />}
          title="Social links"
          count={facts.socialLinks.length}
          onAdd={() =>
            patch({
              socialLinks: [
                ...facts.socialLinks,
                { id: nextId("ln"), kind: "other", label: "", url: "" },
              ],
            })
          }
        />
        <div className="space-y-2">
          {facts.socialLinks.map((l: SocialLink) => {
            const Icon = SOCIAL_ICON[l.kind];
            return (
              <div key={l.id} className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4" />
                </span>
                <Input
                  className="max-w-[10rem]"
                  value={l.label}
                  placeholder="Label"
                  onChange={(e) =>
                    updateItem<SocialLink>("socialLinks", l.id, "label", e.target.value)
                  }
                />
                <Input
                  value={l.url}
                  placeholder="https://"
                  onChange={(e) =>
                    updateItem<SocialLink>("socialLinks", l.id, "url", e.target.value)
                  }
                />
                <RemoveBtn onClick={() => removeItem("socialLinks", l.id)} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  icon,
  title,
  count,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  onAdd?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {count !== undefined && (
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      )}
      {onAdd && (
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onAdd}>
          <Plus className="size-3.5" /> Add
        </Button>
      )}
    </div>
  );
}

function LabeledInput({
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
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ItemCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-background/60 p-3 pr-10">
      {children}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      aria-label="Remove"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
