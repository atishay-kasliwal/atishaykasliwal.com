import {
  getLegacyAboutTasteColumns,
  getLegacyJourneyEntries,
  getLegacyLandingConfig,
  getLegacyMovies,
  getLegacyMusicCollections,
  getLegacyMusicEntries,
  getLegacyPhotos,
  getLegacyPostBySlug,
  getLegacyPosts,
  getLegacyProjectBySlug,
  getLegacyProjectCollections,
  getLegacyProjects,
  getLegacySiteSettings,
  getLegacyTestimonials,
  getLegacyTvSeries,
} from './legacyAdapters.js';

const sortByDateDesc = (items, field) =>
  [...items].sort((a, b) => new Date(b[field]) - new Date(a[field]));

export function getPosts() {
  return getLegacyPosts();
}

export function getPostBySlug(slug) {
  return getLegacyPostBySlug(slug);
}

export function getProjects() {
  return getLegacyProjects();
}

export function getProjectBySlug(slug) {
  return getLegacyProjectBySlug(slug);
}

export function getProjectCollections() {
  return getLegacyProjectCollections();
}

export function getPhotos() {
  return getLegacyPhotos();
}

export function getTestimonials() {
  return getLegacyTestimonials();
}

export function getJourneyEntries() {
  return getLegacyJourneyEntries();
}

export function getMovies() {
  return getLegacyMovies();
}

export function getTvSeries() {
  return getLegacyTvSeries();
}

export function getMusicEntries() {
  return getLegacyMusicEntries();
}

export function getMusicCollections() {
  return getLegacyMusicCollections();
}

export function getLandingConfig() {
  return getLegacyLandingConfig();
}

export function getSiteSettings() {
  return getLegacySiteSettings();
}

export function getAboutTasteColumns() {
  return getLegacyAboutTasteColumns();
}

export function getFeaturedPosts() {
  return getPosts().filter((post) => post.featured);
}

export function getAllPostTags() {
  const counts = new Map();

  for (const post of getPosts()) {
    for (const tag of post.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getRelatedPosts(slug, limit = 3) {
  const post = getPostBySlug(slug);
  if (!post) return [];

  const scored = getPosts()
    .filter((candidate) => candidate.slug !== slug)
    .map((candidate) => ({
      post: candidate,
      score: (candidate.tags || []).filter((tag) => (post.tags || []).includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date));

  const related = scored.filter((entry) => entry.score > 0).map((entry) => entry.post);
  if (related.length >= limit) return related.slice(0, limit);

  return [
    ...related,
    ...scored
      .filter((entry) => entry.score === 0)
      .map((entry) => entry.post)
      .slice(0, limit - related.length),
  ];
}

export function formatPostDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getLandingTestimonials() {
  const testimonials = getTestimonials();
  const landing = getLandingConfig();
  const byId = new Map(testimonials.map((testimonial) => [testimonial.id, testimonial]));

  return landing.testimonialIds.map((id) => byId.get(id)).filter(Boolean);
}

export function getLandingJourneyEntries() {
  const entries = getJourneyEntries();
  const landing = getLandingConfig();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return landing.journeyEntryIds.map((id) => byId.get(id)).filter(Boolean);
}

export function getLatestPosts(limit = 5) {
  return sortByDateDesc(getPosts(), 'date').slice(0, limit);
}
