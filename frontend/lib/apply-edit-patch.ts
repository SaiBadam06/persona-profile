import type { GeneratedProfile, ProfileTheme, PublicSection } from "./types";

const THEMES: ProfileTheme[] = ["editorial", "saas-card", "executive", "academic", "ai", "classic"];
const FONTS = ["sans", "serif", "mono", "mixed"];
const SHAPES = ["circle", "rounded", "square"];
const SECTIONS: PublicSection[] = ["About", "Experience", "Projects", "Services", "Testimonials", "FAQ", "Booking", "Chat"];

/**
 * Merge a model-produced JSON patch (copy and/or design fields) onto a profile.
 * Shared by /api/edit-profile (builder) and /api/persona-chat (published page),
 * so both routes interpret the same edit vocabulary identically.
 */
export function applyEditPatch(base: GeneratedProfile, raw: Record<string, unknown>): GeneratedProfile {
  let n = 0;
  const eid = (p: string) => `${p}-e${n++}`;
  const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
  const arr = (v: unknown): Record<string, unknown>[] | undefined =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : undefined;
  const out: GeneratedProfile = { ...base };

  out.name = str(raw.name) ?? out.name;
  out.role = str(raw.role) ?? out.role;
  out.headline = str(raw.headline) ?? out.headline;
  out.location = str(raw.location) ?? out.location;

  const hero = raw.hero as Record<string, unknown> | undefined;
  if (hero) out.hero = { ...out.hero, eyebrow: str(hero.eyebrow) ?? out.hero.eyebrow, title: str(hero.title) ?? out.hero.title, subtitle: str(hero.subtitle) ?? out.hero.subtitle };

  const about = raw.about as Record<string, unknown> | undefined;
  if (about) out.about = { heading: str(about.heading) ?? out.about.heading, body: str(about.body) ?? out.about.body };

  const hl = arr(raw.highlights);
  if (hl) out.highlights = hl.map((h) => ({ id: eid("hl"), value: str(h.value) ?? "", label: str(h.label) ?? "", caption: str(h.caption) ?? "" }));

  const exp = arr(raw.experience);
  if (exp) out.experience = exp.map((w) => ({ id: eid("w"), role: str(w.role) ?? "", company: str(w.company) ?? "", period: str(w.period) ?? "", summary: str(w.summary) ?? "" }));

  const proj = arr(raw.projects);
  if (proj) out.projects = proj.map((p) => ({ id: eid("p"), name: str(p.name) ?? "", description: str(p.description) ?? "", tags: Array.isArray(p.tags) ? (p.tags as unknown[]).map((t) => String(t)) : [] }));

  const svc = arr(raw.services);
  if (svc) out.services = svc.map((s) => ({ id: eid("sv"), name: str(s.name) ?? "", description: str(s.description) ?? "" }));

  const faq = arr(raw.faq);
  if (faq) out.faq = faq.map((f) => ({ id: eid("f"), q: str(f.q) ?? "", a: str(f.a) ?? "" }));

  if (Array.isArray(raw.suggestedQuestions)) out.suggestedQuestions = (raw.suggestedQuestions as unknown[]).map((q) => String(q)).slice(0, 6);

  const booking = raw.booking as Record<string, unknown> | undefined;
  if (booking) {
    out.booking = {
      ...out.booking,
      enabled: typeof booking.enabled === "boolean" ? booking.enabled : out.booking.enabled,
      label: str(booking.label) ?? out.booking.label,
      note: str(booking.note) ?? out.booking.note,
    };
  }

  // --- DESIGN changes ---
  if (THEMES.includes(raw.theme as ProfileTheme)) out.theme = raw.theme as ProfileTheme;
  if (FONTS.includes(raw.font as string)) out.font = raw.font as GeneratedProfile["font"];
  if (raw.layout === "single" || raw.layout === "multi") out.layout = raw.layout;
  if (SHAPES.includes(raw.avatarShape as string)) out.avatarShape = raw.avatarShape as GeneratedProfile["avatarShape"];
  if (Array.isArray(raw.order)) {
    const order = (raw.order as unknown[])
      .map((s) => String(s))
      .filter((s): s is PublicSection => SECTIONS.includes(s as PublicSection));
    if (order.length) {
      // keep any current sections the model omitted, appended after
      out.sections = [...order, ...out.sections.filter((s) => !order.includes(s))] as PublicSection[];
    }
  }

  return out;
}
