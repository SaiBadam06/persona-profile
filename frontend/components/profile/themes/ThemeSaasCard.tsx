"use client";

import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { fontVars, initials, type ThemeProps } from "./theme-utils";

// D2 — SaaS Profile Card. Real data from GeneratedProfile + ExtractedFacts.
// Design sections without a data source (Writing/Blog grid) are omitted.

export function ThemeSaasCard({ profile, facts }: ThemeProps) {
  const first = profile.name.split(" ")[0] || "them";
  const stats = profile.hero.stats.slice(0, 4);

  return (
    <div className="po-theme d2" style={fontVars(profile.font)}>
      <nav className="s-nav">
        <div className="s-logo">
          <span className="s-logo-wordmark">PersonaOn</span>
          <span className="s-logo-dot" />
        </div>
        <button className="s-cta">Ask {first}</button>
      </nav>

      <div className="d2-wrap">
        {/* PROFILE CARD */}
        <div className="d2-card">
          <div className="d2-cover" />
          <div className="d2-profile-row">
            <div className="d2-av-wrap">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="av av-pk"
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: "cover",
                    border: "3px solid var(--white)",
                    borderRadius:
                      profile.avatarShape === "square" ? 22 : profile.avatarShape === "rounded" ? 34 : "9999px",
                  }}
                />
              ) : (
                <div className="av av-pk">{initials(profile.name)}</div>
              )}
              <div className="d2-v-anchor">
                <span className="vtick" title="Verified person">
                  <svg viewBox="0 0 12 12">
                    <polyline
                      points="1.5,6.2 4.5,9.5 10.5,2.5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="d2-info">
              <div className="d2-name-row">
                <span className="d2-name">{profile.name}</span>
                <span className="d2-handle">· personaon.com/p/{profile.slug}</span>
              </div>
              <div className="d2-title">{profile.role}</div>
              <div className="d2-chips">
                {profile.location && (
                  <span className="d2-chip">{profile.location}</span>
                )}
                {profile.booking.enabled && (
                  <span className="d2-chip" style={{ color: "var(--green)" }}>
                    Open to work
                  </span>
                )}
              </div>
            </div>

            <div className="d2-actions">
              <button className="btn-solid">{profile.hero.primaryCta.label}</button>
              {profile.hero.secondaryCta?.label && (
                <button className="btn-out">{profile.hero.secondaryCta.label}</button>
              )}
            </div>
          </div>

          {(profile.about.body || stats.length > 0) && (
            <div className="d2-bio-strip">
              {profile.about.body && (
                <p className="d2-bio-txt">{profile.about.body}</p>
              )}
              {stats.length > 0 && (
                <div className="d2-stats">
                  {stats.map((s) => (
                    <div className="d2-stat" key={s.label}>
                      <div className="d2-stat-n">{s.value}</div>
                      <div className="d2-stat-l">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LAYOUT */}
        <div className="d2-layout">
          {/* LEFT */}
          <div className="d2-left">
            {profile.experience.length > 0 && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">Experience</span>
                  <span className="d2-sec-count">
                    {profile.experience.length} role
                    {profile.experience.length === 1 ? "" : "s"}
                  </span>
                </div>
                {profile.experience.map((w) => (
                  <div className="d2-exp" key={w.id}>
                    <div className="d2-exp-logo">
                      {w.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="d2-exp-body">
                      <div className="d2-exp-role">{w.role}</div>
                      <div className="d2-exp-co">{w.company}</div>
                      <div className="d2-exp-date">{w.period}</div>
                      <div className="d2-exp-desc">{w.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {profile.projects.length > 0 && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">Projects</span>
                  <span className="d2-sec-count">{profile.projects.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {profile.projects.map((p) => (
                    <div className="proj" key={p.id} style={{ marginBottom: 0 }}>
                      <div className="proj-nm">{p.name}</div>
                      <div className="proj-desc">{p.description}</div>
                      {p.tags.length > 0 && (
                        <div className="proj-tags">
                          {p.tags.map((t) => (
                            <span key={t} className="tag" style={{ fontSize: 10 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.testimonials.length > 0 && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">What people say</span>
                </div>
                {profile.testimonials.map((t) => (
                  <div className="pov" key={t.id}>
                    <div className="pov-text">&ldquo;{t.quote}&rdquo;</div>
                    <div className="pov-topic" style={{ marginTop: 8, marginBottom: 0 }}>
                      {t.author} · {t.role}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {profile.faq.length > 0 && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">FAQ</span>
                </div>
                {profile.faq.map((f) => (
                  <div className="d2-exp" key={f.id}>
                    <div className="d2-exp-body">
                      <div className="d2-exp-role">{f.q}</div>
                      <div className="d2-exp-desc">{f.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="d2-right">
            {facts.skills.length > 0 && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">Skills</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {facts.skills.map((s) => (
                    <span key={s.id} className="tag">{s.label}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.sections.includes("Chat") && (
              <div className="d2-sec">
                <div className="d2-sec-hd">
                  <span className="d2-sec-title">Ask {first}</span>
                </div>
                <PublicChatPreview profile={profile} facts={facts} />
              </div>
            )}

            <div className="d2-sec">
              <div className="d2-sec-hd">
                <span className="d2-sec-title">Connect</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "var(--blue)",
                      }}
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
                <p>
                  Real voice. Real knowledge. Answers sourced only from content {first} has connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
