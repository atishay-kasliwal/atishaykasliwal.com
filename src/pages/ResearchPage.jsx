import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { webPageSchema, publicationSchema, conferencePaperSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, EmptyState, Button, ArrowIcon, ExternalIcon } from '../components/ui';
import { RESEARCH_AREAS, PUBLICATIONS, CONFERENCES, COURSEWORK } from '../data/authority.js';
import { FULL_NAME } from '../data/site.js';
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
  const pubSchema = [
    ...PUBLICATIONS.map(publicationSchema),
    ...CONFERENCES.map(conferencePaperSchema),
  ];

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

                  {/* Author order is meaningful in a citation, so it is rendered
                      as published, with the site owner marked rather than
                      reordered to the front. */}
                  <p className="pub-authors">
                    {pub.authors?.map((a, i) => (
                      <span key={a} className={a === FULL_NAME ? 'pub-author-self' : undefined}>
                        {a}
                        {i < pub.authors.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>

                  <p className="pub-venue mono">
                    {pub.venue}
                    {pub.volume && ` · Vol. ${pub.volume}`}
                    {pub.issue && `, Issue ${pub.issue}`}
                    {pub.pages && ` · pp. ${pub.pages}`}
                    {` · ${new Date(pub.date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}`}
                  </p>

                  {pub.abstract && <p className="pub-abstract">{pub.abstract}</p>}

                  <div className="pub-foot">
                    {pub.keywords?.length > 0 && (
                      <ul className="pub-keywords">
                        {pub.keywords.map((k) => (
                          <li key={k}>{k}</li>
                        ))}
                      </ul>
                    )}
                    <div className="pub-links">
                      {pub.pdf && (
                        <a href={pub.pdf} target="_blank" rel="noopener noreferrer">
                          PDF <ExternalIcon />
                        </a>
                      )}
                      {pub.issn && <span className="pub-issn mono">ISSN {pub.issn}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Container>
      </Section>

      {/* Conference papers. Distinct from the journal publications above —
          conflating the two overstates the record, and the distinction is one
          any academic reader checks immediately. */}
      {CONFERENCES.length > 0 && (
        <Section>
          <Container>
            <h2 className="section-title">Conference papers</h2>
            <ol className="pub-list">
              {CONFERENCES.map((c) => (
                <li key={c.title} className="pub-item">
                  <div className="conf-head">
                    <span className={`conf-role conf-role--${(c.role || '').toLowerCase()}`}>
                      {c.role}
                    </span>
                    <span className="mono conf-year">{c.year}</span>
                  </div>

                  <h3 className="pub-title">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        {c.title} <ExternalIcon />
                      </a>
                    ) : (
                      c.title
                    )}
                  </h3>

                  {c.authors?.length > 0 && (
                    <p className="pub-authors">
                      {c.authors.map((a, i) => (
                        <span key={a} className={a === FULL_NAME ? 'pub-author-self' : undefined}>
                          {a}
                          {i < c.authors.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  )}

                  <p className="pub-venue mono">
                    {c.event}
                    {c.location && ` · ${c.location}`}
                  </p>

                  {c.description && <p className="pub-abstract">{c.description}</p>}

                  {c.relatedProject && (
                    <Link className="research-link" to={`/projects/${c.relatedProject}`}>
                      Related case study <ArrowIcon />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {/* Graduate coursework — kept in its own labelled section, well away from
          the peer-reviewed work above. Course code and instructor are shown so
          the academic context is stated rather than implied. */}
      {COURSEWORK.length > 0 && (
        <Section className="cw-section">
          <Container>
            <header className="section-head">
              <div>
                <p className="eyebrow">Graduate coursework</p>
                <h2 className="section-title">Course presentations</h2>
              </div>
              <span className="mono cw-note">Stony Brook University · MS Data Science</span>
            </header>

            <ul className="cw-list">
              {COURSEWORK.map((c) => (
                <li key={c.title} className="cw-item">
                  <div className="cw-main">
                    <h3 className="cw-title">{c.title}</h3>
                    <p className="cw-course mono">
                      {c.course}
                      {c.instructor && ` · ${c.instructor}`}
                    </p>
                    <p className="cw-summary">{c.summary}</p>
                    {c.collaborators?.length > 0 && (
                      <p className="cw-collab">
                        With {c.collaborators.slice(0, 4).join(', ')}
                        {c.collaborators.length > 4 && ` and ${c.collaborators.length - 4} others`}
                      </p>
                    )}
                  </div>
                  {c.topics?.length > 0 && (
                    <ul className="cw-topics">
                      {c.topics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
