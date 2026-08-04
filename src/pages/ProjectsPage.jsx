import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { collectionPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, Tag, TagList, ArrowIcon } from '../components/ui';
import { PROJECTS, PROJECT_CATEGORIES } from '../data/projects.js';
import { abs } from '../data/site.js';
import './ProjectsPage.css';

/**
 * /projects — case study index with client-side category filtering.
 *
 * The filter is deliberately not routed through the URL. These are five items;
 * a querystring would add history entries and a re-render for no navigational
 * benefit. If the list grows past ~20, revisit that.
 */
export default function ProjectsPage() {
  const meta = resolveMeta('/projects');
  const [filter, setFilter] = useState('All');

  const visible = useMemo(
    () => (filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter]
  );

  const schema = collectionPageSchema(
    meta,
    PROJECTS.map((p) => ({ url: abs(`/projects/${p.slug}`), name: p.name }))
  );

  return (
    <>
      <Seo path="/projects" schema={[schema]} />

      <PageHeader
        eyebrow="Projects"
        title="Systems I have designed, shipped, and operated."
        lede="Each of these is a full case study — the problem, the architecture, the decisions I would defend, and the numbers. Not a screenshot gallery."
        breadcrumbs={meta.breadcrumbs}
      />

      <Section>
        <Container>
          <div className="proj-filters" role="group" aria-label="Filter projects by category">
            <Tag
              as="button"
              type="button"
              active={filter === 'All'}
              aria-pressed={filter === 'All'}
              onClick={() => setFilter('All')}
            >
              All ({PROJECTS.length})
            </Tag>
            {PROJECT_CATEGORIES.map((cat) => {
              const count = PROJECTS.filter((p) => p.category === cat).length;
              return (
                <Tag
                  key={cat}
                  as="button"
                  type="button"
                  active={filter === cat}
                  aria-pressed={filter === cat}
                  onClick={() => setFilter(cat)}
                >
                  {cat} ({count})
                </Tag>
              );
            })}
          </div>

          {/* aria-live so filtering announces the new count to screen readers,
              which otherwise get no feedback that anything changed. */}
          <p className="sr-only" role="status" aria-live="polite">
            Showing {visible.length} of {PROJECTS.length} projects
          </p>

          <ul className="proj-grid">
            {visible.map((p) => (
              <li key={p.slug} className="proj-card card">
                <div className="proj-card-head">
                  <span className="proj-card-cat mono">{p.category}</span>
                  <span className={`proj-card-status proj-card-status--${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </div>

                <h2 className="proj-card-title">
                  <Link to={`/projects/${p.slug}`} className="card-link">
                    {p.name}
                  </Link>
                </h2>

                <p className="proj-card-tagline">{p.tagline}</p>

                {p.metrics?.length > 0 && (
                  <dl className="proj-card-metrics">
                    {p.metrics.slice(0, 3).map((m) => (
                      <div key={m.label}>
                        <dd className="proj-card-metric-value tabular">{m.value}</dd>
                        <dt className="proj-card-metric-label">{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                )}

                <TagList items={p.stack.slice(0, 5)} className="proj-card-stack" />

                <span className="proj-card-cta" aria-hidden="true">
                  Read case study <ArrowIcon />
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
