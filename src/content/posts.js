/**
 * Blog post index.
 *
 * Reads the artifact produced by scripts/build-content.mjs. The JSON already
 * contains rendered HTML, highlighted code, TOC, and reading time — nothing is
 * parsed at runtime, so no markdown or highlighting library reaches the client.
 */

import generated from './generated/posts.json';

export const BLOG_POSTS = generated;

export const FEATURED_POSTS = BLOG_POSTS.filter((p) => p.featured);

export const getPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug);

/** Tags with counts, most-used first — drives the /blog filter row. */
export const ALL_TAGS = (() => {
  const counts = new Map();
  for (const post of BLOG_POSTS) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
})();

/**
 * Related posts by shared tags, falling back to recency.
 *
 * Ranking on tag overlap alone leaves posts with unusual tags stranded, so
 * anything short of the requested count is topped up with the most recent
 * other posts rather than returning a half-empty row.
 */
export function relatedPosts(slug, limit = 3) {
  const post = getPost(slug);
  if (!post) return [];

  const scored = BLOG_POSTS.filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort(
      (a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date)
    );

  const related = scored.filter((s) => s.score > 0).map((s) => s.post);
  if (related.length >= limit) return related.slice(0, limit);

  const filler = scored
    .filter((s) => s.score === 0)
    .map((s) => s.post)
    .slice(0, limit - related.length);

  return [...related, ...filler];
}

export const formatPostDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
