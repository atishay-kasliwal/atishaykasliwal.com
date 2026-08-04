import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { webPageSchema, publicationSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, EmptyState, Button, ArrowIcon, ExternalIcon } from '../components/ui';
import { RESEARCH_AREAS, PUBLICATIONS } from '../data/authority.js';
import './ResearchPage.css';

/**
 * /research — active research threads, plus publications once they exist.
 *
 * The publications block renders nothing until src/data/authority.js has real
 * entries. It is wired end-to-end (ScholarlyArticle JSON-LD included), so
 * adding one entry there lights up the whole section.
 */
export default function ResearchPage() {
  const meta = resolveMeta('/research');
  const pubSchema = PUBLICATIONS.map(publicationSchema);

  return (
    <>
      <Seo path="/research" schema={[webPageSchema(meta), ...pubSchema]} />

      <PageHeader
        eyebrow="Research"
        title="Applied research, mostly where models meet real constraints."
        lede="Two threads: what central bank language actually predicts, and how to deploy medical imaging models without moving patient data."
        breadcrumbs={meta.breadcrumbs}
      />

      <Section>
        <Container>
          <h2 className="section-title">Areas</h2>
          <ul className="research-list">
            {RESEARCH_AREAS.map((area) => (
              <li key={area.id} className="research-item card">
                <div className="research-head">
                  <span className={`research-status research-status--${area.status.toLowerCase()}`}>
                    {area.status}
                  </span>
                  <span className="mono research-period">{area.period}</span>
                </div>

                <h3 className="research-title">{area.title}</h3>
                <p className="research-affil mono">{area.affiliation}</p>
                <p className="research-summary">{area.summary}</p>

                {area.relatedProject && (
                  <Link className="research-link" to={`/projects/${area.relatedProject}`}>
                    Read the case study <ArrowIcon />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <h2 className="section-title">Publications</h2>

          {PUBLICATIONS.length === 0 ? (
            <EmptyState
              title="No published papers yet."
              description="Research is ongoing and unpublished. When papers appear they will be listed here with full citations and links. In the meantime, the engineering behind the research is written up as case studies."
              action={
                <Button to="/projects" variant="ghost" icon={<ArrowIcon />}>
                  See the projects
                </Button>
              }
            />
          ) : (
            <ol className="pub-list">
              {PUBLICATIONS.map((pub) => (
                <li key={pub.title} className="pub-item">
                  <h3 className="pub-title">
                    {pub.url ? (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer">
                        {pub.title} <ExternalIcon />
                      </a>
                    ) : (
                      pub.title
                    )}
                  </h3>
                  <p className="pub-authors">{pub.authors?.join(', ')}</p>
                  <p className="pub-venue mono">
                    {pub.venue} · {new Date(pub.date).getFullYear()}
                  </p>
                  {pub.abstract && <p className="pub-abstract">{pub.abstract}</p>}
                </li>
              ))}
            </ol>
          )}
        </Container>
      </Section>
    </>
  );
}
