import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { webPageSchema, faqSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, Button, ArrowIcon, DownloadIcon, ExternalIcon } from '../components/ui';
import {
  FULL_NAME,
  BIO_LONG,
  LOCATION,
  AVAILABILITY,
  IMAGES,
  RESUME_PDF,
  EMAIL,
  PROFILES,
  FOCUS_AREAS,
} from '../data/site.js';
import { EXPERIENCE, yearsOfExperience, NOTABLE_ORGS } from '../data/experience.js';
import { EDUCATION, SKILLS } from '../data/education.js';
import { ABOUT_FAQS as FAQS } from '../data/faqs.js';
import { FEATURED_PROJECTS } from '../data/projects.js';
import './AboutPage.css';

/**
 * /about — the page that answers "who is this person" for a recruiter and for a
 * crawler at the same time.
 *
 * Structured the way the page is actually read: identity and status first, then
 * the narrative, then proof, then depth. The FAQ at the end is not filler — the
 * questions are phrased the way people literally search a name, and they are
 * emitted as FAQPage structured data, which is what can win an expanded search
 * result for "who is Atishay Kasliwal".
 */

const PRINCIPLES = [
  {
    title: 'The model is the easy part',
    body: 'Most of the difficulty in an AI system sits upstream and downstream of inference — data correctness, retrieval quality, latency budgets, failure modes. That is where the work actually is.',
  },
  {
    title: 'Measure the thing you claim',
    body: 'A number without a definition is decoration. P99 under what load, accuracy on which split, cost per query at what volume. If I cannot say how it was measured, it does not go on the slide.',
  },
  {
    title: 'Build for the failure case',
    body: 'Production systems are defined by what they do when a dependency is slow, a schema changes, or a model returns nonsense. The happy path is the demo; the rest is the job.',
  },
  {
    title: 'Ship, then earn the complexity',
    body: 'Every abstraction should be paid for by a problem that already exists. I would rather ship something plain and add structure under real pressure than build for a scale that never arrives.',
  },
];

/** Mirrors the CURRENTLY strip on the landing page. */
const CURRENTLY = [
  { head: 'Building Atriveo', sub: 'Job-search platform · 100+ users', to: '/atriveo' },
  { head: 'MS Data Science', sub: 'Stony Brook · May 2026', to: null },
  { head: 'Financial NLP research', sub: 'Stony Brook University', to: '/research' },
  { head: 'Open to new roles', sub: 'AI/ML · SWE · Data', to: '/contact' },
];

const BEYOND = [
  { label: 'Photography', body: 'Street and travel work, shot on a Nikon.', to: '/art' },
  { label: 'Writing', body: 'Notes on what breaks in production ML.', to: '/blog' },
  { label: 'Open source', body: 'Public repositories, pulled live from GitHub.', to: '/open-source' },
];

