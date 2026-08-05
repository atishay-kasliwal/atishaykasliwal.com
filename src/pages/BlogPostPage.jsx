import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { blogPostingSchema } from '../seo/schema.js';
import { resolveMeta, seoTitle, seoDescription } from '../seo/routes.js';
import { Container, Breadcrumbs, Tag, ArrowIcon } from '../components/ui';
import { getPost, relatedPosts, formatPostDate } from '../content/posts.js';
import { FULL_NAME, IMAGES } from '../data/site.js';
import NotFoundPage from './NotFoundPage';
import './BlogPostPage.css';

/**
 * /blog/:slug — article view.
 *
 * The HTML is already compiled, highlighted, and heading-anchored by
 * scripts/build-content.mjs, so this renders it directly. dangerouslySetInnerHTML
 * is safe here in a way it usually is not: the source is markdown files in this
 * repo, authored by the site owner, transformed at build time. There is no
 * user-supplied content anywhere in the path.
 */
export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPost(slug);
  const articleRef = useRef(null);
  const [activeHeading, setActiveHeading] = useState(null);
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

  /* Scroll progress + active TOC entry, in one rAF-throttled listener. */
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

          // The heading nearest the top of the viewport wins.
          const headings = [...el.querySelectorAll('h2[id], h3[id]')];
          const current = headings.filter((h) => h.getBoundingClientRect().top <= 120).pop();
          setActiveHeading(current?.id ?? null);
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
  const related = relatedPosts(post.slug, 3);

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

      {/* Presentational only — the same information is in the TOC and the
          scrollbar, so it is hidden from assistive tech. */}
      <div className="read-progress" aria-hidden="true">
        <div className="read-progress-bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <article className="post">
        <header className="post-header">
          <Container width="prose">
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
            <p className="lede post-desc">{post.description}</p>

            <ul className="tag-list post-tags">
              {post.tags.map((t) => (
                <li key={t}>
                  <Tag>{t}</Tag>
                </li>
              ))}
            </ul>
          </Container>
        </header>

        <div className="post-layout">
          <Container>
            <div className="post-columns">
              {post.toc?.length > 2 && (
                <nav className="post-toc" aria-label="Table of contents">
                  <p className="post-toc-title mono">Contents</p>
                  <ol>
                    {post.toc.map((h) => (
                      <li key={h.id} className={`post-toc-item post-toc-item--h${h.depth}`}>
                        <a
                          href={`#${h.id}`}
                          className={activeHeading === h.id ? 'is-active' : undefined}
                          aria-current={activeHeading === h.id ? 'location' : undefined}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <div
                className="post-body"
                ref={articleRef}
                dangerouslySetInnerHTML={{ __html: post.html }}
              />
            </div>
          </Container>
        </div>

        <footer className="post-footer">
          <Container width="prose">
            <div className="post-author">
              <img
                src={IMAGES.headshot.src}
                width="56"
                height="56"
                alt=""
                loading="lazy"
                decoding="async"
                className="post-author-avatar"
              />
              <div>
                <p className="post-author-name">{FULL_NAME}</p>
                <p className="post-author-bio">
                  AI Engineer in New York. <Link to="/about">More about me</Link> or{' '}
                  <Link to="/contact">get in touch</Link>.
                </p>
              </div>
            </div>

            {related.length > 0 && (
              <section className="post-related" aria-labelledby="related-heading">
                <h2 id="related-heading" className="post-related-title">
                  Related
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
          </Container>
        </footer>
      </article>
    </>
  );
}
