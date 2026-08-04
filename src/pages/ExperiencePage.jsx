import React from 'react';
import Seo from '../seo/Seo';
import { webPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, Button, TagList, ArrowIcon, DownloadIcon } from '../components/ui';
import { EXPERIENCE, yearsOfExperience } from '../data/experience.js';
import { EDUCATION } from '../data/education.js';
import { RESUME_PDF } from '../data/site.js';
import './ExperiencePage.css';

/**
 * /experience — the full professional record as a timeline.
 *
 * Metrics are pulled out of each bullet and rendered as their own element so a
 * recruiter scanning the page reads the numbers first and the prose only if the
 * number interests them. That is the actual reading pattern; the layout should
 * match it rather than fight it.
 */
export default function ExperiencePage() {
  const meta = resolveMeta('/experience');

  return (
    <>
      <Seo path="/experience" schema={[webPageSchema(meta)]} />

      <PageHeader
        eyebrow="Experience"
        title="Where I have worked and what shipped."
        lede={`${yearsOfExperience()} years across university research, healthcare AI, and financial infrastructure at enterprise scale.`}
        breadcrumbs={meta.breadcrumbs}
      >
        <Button href={RESUME_PDF} download icon={<DownloadIcon />}>
          Download résumé
        </Button>
      </PageHeader>

      <Section>
        <Container>
          <ol className="xp-timeline">
            {EXPERIENCE.map((job) => (
              <li key={job.id} className="xp-entry">
                <div className="xp-rail" aria-hidden="true">
                  <span className={`xp-dot${job.current ? ' is-current' : ''}`} />
                </div>

                <article className="xp-card">
                  <header className="xp-head">
                    <div className="xp-head-main">
                      <h2 className="xp-role">{job.role}</h2>
                      <p className="xp-company">
                        {job.companyUrl ? (
                          <a href={job.companyUrl} target="_blank" rel="noopener noreferrer">
                            {job.company}
                          </a>
                        ) : (
                          job.company
                        )}
                        <span className="xp-sep" aria-hidden="true">·</span>
                        <span className="xp-location">{job.location}</span>
                      </p>
                    </div>
                    <div className="xp-head-meta">
                      <span className="xp-period mono">{job.period}</span>
                      <span className={`xp-badge xp-badge--${job.type.toLowerCase().replace(/\s/g, '-')}`}>
                        {job.current ? 'Current' : job.type}
                      </span>
                    </div>
                  </header>

                  <p className="xp-summary">{job.summary}</p>

                  {job.clients?.length > 0 && (
                    <p className="xp-clients">
                      <span className="xp-clients-label">Clients</span>
                      {job.clients.join(', ')}
                    </p>
                  )}

                  <ul className="xp-highlights">
                    {job.highlights.map((h) => (
                      <li key={h.text} className="xp-highlight">
                        {h.metric && (
                          <span className="xp-metric">
                            <span className="xp-metric-value tabular">{h.metric}</span>
                            <span className="xp-metric-label">{h.metricLabel}</span>
                          </span>
                        )}
                        <span className="xp-highlight-text">{h.text}</span>
                      </li>
                    ))}
                  </ul>

                  <TagList items={job.stack} className="xp-stack" />
                </article>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="xp-education">
        <Container>
          <h2 className="section-title">Education</h2>
          <ul className="xp-edu-list">
            {EDUCATION.map((e) => (
              <li key={e.id} className="xp-edu-item">
                <div className="xp-edu-main">
                  <h3 className="xp-edu-degree">{e.degree}</h3>
                  <p className="xp-edu-school">
                    {e.school} · {e.location}
                  </p>
                  <p className="xp-edu-courses">{e.coursework.join(' · ')}</p>
                </div>
                <div className="xp-edu-meta">
                  <span className="xp-period mono">{e.period}</span>
                  <span className="xp-edu-gpa mono">GPA {e.gpa}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="cta-panel">
            <h2 className="cta-title">Want the full detail?</h2>
            <p className="cta-body">
              The résumé has everything in one page, and I am happy to walk through any of it.
            </p>
            <div className="cta-actions">
              <Button href={RESUME_PDF} download icon={<DownloadIcon />}>
                Download résumé
              </Button>
              <Button to="/contact" variant="ghost" icon={<ArrowIcon />}>
                Get in touch
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
