import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { projectSchema, webPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, Breadcrumbs, Button, TagList, ArrowIcon, ExternalIcon } from '../components/ui';
import { getProject, PROJECTS } from '../data/projects.js';
import NotFoundPage from './NotFoundPage';
import './ProjectDetailPage.css';

/**
 * /projects/:slug — the full case study.
 *
 * Structure follows how these are actually read: problem first (does this
 * matter), metrics next (did it work), then architecture and decisions for
 * whoever is still reading. Lessons last, because they are the part that
 * signals judgment rather than output.
 */
export default function ProjectDetailPage() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFoundPage />;

  const path = `/projects/${project.slug}`;
  const meta = resolveMeta(path, {
    path,
    title: `${project.name} — ${project.tagline.replace(/\.$/, '')}`,
    description: project.problem.slice(0, 158),
    breadcrumbs: [
      { name: 'Projects', path: '/projects' },
      { name: project.name, path },
    ],
  });

  const others = PROJECTS.filter((p) => p.slug !== project.slug).slice(0, 3);

  return (
    <>
      <Seo
        path={path}
        overrides={{
          path,
          title: meta.title,
          description: meta.description,
          breadcrumbs: meta.breadcrumbs,
        }}
        schema={[webPageSchema(meta), projectSchema(project)]}
      />

      <article className="case">
        <header className="case-header">
          <Container>
            <Breadcrumbs items={meta.breadcrumbs} />

            <div className="case-head-meta">
              <span className="mono case-cat">{project.category}</span>
              <span className={`case-status case-status--${project.status.toLowerCase()}`}>
                {project.status}
              </span>
              <span className="mono case-timeline">{project.timeline}</span>
            </div>

            <h1 className="case-title">{project.name}</h1>
            <p className="lede case-tagline">{project.tagline}</p>

            <p className="case-role mono">{project.role}</p>

            <div className="case-actions">
              {project.demo && (
                <Button href={project.demo} icon={<ExternalIcon />}>
                  {project.demo.startsWith('http') ? 'Visit live site' : 'Open demo'}
                </Button>
              )}
              {project.github && (
                <Button href={project.github} variant="ghost" icon={<ExternalIcon />}>
                  Source on GitHub
                </Button>
              )}
            </div>
          </Container>
        </header>

        {project.metrics?.length > 0 && (
          <section className="case-metrics-band" aria-label="Key results">
            <Container>
              <dl className="case-metrics">
                {project.metrics.map((m) => (
                  <div key={m.label} className="case-metric">
                    <dd className="case-metric-value tabular">{m.value}</dd>
                    <dt className="case-metric-label">{m.label}</dt>
                  </div>
                ))}
              </dl>
            </Container>
          </section>
        )}

        <Container width="prose">
          <Section className="case-body">
            <section className="case-section">
              <h2 className="case-h2">The problem</h2>
              <p>{project.problem}</p>
            </section>

            {project.approach && (
              <section className="case-section">
                <h2 className="case-h2">Approach</h2>
                <p>{project.approach}</p>
              </section>
            )}

            {project.architecture?.length > 0 && (
              <section className="case-section">
                <h2 className="case-h2">Architecture</h2>
                <ol className="case-arch">
                  {project.architecture.map((step, i) => (
                    <li key={step}>
                      <span className="case-arch-num mono" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {project.decisions?.length > 0 && (
              <section className="case-section">
                <h2 className="case-h2">Design decisions</h2>
                <div className="case-decisions">
                  {project.decisions.map((d) => (
                    <div key={d.decision} className="case-decision">
                      <h3 className="case-decision-title">{d.decision}</h3>
                      <p className="case-decision-body">{d.rationale}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {project.challenges?.length > 0 && (
              <section className="case-section">
                <h2 className="case-h2">What was hard</h2>
                <ul className="case-list">
                  {project.challenges.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            )}

            {project.lessons?.length > 0 && (
              <section className="case-section">
                <h2 className="case-h2">What I took from it</h2>
                <ul className="case-list case-list--lessons">
                  {project.lessons.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="case-section">
              <h2 className="case-h2">Stack</h2>
              <TagList items={project.stack} />
            </section>
          </Section>
        </Container>

        <Section className="case-more">
          <Container>
            <h2 className="section-title">Other work</h2>
            <ul className="case-more-grid">
              {others.map((p) => (
                <li key={p.slug} className="card case-more-card">
                  <span className="mono case-more-cat">{p.category}</span>
                  <h3 className="case-more-title">
                    <Link to={`/projects/${p.slug}`} className="card-link">
                      {p.name}
                    </Link>
                  </h3>
                  <p className="case-more-tagline">{p.tagline}</p>
                  <span className="case-more-cta" aria-hidden="true">
                    Read <ArrowIcon />
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      </article>
    </>
  );
}
