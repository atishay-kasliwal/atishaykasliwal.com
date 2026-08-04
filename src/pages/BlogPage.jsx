import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { collectionPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, Tag, EmptyState, ArrowIcon } from '../components/ui';
import { BLOG_POSTS, ALL_TAGS, formatPostDate } from '../content/posts.js';
import { abs } from '../data/site.js';
import './BlogPage.css';

/**
 * /blog — post index with tag filtering and a text search over titles,
 * descriptions, and excerpts.
 *
 * Search runs against the excerpt rather than the full article body: the
 * compiled JSON already truncates it, which keeps the client bundle from
 * carrying every word of every post just to support filtering.
 */
export default function BlogPage() {
  const meta = resolveMeta('/blog');
  const [tag, setTag] = useState(null);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return BLOG_POSTS.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [tag, query]);

  const schema = collectionPageSchema(
    meta,
    BLOG_POSTS.map((p) => ({ url: abs(`/blog/${p.slug}`), name: p.title }))
  );

  return (
    <>
      <Seo path="/blog" schema={[schema]} />

      <PageHeader
        eyebrow="Writing"
        title="Notes on building AI systems that survive contact with production."
        lede="Mostly things I got wrong first. Retrieval, evaluation, latency, and the data plumbing nobody puts in the demo."
        breadcrumbs={meta.breadcrumbs}
      />

      <Section>
        <Container>
          {BLOG_POSTS.length === 0 ? (
            <EmptyState
              title="Nothing published yet."
              description="First posts are in progress. The RSS feed is live if you want them when they land."
            />
          ) : (
            <>
              <div className="blog-controls">
                <div className="blog-search">
                  <label htmlFor="blog-search-input" className="sr-only">
                    Search posts
                  </label>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    id="blog-search-input"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts…"
                    autoComplete="off"
                  />
                </div>

                {ALL_TAGS.length > 0 && (
                  <div className="blog-tags" role="group" aria-label="Filter by tag">
                    <Tag
                      as="button"
                      type="button"
                      active={tag === null}
                      aria-pressed={tag === null}
                      onClick={() => setTag(null)}
                    >
                      All
                    </Tag>
                    {ALL_TAGS.map(({ tag: t, count }) => (
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

              <p className="sr-only" role="status" aria-live="polite">
                {visible.length} post{visible.length === 1 ? '' : 's'} shown
              </p>

              {visible.length === 0 ? (
                <p className="blog-noresults">No posts match that search.</p>
              ) : (
                <ul className="blog-list">
                  {visible.map((post) => (
                    <li key={post.slug} className="blog-item">
                      <article>
                        <div className="blog-item-meta">
                          <time className="mono" dateTime={post.date}>
                            {formatPostDate(post.date)}
                          </time>
                          <span className="blog-item-dot" aria-hidden="true">·</span>
                          <span className="mono">{post.readingTime} min read</span>
                        </div>

                        <h2 className="blog-item-title">
                          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>

                        <p className="blog-item-desc">{post.description}</p>

                        <div className="blog-item-footer">
                          <ul className="tag-list">
                            {post.tags.map((t) => (
                              <li key={t}>
                                <Tag>{t}</Tag>
                              </li>
                            ))}
                          </ul>
                          <span className="blog-item-cta" aria-hidden="true">
                            Read <ArrowIcon />
                          </span>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
