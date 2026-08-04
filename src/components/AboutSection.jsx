import React, { useState } from 'react';
import './AboutSection.css';

/* Drop a portrait in public/ named portrait.jpeg or portrait.jpg — the figure
   tries each in turn and falls back to a placeholder rather than a broken image. */
const PORTRAIT_SOURCES = ['/portrait.jpeg', '/portrait.jpg', '/portrait.png'];

/* Every figure traces to a specific line on the résumé:
   4+ yrs · Accolite 10+ enterprise systems · Atriveo 100+ users and 5.0 on the
   Web Store · Stony Brook 200K+ data points · Wake Forest 90% accuracy. */
const STATS = [
  { value: '4+', label: 'Years\nexperience', icon: 'calendar' },
  { value: '10+', label: 'Enterprise\nsystems', icon: 'layers' },
  { value: '100+', label: 'Active\nusers', icon: 'users' },
  { value: '200K+', label: 'Data points\nprocessed', icon: 'database' },
  { value: '90%', label: 'ML accuracy\nachieved', icon: 'trend' },
  { value: '5.0', label: 'Chrome store\nrating', icon: 'star', mark: '★' },
];

const PLATE = [
  { key: 'Location', value: 'New York, NY', icon: 'pin' },
  { key: 'Focus', value: 'AI/ML · Distributed Systems · Backend', icon: 'focus' },
  { key: 'Education', value: 'MS Data Science, Stony Brook', icon: 'cap' },
  { key: 'Available', value: 'SWE · AI/ML · Data · 2026', icon: 'clock' },
];

