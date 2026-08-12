import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { collectionPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Breadcrumbs, Tag, EmptyState } from '../components/ui';
import { abs } from '../data/site.js';
import { formatPostDate, getAllPostTags, getPosts } from '../lib/content/publicContent.js';
import './BlogPage.css';

/**
 * /blog — post index, in a research-journal register.
 *
 * Presentation only. The data source, filtering, schema, routing, and article
 * URLs are untouched from the previous version — every post still resolves at
 * /blog/:slug, and the search and tag predicates are the same expressions.
 *
 * ── Why this does not use <PageHeader> ──────────────────────────────────────
 *
 * The shared header caps its title at 20ch (page-scope.css), and the brief
 * requires this one to hold a single line on desktop. A 63-character sentence
 * cannot do both, so the hero is local markup. Everything else — Container,
 * Breadcrumbs, Tag, the token palette — is still the shared system.
 *
 * ── Controls appear only when they are worth their weight ───────────────────
 *
 * Search and tag filters are gated on post count rather than always rendered.
 * Filtering one post is not a feature; it is two controls and a results count
 * between a reader and the only thing on the page. The predicates stay wired
 * up regardless, so nothing is lost — both reappear on their own as the archive
 * grows.
 */

/** Below this many posts, a reader scans faster than they type. */
const SEARCH_FROM = 8;
/** Below this, the tag row is longer than the list it filters. */
const TAGS_FROM = 5;

export default function BlogPage() {
  const meta = resolveMeta('/blog');
  const [tag, setTag] = useState(null);
  const [query, setQuery] = useState('');
  const posts = getPosts();
  const tags = getAllPostTags();

  const showSearch = posts.length >= SEARCH_FROM;
  const showTags = posts.length >= TAGS_FROM && tags.length > 1;

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, tag, query]);

  const schema = collectionPageSchema(
    meta,
    posts.map((p) => ({ url: abs(`/blog/${p.slug}`), name: p.title }))
  );

  return (
    <>
      <Seo path="/blog" schema={[schema]} />

      <div className="journal">
        <header className="journal-hero">
          {/* Two faint background layers: a technical rule grid and a set of
              concentric arcs. Both are pseudo-element gradients rather than
              images — nothing to download, nothing to lay out, and they scale
              to any viewport. Marked aria-hidden as pure texture. */}
          <div className="journal-hero__grid" aria-hidden="true" />
          <div className="journal-hero__rings" aria-hidden="true" />

          <Container width="wide">
            <Breadcrumbs items={meta.breadcrumbs} />

            <p className="journal-hero__label">Writing</p>

            <h1 className="journal-hero__title">
              Notes on building AI systems that survive contact with production.
            </h1>

            <p className="journal-hero__lede">
              Mostly things I got wrong first. Retrieval, evaluation, latency, and the data
              plumbing nobody puts in the demo.
            </p>
          </Container>
        </header>

        <section className="journal-body" aria-labelledby="latest-notes">
          <Container width="wide">
            {posts.length === 0 ? (
              <EmptyState
                title="Nothing published yet."
                description="First posts are in progress. The RSS feed is live if you want them when they land."
              />
            ) : (
              <>
                <div className="journal-bar">
                  <h2 className="journal-bar__title" id="latest-notes">
                    Latest notes
                  </h2>
                  <p className="journal-bar__count">
                    {String(visible.length).padStart(2, '0')}{' '}
                    {visible.length === 1 ? 'Article' : 'Articles'}
                  </p>
                </div>

                {(showSearch || showTags) && (
                  <div className="journal-controls">
                    {showSearch && (
                      <div className="journal-search">
                        <label htmlFor="blog-search-input" className="sr-only">
                          Search posts
                        </label>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <input
                          id="blog-search-input"
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search notes…"
                          autoComplete="off"
                        />
                      </div>
                    )}

                    {showTags && (
                      <div className="journal-tags" role="group" aria-label="Filter by tag">
                        <Tag
                          as="button"
                          type="button"
                          active={tag === null}
                          aria-pressed={tag === null}
                          onClick={() => setTag(null)}
                        >
                          All
                        </Tag>
                        {tags.map(({ tag: t, count }) => (
                          <Tag
                            key={t}
                            as="button"
                            type="button"
                            active={tag === t}
                            aria-pressed={tag === t}
                            onClick={() => setTag(tag === t ? null : t)}
                          >
                            {t} ({count})
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="sr-only" role="status" aria-live="polite">
                  {visible.length} post{visible.length === 1 ? '' : 's'} shown
                </p>

                {visible.length === 0 ? (
                  <p className="journal-empty">No notes match that search.</p>
                ) : (
                  <ul className="journal-grid">
                    {visible.map((post) => (
                      <NoteCard key={post.slug} post={post} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </Container>
        </section>
      </div>
    </>
  );
}

/**
 * One article card. Uniform width and height across the row — the grid stretches
 * every cell, the link fills its cell, and the footer is pushed down with an
 * auto margin so the tag/CTA row sits on the same baseline regardless of how
 * long the title or description runs.
 */
function NoteCard({ post }) {
  return (
    <li className="note">
      <article className="note__inner">
        <Link to={`/blog/${post.slug}`} className="note__link">
          {/* Cover art is the generated plate from scripts/build-images.mjs —
              abstract technical geometry in the site palette, no photography.
              A post that sets `image:` in its frontmatter overrides it. */}
          <span className="note__cover">
            <img
              src={post.image || `/blog/${post.slug}-tile.jpg`}
              alt=""
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
          </span>

          <span className="note__body">
            <span className="note__meta">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span className="note__dot" aria-hidden="true" />
              <span>{post.readingTime} min read</span>
            </span>

            <h3 className="note__title">{post.title}</h3>

            <span className="note__desc">{post.description}</span>

            <span className="note__foot">
              {post.tags?.length > 0 && (
                <span className="note__tags">
                  {post.tags.slice(0, 3).map((t) => (
                    <span key={t} className="note__tag">
                      {t}
                    </span>
                  ))}
                </span>
              )}

              <span className="note__cta">
                Read note
                <span className="note__arrow" aria-hidden="true">
                  ↗
                </span>
              </span>
            </span>
          </span>
        </Link>
      </article>
    </li>
  );
}
