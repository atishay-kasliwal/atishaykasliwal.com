import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { blogPostingSchema } from '../seo/schema.js';
import { resolveMeta, seoTitle, seoDescription } from '../seo/routes.js';
import { Container, Breadcrumbs, Tag, ArrowIcon } from '../components/ui';
import {
  formatPostDate,
  getPostBySlug,
  getRelatedPosts,
} from '../lib/content/publicContent.js';
import NotFoundPage from './NotFoundPage';
import './BlogPostPage.css';

/**
 * /blog/:slug — article view.
 *
 * One column, top to bottom: header, lead image, article, related posts.
 *
 * There is no table of contents. It began as a sticky sidebar, which pushed the
 * body off centre and left a column of empty space tracking down the page on
 * wide screens; moving it above the text fixed that but put a block of links
 * between the reader and the first sentence. These posts run three to eight
 * minutes — short enough that scrolling is a better index than a list of
 * headings, and the reading-progress bar already answers "how much is left".
 *
 * The HTML is already compiled, highlighted, and heading-anchored by
 * scripts/build-content.mjs, so this renders it directly. dangerouslySetInnerHTML
 * is safe here in a way it usually is not: the source is markdown files in this
 * repo, authored by the site owner, transformed at build time. There is no
 * user-supplied content anywhere in the path.
 */
export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const articleRef = useRef(null);
  const [progress, setProgress] = useState(0);

  /* Copy buttons on code blocks. Attached after render rather than authored
     into the HTML so the compiled markup stays framework-agnostic. */
  useEffect(() => {
    const root = articleRef.current;
    if (!root || !post) return;

    const cleanups = [];

    root.querySelectorAll('.code-block[data-code]').forEach((block) => {
      if (block.querySelector('.code-copy')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');

      const onClick = async () => {
        try {
          const code = atob(block.dataset.code);
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied';
          btn.classList.add('is-copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('is-copied');
          }, 1600);
        } catch {
          btn.textContent = 'Failed';
        }
      };

      btn.addEventListener('click', onClick);
      block.appendChild(btn);
      cleanups.push(() => btn.removeEventListener('click', onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [post]);

  /* Reading progress, rAF-throttled. This used to also track which heading was
     nearest the top, to highlight the active TOC entry; with the TOC gone that
     work had no consumer and came out. */
  useEffect(() => {
    if (!post) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = articleRef.current;
        if (el) {
          const total = el.offsetHeight - window.innerHeight;
          const scrolled = window.scrollY - el.offsetTop;
          setProgress(total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0);
        }
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [post]);

  if (!post) return <NotFoundPage />;

  const path = `/blog/${post.slug}`;
  const breadcrumbs = [
    { name: 'Writing', path: '/blog' },
    { name: post.title, path },
  ];
  const meta = resolveMeta(path, {
    path,
    title: seoTitle(post.title),
    description: seoDescription(post.description),
    ogType: 'article',
    breadcrumbs,
  });
  const related = getRelatedPosts(post.slug, 3);

  return (
    <>
      <Seo
        path={path}
        overrides={{
          path,
          title: meta.title,
          description: post.description,
          ogType: 'article',
          breadcrumbs,
          image: post.image
            ? { url: post.image, width: 1200, height: 630, alt: post.title }
            : undefined,
        }}
        schema={[blogPostingSchema(post)]}
      />

      {/* Presentational only — the scrollbar carries the same information, so
          it is hidden from assistive tech. */}
      <div className="read-progress" aria-hidden="true">
        <div className="read-progress-bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <article className="post">
        <Container width="prose">
          <header className="post-header">
            <Breadcrumbs items={breadcrumbs} />

            <div className="post-meta">
              <time className="mono" dateTime={post.date}>
                {formatPostDate(post.date)}
              </time>
              <span aria-hidden="true">·</span>
              <span className="mono">{post.readingTime} min read</span>
              <span aria-hidden="true">·</span>
              <span className="mono">{post.wordCount.toLocaleString()} words</span>
            </div>

            <h1 className="post-title">{post.title}</h1>
            <p className="post-desc">{post.description}</p>

            <ul className="tag-list post-tags">
              {post.tags.map((t) => (
                <li key={t}>
                  <Tag>{t}</Tag>
                </li>
              ))}
            </ul>
          </header>

          {/* Lead image, in a short banner crop rather than the tile's native
              16:9. The header above it already runs to a full screen — date,
              reading time, word count, title, description, tags — so a
              540px-tall image on top of that pushed the first sentence out of
              view entirely. The banner keeps the visual break without costing
              the opening paragraph its place.

              Falls back to the plate drawn for this post by
              scripts/build-images.mjs. Set `image:` in the post's frontmatter
              to override it. */}
          <div className="post-hero">
            <img
              src={post.image || `/blog/${post.slug}-tile.jpg`}
              alt=""
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div
            className="post-body"
            ref={articleRef}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <footer className="post-footer">
            <Link to="/blog" className="post-back">
              <span aria-hidden="true">←</span>
              All writing
            </Link>

            {related.length > 0 && (
              <section className="post-related" aria-labelledby="related-heading">
                <h2 id="related-heading" className="post-related-title">
                  Keep reading
                </h2>
                <ul>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/blog/${r.slug}`}>
                        <span className="post-related-name">{r.title}</span>
                        <span className="post-related-meta mono">{r.readingTime} min</span>
                        <ArrowIcon />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </footer>
        </Container>
      </article>
    </>
  );
}
