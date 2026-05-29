"use client";

import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { fontVars, initials, type ThemeProps } from "./theme-utils";

// D4 — Academic / Research. Real data from GeneratedProfile + ExtractedFacts.
// Design sections without a data source (Publications, Education, Certifications,
// skill percentages) are omitted. Skills render as plain pills.

export function ThemeAcademic({ profile, facts }: ThemeProps) {
  const first = profile.name.split(" ")[0] || "them";
  const stats = profile.hero.stats.slice(0, 4);

  return (
    <div className="po-theme d4" style={fontVars(profile.font)}>
      {/* HEADER */}
      <header className="d4-hdr">
        <div className="d4-hdr-left">
          <span className="d4-hdr-name">{profile.name}</span>
          <span className="d4-hdr-sub">{profile.role}</span>
        </div>
        <nav className="d4-hdr-nav">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          {profile.sections.includes("Chat") && <a href="#ask">Ask</a>}
          <a href="#contact">Contact</a>
        </nav>
        <button className="d4-cv-btn" type="button">Save to PDF</button>
      </header>

      {/* HERO */}
      <section className="d4-hero" id="about">
        <div>
          <div className="d4-portrait-sq">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="d4-portrait-init">{initials(profile.name)}</div>
            )}
          </div>
          {profile.contact.socials.length > 0 && (
            <div className="d4-soc">
              {profile.contact.socials.map((l) => {
                const Icon = SOCIAL_ICON[l.kind];
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon style={{ width: 13, height: 13 }} /> {l.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="d4-affil">{profile.role}</div>
          <div className="d4-name-row">
            <h1 className="d4-name">{profile.name}</h1>
            <span className="vtick lg" title="Verified person">
              <svg viewBox="0 0 12 12">
                <polyline points="1.5,6.2 4.5,9.5 10.5,2.5" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className="d4-title">{profile.headline}</p>

          {facts.skills.length > 0 && (
            <div className="d4-ri">
              {facts.skills.map((s) => (
                <span key={s.id} className="d4-ri-tag">{s.label}</span>
              ))}
            </div>
          )}

          {profile.about.body && <p className="d4-bio">{profile.about.body}</p>}

          <div className="d4-contact-grid" id="contact">
            {profile.contact.email && (
              <div className="d4-ci">
                <span>Email</span> {profile.contact.email}
              </div>
            )}
            {profile.location && (
              <div className="d4-ci">
                <span>Location</span> {profile.location}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN + SIDEBAR */}
      <div className="d4-main">
        <main>
          {profile.experience.length > 0 && (
            <section className="d4-sec" id="work">
              <div className="d4-sec-hd">Experience</div>
              {profile.experience.map((w) => (
                <div className="paper" key={w.id}>
                  <div className="paper-title">{w.role} · {w.company}</div>
                  <div className="paper-venue">{w.period}</div>
                  <p className="paper-abs">{w.summary}</p>
                </div>
              ))}
            </section>
          )}

          {profile.projects.length > 0 && (
            <section className="d4-sec">
              <div className="d4-sec-hd">Projects</div>
              {profile.projects.map((p) => (
                <div className="paper" key={p.id}>
                  <div className="paper-title">{p.name}</div>
                  <p className="paper-abs">{p.description}</p>
                  {p.tags.length > 0 && (
                    <div className="paper-links">
                      {p.tags.map((t) => (
                        <span key={t} className="paper-link">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {profile.services.length > 0 && (
            <section className="d4-sec">
              <div className="d4-sec-hd">Services</div>
              {profile.services.map((s) => (
                <div className="paper" key={s.id}>
                  <div className="paper-title">{s.name}</div>
                  <p className="paper-abs">{s.description}</p>
                </div>
              ))}
            </section>
          )}

          {profile.sections.includes("Chat") && (
            <section className="d4-sec" id="ask">
              <div className="d4-sec-hd">Ask {first}</div>
              <PublicChatPreview profile={profile} facts={facts} />
            </section>
          )}
        </main>

        <aside className="d4-sidebar">
          {stats.length > 0 && (
            <div>
              <div className="d4-sb-hd">At a glance</div>
              {stats.map((s) => (
                <div className="d4-stat-item" key={s.label}>
                  <span className="d4-stat-n">{s.value}</span>
                  <span className="d4-stat-l">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {facts.skills.length > 0 && (
            <div>
              <div className="d4-sb-hd">Skills</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {facts.skills.map((s) => (
                  <span key={s.id} className="tag">{s.label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="po-footer">
            <div className="po-stamp">
              <span className="po-stamp-text">PersonaOn</span>
              <span className="po-stamp-dot" />
            </div>
            <p>Real voice. Real knowledge. Answers sourced only from content {first} has connected.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
