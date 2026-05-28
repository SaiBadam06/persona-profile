export type ExperienceItem = {
  role: string;
  organization: string;
  start: string;
  end?: string | null;
  summary?: string;
};

export type ProjectItem = {
  title: string;
  description: string;
  tags?: string[];
  url?: string;
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Testimonial = {
  quote: string;
  author: string;
  role?: string;
};

export type LinkItem = {
  label: string;
  url: string;
  icon?: "github" | "linkedin" | "x" | "website" | "email";
};

export type Section =
  | { type: "about"; priority: number; content: { body: string } }
  | { type: "experience"; priority: number; content: { items: ExperienceItem[] } }
  | { type: "projects"; priority: number; content: { items: ProjectItem[] } }
  | { type: "skills"; priority: number; content: { groups: SkillGroup[] } }
  | { type: "testimonials"; priority: number; content: { items: Testimonial[] } }
  | { type: "links"; priority: number; content: { items: LinkItem[] } };

export type SectionType = Section["type"];

export type Persona = {
  id: string;
  slug: string;
  owner_user_id: string;
  owner_display_name: string;
  meta: {
    purpose: string;
    style: string;
    palette: string;
    layout_kind: "bento" | "single-column" | "magazine" | "minimal" | "terminal";
  };
  hero: {
    headline: string;
    subheadline: string;
    cta_label: string;
    ai_chat_position: "hero" | "floating" | "sidebar" | "embedded" | "none";
  };
  sections: Section[];
  theme: {
    primary_color: string;
    accent_color: string;
    mode: "dark" | "light";
    particle_density: "off" | "subtle" | "dense";
  };
  generated_at: string;
  version: number;
};
