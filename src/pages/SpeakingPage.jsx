import React from 'react';
import Seo from '../seo/Seo';
import { webPageSchema, talkSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, EmptyState, Button, ExternalIcon, ArrowIcon } from '../components/ui';
import { TALKS } from '../data/authority.js';
import { EMAIL } from '../data/site.js';
import './SpeakingPage.css';

/**
 * /speaking.
 *
 * Currently marked `hidden` in the route registry, which keeps it out of nav
 * and the sitemap while TALKS is empty — the route still resolves so the URL is
 * never a 404, but an empty page is not advertised to crawlers. Adding a real
 * talk to src/data/authority.js and clearing `hidden` publishes it.
 */
export default function SpeakingPage() {
  const meta = resolveMeta('/speaking');
  const schema = TALKS.map(talkSchema);

  return (
    <>
      <Seo path="/speaking" schema={[webPageSchema(meta), ...schema]} />

      <PageHeader
        eyebrow="Speaking"
        title="Talks and technical presentations."
        lede="On retrieval systems, LLM evaluation, and the infrastructure side of shipping AI."
        breadcrumbs={meta.breadcrumbs}
      />

      <Section>
        <Container>
          {TALKS.length === 0 ? (
            <EmptyState
              title="No talks scheduled yet."
              description="I have not spoken publicly yet, and I would rather say that than pad this page. If you organize a meetup or conference and want a talk on production RAG, evaluation, or event-driven ML pipelines, I am interested."
              action={
                <Button href={`mailto:${EMAIL}?subject=Speaking%20enquiry`} icon={<ArrowIcon />}>
                  Invite me to speak
                </Button>
              }
            />
          ) : (
            <ul className="talk-list">
              {TALKS.map((talk) => (
                <li key={talk.title} className="talk-item card">
                  <div className="talk-meta mono">
                    {talk.date && (
                      <time dateTime={talk.date}>
                        {new Date(talk.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </time>
                    )}
                    {talk.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{talk.location}</span>
                      </>
                    )}
                  </div>

                  <h2 className="talk-title">{talk.title}</h2>
                  {talk.event && <p className="talk-event mono">{talk.event}</p>}

                  {/* Stated plainly: this was a review of another team's paper,
                      not original authorship. */}
                  {talk.presentationOf && (
                    <p className="talk-note">Presentation of {talk.presentationOf}</p>
                  )}
                  {talk.coPresenter && (
                    <p className="talk-note">Co-presented with {talk.coPresenter}</p>
                  )}

                  <p className="talk-desc">{talk.description}</p>

                  {talk.topics?.length > 0 && (
                    <ul className="talk-topics">
                      {talk.topics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}

                  <div className="talk-links">
                    {talk.slides && (
                      <a href={talk.slides} target="_blank" rel="noopener noreferrer">
                        Slides <ExternalIcon />
                      </a>
                    )}
                    {talk.video && (
                      <a href={talk.video} target="_blank" rel="noopener noreferrer">
                        Video <ExternalIcon />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