export default function AboutPage() {
  const meta = resolveMeta('/about');
  const years = yearsOfExperience();
  const current = EXPERIENCE.find((e) => e.current);

  return (
    <>
      <Seo path="/about" schema={[webPageSchema(meta, 'ProfilePage'), faqSchema(FAQS)]} />

      {/* ── Hero: identity, status, portrait ─────────────────────────── */}
      <header className="ab-hero">
        <Container>
          <div className="ab-hero-meta">
            <span className="spec-label">Profile · AK-2026 / Rev. A</span>
            <span className="spec-label">{LOCATION.display}</span>
          </div>

          <div className="ab-hero-cols">
            <div className="ab-hero-lead">
              <p className="ab-status">
                <span className="ab-status-mark" aria-hidden="true" />
                {AVAILABILITY.label}
              </p>

              <h1 className="ab-title">
                I build AI systems that <em>hold up</em> in production.
              </h1>

              <p className="ab-lede">
                {years} years across research, healthcare, and financial infrastructure — most of
                it on the parts of a system that decide whether a model is actually useful.
              </p>

              <div className="ab-actions">
                <Button href={RESUME_PDF} download icon={<DownloadIcon />}>
                  Download résumé
                </Button>
                <Button to="/projects" variant="ghost" icon={<ArrowIcon />}>
                  See the work
                </Button>
              </div>
            </div>

            <figure className="ab-portrait-plate">
              <img
                className="ab-portrait"
                src={IMAGES.headshot.src}
                width={IMAGES.headshot.width}
                height={IMAGES.headshot.height}
                alt={IMAGES.headshot.alt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <figcaption className="spec-label ab-portrait-cap">
                {FULL_NAME} · {LOCATION.display}
              </figcaption>
            </figure>
          </div>
        </Container>
      </header>

      {/* ── Currently ────────────────────────────────────────────────── */}
      <section className="ab-currently" aria-label="Currently">
        <Container>
          <ul className="ab-currently-list">
            {CURRENTLY.map((item) => (
              <li key={item.head} className="ab-currently-item">
                {item.to ? (
                  <Link to={item.to}>
                    <span className="ab-currently-head">{item.head}</span>
                    <span className="ab-currently-sub">{item.sub}</span>
                  </Link>
                ) : (
                  <>
                    <span className="ab-currently-head">{item.head}</span>
                    <span className="ab-currently-sub">{item.sub}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── Narrative ────────────────────────────────────────────────── */}
      <Section className="ab-bio">
        <Container>
          <div className="ab-bio-grid">
            <p className="spec-label ab-bio-label">The short version</p>
            <div className="ab-bio-body">
              {BIO_LONG.split('\n\n').map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}

              <p className="ab-bio-more">
                The long version is on <Link to="/experience">the experience page</Link>, role by
                role, with the numbers attached. Peer-reviewed work is listed under{' '}
                <Link to="/research">research</Link>.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Where the work has run ───────────────────────────────────── */}
      <section className="ab-orgs" aria-label="Organizations">
        <Container>
          <p className="spec-label ab-orgs-label">Work has run at</p>
          <ul className="ab-orgs-list">
            {NOTABLE_ORGS.map((org) => (
              <li key={org.name}>{org.name}</li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── Focus ────────────────────────────────────────────────────── */}
      <Section className="ab-focus">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Focus</p>
              <h2 className="section-title">What I work on</h2>
            </div>
            <Link className="section-link" to="/projects">
              See it applied <ArrowIcon />
            </Link>
          </header>

          <ul className="ab-focus-grid">
            {FOCUS_AREAS.map((area, i) => (
              <li key={area} className="ab-focus-item">
                <span className="ab-focus-num mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {area}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Principles ───────────────────────────────────────────────── */}
      <Section className="ab-principles">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Method</p>
              <h2 className="section-title">How I work</h2>
            </div>
          </header>

          <div className="ab-principles-grid">
            {PRINCIPLES.map((p, i) => (
              <article key={p.title} className="ab-principle card">
                <span className="ab-principle-num mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="ab-principle-title">{p.title}</h3>
                <p className="ab-principle-body">{p.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Selected work ────────────────────────────────────────────── */}
      <Section className="ab-work">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Selected work</p>
              <h2 className="section-title">Things I have shipped</h2>
            </div>
            <Link className="section-link" to="/projects">
              All projects <ArrowIcon />
            </Link>
          </header>

          <ul className="ab-work-list">
            {FEATURED_PROJECTS.slice(0, 3).map((p) => (
              <li key={p.slug} className="ab-work-item card">
                <span className="mono ab-work-cat">{p.category}</span>
                <h3 className="ab-work-title">
                  <Link to={`/projects/${p.slug}`} className="card-link">
                    {p.name}
                  </Link>
                </h3>
                <p className="ab-work-tagline">{p.tagline}</p>
                {p.metrics?.length > 0 && (
                  <dl className="ab-work-metrics">
                    {p.metrics.slice(0, 2).map((m) => (
                      <div key={m.label}>
                        <dd className="tabular">{m.value}</dd>
                        <dt>{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Skills ───────────────────────────────────────────────────── */}
      <Section className="ab-skills">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Depth</p>
              <h2 className="section-title">Technical range</h2>
            </div>
          </header>

          <div className="ak-skills-grid">
            {SKILLS.map((group) => (
              <div
                key={group.category}
                className={`ab-skill-group${group.primary ? ' is-primary' : ''}`}
              >
                <h3 className="ab-skill-category">{group.category}</h3>
                <ul className="ab-skill-items">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Education ────────────────────────────────────────────────── */}
      <Section className="ab-education">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Education</p>
              <h2 className="section-title">Where I studied</h2>
            </div>
          </header>

          <ul className="ab-edu-list">
            {EDUCATION.map((e) => (
              <li key={e.id} className="ab-edu-item">
                <div className="ab-edu-main">
                  <h3 className="ab-edu-degree">{e.degree}</h3>
                  <p className="ab-edu-school">
                    {e.schoolUrl ? (
                      <a href={e.schoolUrl} target="_blank" rel="noopener noreferrer">
                        {e.school} <ExternalIcon />
                      </a>
                    ) : (
                      e.school
                    )}
                    <span className="ab-edu-loc"> · {e.location}</span>
                  </p>
                  <p className="ab-edu-courses">{e.coursework.join(' · ')}</p>
                </div>
                <div className="ab-edu-meta">
                  <span className="mono">{e.period}</span>
                  <span className="mono ab-edu-gpa">GPA {e.gpa}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Beyond work ──────────────────────────────────────────────── */}
      <Section className="ab-beyond">
        <Container>
          <header className="section-head">
            <div>
              <p className="eyebrow">Elsewhere</p>
              <h2 className="section-title">Outside the terminal</h2>
            </div>
          </header>

          <ul className="ab-beyond-grid">
            {BEYOND.map((b) => (
              <li key={b.label} className="ab-beyond-item card">
                <h3 className="ab-beyond-label">
                  <Link to={b.to} className="card-link">
                    {b.label}
                  </Link>
                </h3>
                <p className="ab-beyond-body">{b.body}</p>
                <span className="ab-beyond-cta" aria-hidden="true">
                  Open <ArrowIcon />
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────
          Rendered visibly as well as in JSON-LD. Google will not award an FAQ
          rich result for content that exists only in structured data. */}
      <Section className="ab-faq">
        <Container width="prose">
          <header className="section-head">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 className="section-title">Common questions</h2>
            </div>
          </header>

          <div className="ab-faq-list">
            {FAQS.map((f) => (
              <details key={f.question} className="ab-faq-item">
                <summary className="ab-faq-q">{f.question}</summary>
                <p className="ab-faq-a">{f.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Section className="ab-cta">
        <Container>
          <div className="cta-panel cta-panel--lg">
            <p className="eyebrow">Open to work</p>
            <h2 className="cta-title">
              Currently at {current?.company}, and open to what is next.
            </h2>
            <p className="cta-body">{AVAILABILITY.detail}</p>
            <div className="cta-actions">
              <Button href={`mailto:${EMAIL}`} icon={<ArrowIcon />}>
                {EMAIL}
              </Button>
              <Button href={PROFILES.cal} variant="ghost" icon={<ExternalIcon />}>
                Book 30 minutes
              </Button>
              <Button to="/contact" variant="quiet">
                Other ways to reach me
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
