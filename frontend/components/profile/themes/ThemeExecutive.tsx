"use client";

import { PublicChatPreview } from "@/components/profile/PublicChatPreview";
import { SOCIAL_ICON } from "@/components/icons";
import { fontVars, type ThemeProps } from "./theme-utils";

// D3 — Executive / Dark Hero. Real data from GeneratedProfile + ExtractedFacts.
// Design sections without a data source (Publications) are omitted.

export function ThemeExecutive({ profile, facts }: ThemeProps) {
  const first = profile.name.split(" ")[0] || "them";
  const stats = profile.hero.stats.slice(0, 4);

  return (
    <div className="po-theme d3" style={fontVars(profile.font)}>
      {/* HERO */}
      <div className="d3-hero">
        <div className="d3-hero-inner">
          <div className="d3-top">
            {profile.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                style={{
                  width: 184,
                  height: 184,
                  borderRadius:
                    profile.avatarShape === "square" ? 20 : profile.avatarShape === "rounded" ? 36 : "9999px",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "3px solid rgba(255,255,255,.18)",
                }}
              />
            )}
            <div>
              {profile.hero.eyebrow && (
                <div className="d3-eyebrow">{profile.hero.eyebrow}</div>
              )}
              <div className="d3-name-row">
                <h1 className="d3-name">{profile.name}</h1>
                <span className="vtick lg" title="Verified person">
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
              <div className="d3-title">
                {profile.role}
                {profile.location ? ` · ${profile.location}` : ""}
              </div>
              <p className="d3-bio">{profile.about.body || profile.headline}</p>
              {facts.skills.length > 0 && (
                <div className="d3-tags">
                  {facts.skills.slice(0, 6).map((s) => (
                    <span key={s.id} className="d3-tag">{s.label}</span>
                  ))}
                </div>
              )}
              <div className="d3-actions">
                <button className="d3-btn-w">{profile.hero.primaryCta.label}</button>
                {profile.hero.secondaryCta && (
                  <button className="d3-btn-o">{profile.hero.secondaryCta.label}</button>
                )}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="d3-stats-bar">
              {stats.map((s) => (
                <div className="d3-stat" key={s.label}>
                  <div className="d3-stat-n">{s.value}</div>
                  <div className="d3-stat-l">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="d3-body">
        <div className="d3-main">
          {profile.experience.length > 0 && (
            <div>
              <div className="d3-sec-hd">Experience</div>
              <div className="tl">
                {profile.experience.map((w) => (
                  <div className="tl-item" key={w.id}>
                    <div className="tl-left">
                      <span className="tl-dot" />
                      <span className="tl-ln" />
                    </div>
                    <div>
                      <div className="tl-role">{w.role}</div>
                      <div className="tl-co">{w.company}</div>
                      <div className="tl-date">{w.period}</div>
                      <div className="tl-desc">{w.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.projects.length > 0 && (
            <div>
              <div className="d3-sec-hd">Projects</div>
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
          )}

          {profile.services.length > 0 && (
            <div>
              <div className="d3-sec-hd">Services</div>
              {profile.services.map((s) => (
                <div className="proj" key={s.id}>
                  <div className="proj-nm">{s.name}</div>
                  <div className="proj-desc">{s.description}</div>
                </div>
              ))}
            </div>
          )}

          {profile.testimonials.length > 0 && (
            <div>
              <div className="d3-sec-hd">What people say</div>
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
            <div>
              <div className="d3-sec-hd">FAQ</div>
              {profile.faq.map((f) => (
                <div className="tl-item" key={f.id} style={{ paddingBottom: 16 }}>
                  <div>
                    <div className="tl-role">{f.q}</div>
                    <div className="tl-desc">{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d3-sidebar">
          {profile.booking.enabled && (
            <div className="d3-side">
              <div className="d3-side-title">Availability</div>
              <div className="avail-row">
                <span className="avail-dot g" />
                <div>
                  <span className="avail-strong">{profile.booking.label}</span>
                  {profile.booking.note && (
                    <span className="avail-sub">{profile.booking.note}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {facts.skills.length > 0 && (
            <div className="d3-side">
              <div className="d3-side-title">Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {facts.skills.map((s) => (
                  <span key={s.id} className="tag">{s.label}</span>
                ))}
              </div>
            </div>
          )}

          {profile.sections.includes("Chat") && (
            <div className="d3-side">
              <div className="d3-side-title">Ask {first}</div>
              <PublicChatPreview profile={profile} facts={facts} />
            </div>
          )}

          <div className="d3-side">
            <div className="d3-side-title">Connect</div>
            {profile.contact.socials.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile.contact.socials.map((l) => {
                  const Icon = SOCIAL_ICON[l.kind];
                  return (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--blue)" }}
                    >
                      <Icon style={{ width: 13, height: 13 }} /> {l.label}
                    </a>
                  );
                })}
              </div>
            )}
            {profile.contact.email && (
              <a
                href={`mailto:${profile.contact.email}`}
                style={{ display: "block", marginTop: 8, fontSize: 12, color: "var(--blue)" }}
              >
                {profile.contact.email}
              </a>
            )}
            <div
              className="po-stamp"
              style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--ink-08)" }}
            >
              <span className="po-stamp-text">PersonaOn</span>
              <span className="po-stamp-dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
