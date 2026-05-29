"use client";

import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { fontVars, initials, type ThemeProps } from "./theme-utils";

// D1 — Editorial / Broadsheet. Real data from GeneratedProfile + ExtractedFacts.
// Design sections without a data source (Writing, POV, Education) are omitted.

export function ThemeEditorial({ profile, facts }: ThemeProps) {
  const first = profile.name.split(" ")[0] || "them";
  const stats = profile.hero.stats.slice(0, 4);

  return (
    <div className="po-theme d1" style={fontVars(profile.font)}>
      <nav className="s-nav">
        <div className="s-logo">
          <span className="s-logo-wordmark">PersonaOn</span>
          <span className="s-logo-dot" />
        </div>
        <div className="s-links">
          <a href="#">About</a>
          <a href="#">Work</a>
          <a href="#">Services</a>
          <a href="#">Ask</a>
        </div>
        <button className="s-cta">Ask {first}</button>
      </nav>

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
            <p className="d1-bio">{profile.about.body || profile.headline}</p>
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
              {profile.avatarUrl ? (
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

      {/* 3-COLUMN BODY */}
      <div className="d1-body">
        <div className="d1-grid">
          {/* Col 1 — Experience + Projects */}
          <div className="d1-col" style={{ paddingLeft: 0 }}>
            {profile.experience.length > 0 && (
              <>
                <div className="d1-col-title">Experience</div>
                {profile.experience.map((w) => (
                  <div className="exp" key={w.id}>
                    <div className="exp-co">{w.company}</div>
                    <div className="exp-role">{w.role}</div>
                    <div className="exp-date">{w.period}</div>
                    <div className="exp-desc">{w.summary}</div>
                  </div>
                ))}
              </>
            )}
            {profile.projects.length > 0 && (
              <>
                <div className="d1-col-title" style={{ marginTop: 28 }}>Projects</div>
                {profile.projects.map((p) => (
                  <div className="proj" key={p.id}>
                    <div className="proj-nm">{p.name}</div>
                    <div className="proj-desc">{p.description}</div>
                    <div className="proj-tags">
                      {p.tags.map((t) => (
                        <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="d1-col-rule" />

          {/* Col 2 — About + Services + FAQ */}
          <div className="d1-col">
            <div className="d1-col-title">{profile.about.heading || "About"}</div>
            <p className="d1-bio">{profile.about.body}</p>

            {profile.services.length > 0 && (
              <>
                <div className="d1-col-title" style={{ marginTop: 28 }}>Services</div>
                {profile.services.map((s) => (
                  <div className="exp" key={s.id}>
                    <div className="exp-role">{s.name}</div>
                    <div className="exp-desc">{s.description}</div>
                  </div>
                ))}
              </>
            )}

            {profile.testimonials.length > 0 && (
              <>
                <div className="d1-col-title" style={{ marginTop: 28 }}>What people say</div>
                {profile.testimonials.map((t) => (
                  <div className="pov" key={t.id}>
                    <div className="pov-text">&ldquo;{t.quote}&rdquo;</div>
                    <div className="pov-topic" style={{ marginTop: 8, marginBottom: 0 }}>
                      {t.author} · {t.role}
                    </div>
                  </div>
                ))}
              </>
            )}

            {profile.faq.length > 0 && (
              <>
                <div className="d1-col-title" style={{ marginTop: 28 }}>FAQ</div>
                {profile.faq.map((f) => (
                  <div className="exp" key={f.id}>
                    <div className="exp-role">{f.q}</div>
                    <div className="exp-desc">{f.a}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="d1-col-rule" />

          {/* Col 3 — Skills + Chat + Connect */}
          <div className="d1-col" style={{ paddingRight: 0 }}>
            {facts.skills.length > 0 && (
              <>
                <div className="d1-col-title">Skills</div>
                <div className="d1-tags" style={{ marginBottom: 28 }}>
                  {facts.skills.map((s) => (
                    <span key={s.id} className="tag">{s.label}</span>
                  ))}
                </div>
              </>
            )}

            {profile.sections.includes("Chat") && (
              <>
                <div className="d1-col-title">Ask {first}</div>
                <PublicChatPreview profile={profile} facts={facts} />
              </>
            )}

            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--ink-08)" }}>
              <div className="sec-hd" style={{ marginBottom: 9 }}>Connect</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {profile.booking.enabled && (
                  <a href="#" style={{ fontSize: 12, color: "var(--blue)" }}>
                    {profile.booking.label}
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
            </div>

            <div className="po-footer" style={{ marginTop: 18 }}>
              <div className="po-stamp">
                <span className="po-stamp-text">PersonaOn</span>
                <span className="po-stamp-dot" />
              </div>
              <p>Real voice. Real knowledge. Answers sourced only from content {first} has connected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
