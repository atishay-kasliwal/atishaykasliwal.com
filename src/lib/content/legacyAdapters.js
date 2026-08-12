import posts from '../../content/generated/posts.json';
import { PROJECTS, COLLECTIONS, collectionProjects } from '../../data/projects.js';
import { ABOUT_TASTE_COLUMNS } from '../../data/aboutTaste.js';
import { PHOTOGRAPHY } from '../../data/photography.js';
import { TESTIMONIALS } from '../../data/testimonials.js';
import { JOURNEY_ENTRIES } from '../../data/journey.js';
import { SITE } from '../../data/site.js';

import ankitPhoto from '../../assets/Ankit Jain.jpeg';
import wencuiPhoto from '../../assets/Prof.jpeg';
import nehaPhoto from '../../assets/Neha gupta.jpeg';
import goldyPhoto from '../../assets/goldey.jpeg';
import daMaPhoto from '../../assets/da ma.jpeg';
import gunjanPhoto from '../../assets/gunjanjain.jpg';

const TESTIMONIAL_AVATARS = {
  'ankit-jain': ankitPhoto,
  'wencui-han': wencuiPhoto,
  'neha-gupta': nehaPhoto,
  'goldy-khanna': goldyPhoto,
  'da-ma': daMaPhoto,
  'gunjan-jain': gunjanPhoto,
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const moviesColumn = ABOUT_TASTE_COLUMNS.find((column) => column.id === 'movies');
const musicColumn = ABOUT_TASTE_COLUMNS.find((column) => column.id === 'albums');

const LEGACY_LANDING_CONFIG = {
  id: 'home',
  slug: 'home',
  title: 'Homepage',
  status: 'published',
  visibility: 'private',
  heroProjectSlugs: ['mri-tumor-viewer', 'fomc-intelligence'],
  highlightProjectSlugs: [
    'fomc-intelligence',
    'legal-rag',
    'policy-fabric',
    'atriveo',
    'mri-tumor-viewer',
  ],
  testimonialIds: [
    'ankit-jain',
    'wencui-han',
    'neha-gupta',
    'gunjan-jain',
    'goldy-khanna',
    'da-ma',
  ],
  journeyEntryIds: JOURNEY_ENTRIES.sort((a, b) => a.displayOrder - b.displayOrder).map(
    (entry) => entry.id
  ),
};

const LEGACY_SITE_SETTINGS = {
  id: 'site',
  slug: 'site',
  title: 'Site Settings',
  status: 'published',
  visibility: 'private',
  locale: SITE.language,
  timezone: 'America/New_York',
  adminTitle: 'Editorial workspace',
  photographyHeaderLabel: '/photography.doc',
  aboutTasteLabel: '/taste-index.doc',
  aboutTasteTitle: 'Off Hours',
};

export function getLegacyPosts() {
  return posts;
}

export function getLegacyPostBySlug(slug) {
  return posts.find((post) => post.slug === slug) || null;
}

export function getLegacyProjects() {
  return PROJECTS;
}

export function getLegacyProjectBySlug(slug) {
  return PROJECTS.find((project) => project.slug === slug) || null;
}

export function getLegacyProjectCollections() {
  return COLLECTIONS.map((collection) => ({
    ...collection,
    projects: collectionProjects(collection),
  }));
}

export function getLegacyPhotos() {
  return PHOTOGRAPHY;
}

export function getLegacyTestimonials() {
  return TESTIMONIALS.map((testimonial) => ({
    ...testimonial,
    avatar: TESTIMONIAL_AVATARS[testimonial.id] || testimonial.avatar || null,
  })).sort((a, b) => a.weight - b.weight);
}

export function getLegacyJourneyEntries() {
  return [...JOURNEY_ENTRIES].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getLegacyMovies() {
  return (moviesColumn?.items || []).map((item, index) => ({
    id: `movie-${slugify(item.title)}`,
    slug: slugify(item.title),
    title: item.title,
    creator: item.meta.split('/')[0]?.trim() || '',
    year: Number(item.meta.split('/')[1]?.trim()) || null,
    coverImage: item.cover || null,
    displayOrder: index + 1,
    status: 'published',
    visibility: 'public',
  }));
}

export function getLegacyTvSeries() {
  return [];
}

export function getLegacyMusicEntries() {
  return (musicColumn?.items || []).map((item, index) => ({
    id: `music-${slugify(item.title)}`,
    slug: slugify(item.title),
    title: item.title,
    creator: item.meta.split('/')[0]?.trim() || '',
    kind: item.meta.includes('track') ? 'track' : 'album',
    coverImage: item.cover || null,
    displayOrder: index + 1,
    status: 'published',
    visibility: 'public',
  }));
}

export function getLegacyMusicCollections() {
  const entries = getLegacyMusicEntries();

  return [
    {
      id: 'all-time-favorites',
      slug: 'all-time-favorites',
      title: 'All-time favorites',
      type: 'all_time',
      entryIds: entries.map((entry) => entry.id),
      status: 'published',
      visibility: 'public',
      displayOrder: 1,
    },
  ];
}

export function getLegacyLandingConfig() {
  return LEGACY_LANDING_CONFIG;
}

export function getLegacySiteSettings() {
  return LEGACY_SITE_SETTINGS;
}

export function getLegacyAboutTasteColumns() {
  return ABOUT_TASTE_COLUMNS;
}
