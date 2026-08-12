import React from 'react';
import { Link } from 'react-router-dom';
import BrowseRail from './BrowseRail';
import { formatPostDate, getLatestPosts, getPosts } from '../../lib/content/publicContent.js';
import './BlogCollage.css';

/**
 * Writing, as a row that matches the project rows above it.
 *
 * Same rail, same tile size, same caption treatment — the page reads as one
 * system rather than as a browse UI with a different-looking appendix bolted
 * underneath.
 *
 * Two deliberate differences from a project tile:
 *
 *   1. No hover preview. There is nothing to play; a post is text, and mounting
 *      a video element for it would be pretending otherwise.
 *   2. No detail overlay. A project tile opens an overlay because a project has
 *      several possible destinations (demo, case study, source, write-up) and
 *      the visitor should choose. A post has exactly one — the post — so the
 *      tile is a plain link straight to it. An interstitial that exists only to
 *      show a single button is friction.
 *
 * Posters come from scripts/build-images.mjs, which draws each post a plate
 * from the same family as the project tiles. A post that sets `image:` in its
 * frontmatter overrides that.
 *
 * Classes are namespaced `blog-tile*`, NOT `blog-list*`: BlogPage.css already
 * owns a global `.blog-list`, and the collision silently zeroed this section's
 * padding because that file loads later.
 */
export default function BlogCollage({ limit = 5 }) {
  if (!getPosts().length) return null;

  const posts = getLatestPosts(limit);

  return (
    <BrowseRail title="Blog" action={{ to: '/blog', label: 'All writing' }}>
      {posts.map((post) => (
        <li key={post.slug} className="browse-card">
          <article className="browse-card__inner">
            <Link to={`/blog/${post.slug}`} className="browse-card__link">
              <span className="browse-card__media">
                <img
                  src={post.image || `/blog/${post.slug}-tile.jpg`}
                  alt=""
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
                <span className="browse-card__scrim" aria-hidden="true" />
              </span>

              <span className="browse-card__status blog-tile__status">
                {post.readingTime} min
              </span>

              <span className="browse-card__caption">
                <span className="browse-card__meta">
                  {post.category} · {formatPostDate(post.date)}
                </span>
                <span className="browse-card__title">{post.title}</span>
                {post.description && (
                  <span className="browse-card__tagline">{post.description}</span>
                )}
              </span>
            </Link>
          </article>
        </li>
      ))}
    </BrowseRail>
  );
}
