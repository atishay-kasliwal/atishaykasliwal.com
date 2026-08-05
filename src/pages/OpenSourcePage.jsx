import React from 'react';
import Seo from '../seo/Seo';
import { collectionPageSchema, webPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, EmptyState, Button, MetricRow, ExternalIcon } from '../components/ui';
import { PROFILES } from '../data/site.js';
import github from '../data/generated/github.json';
import './OpenSourcePage.css';

/**
 * /open-source — a live view of public GitHub work.
 *
 * Data comes from the build-time snapshot in scripts/fetch-github.mjs, so the
 * page is fully prerenderable and costs the visitor no API request.
 */

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });

export default function OpenSourcePage() {
  const meta = resolveMeta('/open-source');
  const { repos = [], languages = [], profile, totalStars = 0, fetchedAt } = github;

  const schema = repos.length
    ? collectionPageSchema(
        meta,
        repos.map((r) => ({ url: r.url, name: r.name }))
      )
    : webPageSchema(meta);

  return (
    <>
      <Seo path="/open-source" schema={[schema]} />

      <PageHeader
        eyebrow="Open Source"
        title="Public code."
        lede="Everything below is pulled straight from GitHub at build time — no curation, no hand-maintained list that quietly goes stale."
        breadcrumbs={meta.breadcrumbs}
      >
        <Button href={PROFILES.github} icon={<ExternalIcon />}>
          View GitHub profile
        </Button>
      </PageHeader>

      {repos.length === 0 ? (
        <Section>
          <Container>
            <EmptyState
              title="Repository data unavailable."
              description="The GitHub snapshot could not be built. The profile itself is still the source of truth."
              action={
                <Button href={PROFILES.github} variant="ghost" icon={<ExternalIcon />}>
                  Open GitHub
                </Button>
              }
            />
          </Container>
        </Section>
      ) : (
        <>
          <Section className="os-stats-section">
            <Container>
              <MetricRow
                items={[
                  { value: repos.length, label: 'public repositories' },
                  { value: languages.length, label: 'languages' },
                  { value: totalStars, label: 'stars' },
                  { value: profile?.followers ?? 0, label: 'followers' },
                ]}
              />

              <div className="os-langs">
                <h2 className="os-langs-title mono">Language distribution</h2>
                <ul className="os-lang-bar" aria-label="Repositories by language">
                  {languages.map((l) => (
                    <li
                      key={l.name}
                      className="os-lang-seg"
                      style={{ '--pct': `${(l.count / repos.length) * 100}%` }}
                      data-lang={l.name}
                    >
                      <span className="sr-only">
                        {l.name}: {l.count} repositories
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="os-lang-legend">
                  {languages.map((l) => (
                    <li key={l.name}>
                      <span className="os-lang-dot" data-lang={l.name} aria-hidden="true" />
                      {l.name}
                      <span className="os-lang-count mono">{l.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Container>
          </Section>

          <Section>
            <Container>
              <h2 className="section-title">Repositories</h2>
              <ul className="os-grid">
                {repos.map((repo) => (
                  <li key={repo.name} className="os-card card">
                    <div className="os-card-head">
                      <h3 className="os-card-name">
                        <a
                          href={repo.url}
                          className="card-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {repo.name}
                        </a>
                      </h3>
                      {repo.stars > 0 && (
                        <span className="os-card-stars mono" aria-label={`${repo.stars} stars`}>
                          ★ {repo.stars}
                        </span>
                      )}
                    </div>

                    <p className="os-card-desc">
                      {repo.description || <span className="os-card-nodesc">No description</span>}
                    </p>

                    {repo.topics?.length > 0 && (
                      <ul className="os-card-topics">
                        {repo.topics.slice(0, 4).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}

                    <div className="os-card-foot mono">
                      {repo.language && (
                        <span className="os-card-lang">
                          <span className="os-lang-dot" data-lang={repo.language} aria-hidden="true" />
                          {repo.language}
                        </span>
                      )}
                      {repo.license && <span>{repo.license}</span>}
                      <span className="os-card-updated">Updated {formatDate(repo.pushedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {fetchedAt && (
                <p className="os-fetched mono">
                  Snapshot taken {formatDate(fetchedAt)} · rebuilt on every deploy
                </p>
              )}
            </Container>
          </Section>
        </>
      )}
    </>
  );
}