const ICONS = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M17 5.5a3.2 3.2 0 0 1 0 6M18 20a6.4 6.4 0 0 0-2-4.6" /></>,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  star: <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.8" /></>,
  focus: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /></>,
  cap: <><path d="m12 4 10 5-10 5L2 9l10-5z" /><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
};

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function AboutSection() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const portraitFailed = sourceIndex >= PORTRAIT_SOURCES.length;

  return (
    <section id="about-section" className="spec-about section-wrap" data-analytics-section="about" translate="no">
      <div className="spec-about-inner" translate="no">
        <p className="spec-label spec-about-doc" translate="no">
          <span className="spec-about-doc-mark" aria-hidden="true" />
          /about_me.doc
        </p>

        <h2 className="spec-about-title" translate="no">
          A bit about <em>me</em>
        </h2>

        <div className="spec-about-body" translate="no">
          {/* ── Left: claim, measured values, story, contact ── */}
          <div className="spec-about-main" translate="no">
            <p className="spec-about-claim" translate="no">
              I care most about the hour after a deploy. Whether the graphs stay flat, whether the
              model still gets it right on data nobody thought to test, whether anyone has to wake
              up. That hour is what I actually build for.
            </p>

            <dl className="spec-about-stats" translate="no">
              {STATS.map((s) => (
                <div className="spec-about-stat" key={s.value + s.label} translate="no">
                  <span className="spec-about-stat-icon" aria-hidden="true">
                    <Icon name={s.icon} />
                  </span>
                  <dt className="spec-about-stat-value" translate="no">
                    {s.value}
                    {s.mark && <span className="spec-about-stat-mark" aria-hidden="true">{s.mark}</span>}
                  </dt>
                  <dd className="spec-about-stat-label spec-label" translate="no">{s.label}</dd>
                </div>
              ))}
            </dl>

            <div className="spec-about-prose" translate="no">
              <p className="spec-about-lead">
                I finish an MS in Data Science at <strong>Stony Brook</strong> in May 2026. Most of
                my work sits in an awkward middle. Half of it is &quot;will this fall over at
                3am&quot;, half is &quot;is the model even right&quot;. I like that middle.
              </p>

              <p>
                The systems half came from three years at <strong>Accolite Digital</strong>: an
                event-driven ETL platform for <strong>Fidelity</strong> wiring{' '}
                <strong>10+ enterprise systems</strong> at 99% uptime, then a Redis and Elasticsearch
                rewrite that took P99 latency down <strong>40%</strong> for{' '}
                <strong>100K+ customers</strong>. Zero Sev1s after that deploy, which is the number I
                care about more than the 40%.
              </p>

              <p>
                The ML half started at <strong>Wake Forest CAIR</strong>, where a PyTorch pipeline on
                GCP hit <strong>90% accuracy</strong> and cut clinical processing from twenty minutes
                to under five across <strong>1,250+ patient cases</strong>, with{' '}
                <strong>10TB+</strong> of imaging behind it.
              </p>

              <p>
                My research at <strong>Stony Brook</strong> does the same with money instead of
                medicine. A fault-tolerant pipeline on FastAPI and AWS chews through{' '}
                <strong>200K+ financial data points</strong> in real time and drops none of them when
                the load spikes.
              </p>

              <p>
                On the side I run <strong>Atriveo</strong> on my own: FastAPI, React and Postgres,{' '}
                <strong>100+ active users</strong>, <strong>2K+ queries a day</strong>, and a Chrome
                extension that has somehow held a <strong>5.0</strong> on the Web Store.
              </p>

              <p>
                The part nobody puts on a slide is the plumbing. Dockerised CI/CD on Jenkins took our
                deploy time down <strong>97%</strong>, and Prometheus and CloudWatch meant we found
                the defects before customers did.
              </p>

              <p>
                What I want next is more of the same, somewhere the systems are big enough to be
                interesting and someone still cares whether the model is right.
              </p>
            </div>

            <div className="spec-about-contact" translate="no">
              <a href="mailto:hire@atishaykasliwal.com" className="spec-about-contact-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 6 10-6" />
                </svg>
                hire@atishaykasliwal.com
              </a>
              <a
                href="https://github.com/atishay-kasliwal"
                target="_blank"
                rel="noopener noreferrer"
                className="spec-about-contact-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/atishay-kasliwal/"
                target="_blank"
                rel="noopener noreferrer"
                className="spec-about-contact-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>

          {/* ── Right: portrait plate and vitals ── */}
          <div className="spec-about-side" translate="no">
            <figure className="spec-portrait" translate="no">
              <span className="spec-brackets" aria-hidden="true" />

              <figcaption className="spec-portrait-cap" translate="no">
                <span className="spec-label">Fig. 01 / Portrait</span>
                <span className="spec-label spec-label--accent">Atishay</span>
              </figcaption>

              <div className="spec-portrait-frame" translate="no">
                {portraitFailed ? (
                  <div className="spec-portrait-empty" aria-hidden="true" translate="no" />
                ) : (
                  <img
                    key={PORTRAIT_SOURCES[sourceIndex]}
                    src={PORTRAIT_SOURCES[sourceIndex]}
                    alt="Atishay Kasliwal"
                    loading="lazy"
                    decoding="async"
                    onError={() => setSourceIndex((i) => i + 1)}
                    translate="no"
                  />
                )}
                <span className="spec-portrait-ticks" aria-hidden="true" />
              </div>

              {/* icon / key / value are direct grid children of .spec-vital so
                  each row stays on a single line */}
              <dl className="spec-vitals" translate="no">
                {PLATE.map((row) => (
                  <div className="spec-vital" key={row.key} translate="no">
                    <span className="spec-vital-icon" aria-hidden="true">
                      <Icon name={row.icon} />
                    </span>
                    <dt className="spec-vital-key spec-label" translate="no">{row.key}</dt>
                    <dd className="spec-vital-value" translate="no">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </figure>

            <div className="spec-about-status" translate="no">
              <span className="spec-label spec-about-status-key" translate="no">
                <span className="spec-about-status-dot" aria-hidden="true" />
                Status
              </span>
              <span className="spec-about-status-value" translate="no">
                Open to Engineering Roles
                <span className="spec-about-status-sub">Full-time · 2026 · Will relocate</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
