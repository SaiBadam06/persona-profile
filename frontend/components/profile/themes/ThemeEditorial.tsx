"use client";

import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { isPhoto } from "@/components/profile/Avatar";
import { fontVars, initials, type ThemeProps } from "./theme-utils";

// D1 — Editorial / Broadsheet. Real data from GeneratedProfile + ExtractedFacts.
// Design sections without a data source (Writing, POV, Education) are omitted.

export function ThemeEditorial({ profile, facts, embedded }: ThemeProps) {
  const first = profile.name.split(" ")[0] || "them";
  const stats = profile.hero.stats.slice(0, 4);

  return (
    <div className="po-theme d1" style={fontVars(profile.font)}>
      {!embedded && (
        <nav className="s-nav">
          <div className="s-logo">
            <span className="s-logo-wordmark">PersonaOn</span>
            <span className="s-logo-dot" />
          </div>
          <div className="s-links">
            <a href="#d1-about">About</a>
            <a href="#d1-work">Work</a>
            <a href="#d1-services">Services</a>
            <a href="#d1-ask">Ask</a>
          </div>
          <a href="#d1-ask" className="s-cta">Ask {first}</a>
        </nav>
      )}

      <div className="d1-above">
        <div className="d1-issue">
          <strong>{profile.name}</strong> &nbsp;·&nbsp; personaon.com/p/{profile.slug}
        </div>
        <div className="d1-po-brand po-stamp">
          <span className="po-stamp-text">PersonaOn</span>
          <span className="po-stamp-dot" />
        </div>
      </div>

      {/* HERO */}
      <div className="d1-hero">
        <div className="d1-hero-inner">
          <div className="d1-hl">
            <div className="d1-overline">
              {profile.role}
              {profile.location ? ` · ${profile.location}` : ""}
            </div>
            <div className="d1-name-row">
              <h1 className="d1-name">{profile.name}</h1>
              <span className="d1-vtick-wrap">
                <span className="vtick lg" title="Verified person">
                  <svg viewBox="0 0 12 12">
                    <polyline points="1.5,6.2 4.5,9.5 10.5,2.5" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <span className="live">Active today</span>
            </div>
            <p className="d1-headline">{profile.hero.eyebrow}</p>
            <hr className="d1-rule" />
            <p className="d1-bio">{profile.headline || profile.role}</p>
            <div className="d1-meta">
              {profile.location && (
                <div className="d1-meta-item">
                  <span className="d1-meta-lbl">Location</span>
                  <span className="d1-meta-val">{profile.location}</span>
                </div>
              )}
              {profile.booking.enabled && (
                <div className="d1-meta-item">
                  <span className="d1-meta-lbl">Availability</span>
                  <span className="d1-meta-val" style={{ color: "var(--green)" }}>
                    Open to work
                  </span>
                </div>
              )}
            </div>
            <div className="d1-tags">
              {facts.skills.slice(0, 6).map((s) => (
                <span key={s.id} className="tag">{s.label}</span>
              ))}
            </div>
          </div>

          <div className="d1-hr">
            <div className="d1-portrait">
              {isPhoto(profile.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="d1-portrait-initial">{initials(profile.name)}</div>
              )}
              <div className="d1-portrait-caption">
                <div>
                  <div className="d1-portrait-caption-name">{profile.name}</div>
                  <div className="d1-portrait-caption-sub">{profile.location}</div>
                </div>
                <div className="po-stamp">
                  <span className="po-stamp-text">PersonaOn</span>
                  <span className="po-stamp-dot" />
                </div>
              </div>
            </div>
            {stats.length > 0 && (
              <div className="d1-qs-grid">
                {stats.map((s) => (
                  <div className="d1-qs" key={s.label}>
                    <div className="d1-qs-n">{s.value}</div>
                    <div className="d1-qs-l">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BROADSHEET BODY — masonry flow that always fills every column */}
      <div className="d1-body">
        <div className="po-flow d1-flow">
          <section className="po-block" id="d1-about">
            <div className="po-block-title">{profile.about.heading || "About"}</div>
            <p className="d1-bio" style={{ marginBottom: 0 }}>{profile.about.body || profile.headline}</p>
          </section>

          {profile.experience.length > 0 && (
            <section className="po-block span2" id="d1-work">
              <div className="po-block-title">Experience</div>
              {profile.experience.map((w) => (
                <div className="exp" key={w.id}>
                  <div className="exp-co">{w.company}</div>
                  <div className="exp-role">{w.role}</div>
                  <div className="exp-date">{w.period}</div>
                  <div className="exp-desc">{w.summary}</div>
                </div>
              ))}
            </section>
          )}

          {profile.projects.length > 0 && (
            <section className={`po-block${profile.projects.length >= 3 ? " span-full" : ""}`}>
              <div className="po-block-title">Projects</div>
              <div className={profile.projects.length >= 3 ? "po-cards" : undefined}>
                {profile.projects.map((p) => (
                  <div className="proj" key={p.id}>
                    <div className="proj-nm">{p.name}</div>
                    <div className="proj-desc">{p.description}</div>
                    {p.tags.length > 0 && (
                      <div className="proj-tags">
                        {p.tags.map((t) => (
                          <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.services.length > 0 && (
            <section className="po-block" id="d1-services">
              <div className="po-block-title">Services</div>
              {profile.services.map((s) => (
                <div className="exp" key={s.id}>
                  <div className="exp-role">{s.name}</div>
                  <div className="exp-desc">{s.description}</div>
                </div>
              ))}
            </section>
          )}

          {profile.testimonials.length > 0 && (
            <section className="po-block">
              <div className="po-block-title">What people say</div>
              {profile.testimonials.map((t) => (
                <div className="pov" key={t.id}>
                  <div className="pov-text">&ldquo;{t.quote}&rdquo;</div>
                  <div className="pov-topic" style={{ marginTop: 8, marginBottom: 0 }}>
                    {t.author} · {t.role}
                  </div>
                </div>
              ))}
            </section>
          )}

          {profile.faq.length > 0 && (
            <section className="po-block">
              <div className="po-block-title">FAQ</div>
              {profile.faq.map((f) => (
                <div className="exp" key={f.id}>
                  <div className="exp-role">{f.q}</div>
                  <div className="exp-desc">{f.a}</div>
                </div>
              ))}
            </section>
          )}

          {facts.skills.length > 0 && (
            <section className="po-block">
              <div className="po-block-title">Skills</div>
              <div className="d1-tags">
                {facts.skills.map((s) => (
                  <span key={s.id} className="tag">{s.label}</span>
                ))}
              </div>
            </section>
          )}

          {profile.sections.includes("Chat") && (
            <section className="po-block chat-tile" id="d1-ask">
              <div className="po-block-title">Ask {first}</div>
              <PublicChatPreview profile={profile} facts={facts} />
            </section>
          )}

          <section className="po-block">
            <div className="po-block-title">Connect</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {profile.booking.enabled && (
                <a
                  href={profile.contact.email ? `mailto:${profile.contact.email}` : "#"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    width: "fit-content",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "8px 16px",
                    background: "var(--blue)",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  {profile.booking.label}
                </a>
              )}
              {profile.contact.email && (
                <a href={`mailto:${profile.contact.email}`} style={{ fontSize: 12, color: "var(--blue)" }}>
                  {profile.contact.email}
                </a>
              )}
              {profile.contact.socials.map((l) => {
                const Icon = SOCIAL_ICON[l.kind];
                return (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--blue)" }}
                  >
                    <Icon style={{ width: 13, height: 13 }} /> {l.label}
                  </a>
                );
              })}
            </div>
            <div className="po-footer" style={{ marginTop: 16 }}>
              <div className="po-stamp">
                <span className="po-stamp-text">PersonaOn</span>
                <span className="po-stamp-dot" />
              </div>
              <p>Real voice. Real knowledge. Answers sourced only from content {first} has connected.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
