import {
  getAboutTasteColumns,
  getJourneyEntries,
  getLandingConfig,
  getMovies,
  getMusicCollections,
  getMusicEntries,
  getPhotos,
  getPosts,
  getProjects,
  getSiteSettings,
  getTestimonials,
  getTvSeries,
} from '../../lib/content/publicContent.js';
import { buildSlugIndex, validateCollection, validateDocument, validateLandingConfig } from '../../lib/validation/cmsSchemas.js';
import { ADMIN_MODULES } from '../adminRoutes.js';
import { formatAdminDate, slugify, uniqueBy } from './adminUtils.js';

function buildTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function buildPostDocuments() {
  return getPosts().map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: post.title,
    status: 'published',
    visibility: 'public',
    contentMarkdown: post.html || post.excerpt || '',
    description: post.description || '',
    excerpt: post.excerpt || '',
    tags: post.tags || [],
    category: post.category || 'Writing',
    seoTitle: post.title,
    seoDescription: post.description || '',
    coverImage: post.image || '',
    featured: Boolean(post.featured),
    canonicalUrl: `/blog/${post.slug}`,
    createdAt: buildTimestamp(post.date),
    updatedAt: buildTimestamp(post.updated || post.date),
    publishedAt: buildTimestamp(post.date),
    readingTime: post.readingTime,
    wordCount: post.wordCount,
    toc: post.toc || [],
  }));
}

function buildProjectDocuments() {
  return getProjects().map((project, index) => ({
    id: project.slug,
    slug: project.slug,
    title: project.name,
    status: 'published',
    visibility: 'public',
    category: project.category || 'Project',
    tagline: project.tagline || '',
    timeline: project.timeline || '',
    role: project.role || '',
    href: project.href || '',
    demo: project.demo || '',
    github: project.github || '',
    stack: project.stack || [],
    metrics: project.metrics || [],
    problem: project.problem || '',
    approach: project.approach || '',
    architecture: project.architecture || [],
    decisions: project.decisions || [],
    challenges: project.challenges || [],
    lessons: project.lessons || [],
    writeupPostSlug: project.writeup || '',
    coverImage: project.image?.src || '',
    featured: Boolean(project.featured),
    displayOrder: Number.isInteger(project.spotlight) ? project.spotlight : index,
    publishedAt: buildTimestamp(`${project.year || '2026'}-01-01`),
    updatedAt: buildTimestamp(`${project.year || '2026'}-01-01`),
  }));
}

function buildPhotoDocuments() {
  return getPhotos().map((photo, index) => ({
    id: photo.id,
    slug: slugify(photo.id || `photo-${index + 1}`),
    title: `Plate ${String(photo.plate || index + 1).padStart(2, '0')}`,
    status: 'published',
    visibility: 'public',
    mediaId: photo.src,
    coverImage: photo.thumb || photo.src,
    caption: '',
    alt: '',
    gallery: 'Art',
    width: photo.width || null,
    height: photo.height || null,
    displayOrder: index,
    publishedAt: null,
    updatedAt: null,
  }));
}

function buildTestimonialDocuments() {
  return getTestimonials().map((testimonial, index) => ({
    id: testimonial.id,
    slug: testimonial.id,
    title: testimonial.name,
    status: 'published',
    visibility: 'public',
    quote: testimonial.quote,
    personName: testimonial.name,
    personRole: testimonial.role || '',
    organization: testimonial.org || '',
    avatarMediaId: testimonial.avatar || '',
    displayOrder: testimonial.weight ?? index,
    updatedAt: null,
    publishedAt: null,
  }));
}

function buildJourneyDocuments() {
  return getJourneyEntries().map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    status: 'published',
    visibility: 'public',
    role: entry.role || '',
    tag: entry.tag || '',
    date: entry.date || '',
    summary: entry.summary || '',
    coverImage: entry.image || '',
    displayOrder: entry.displayOrder || 0,
  }));
}

function buildMovieDocuments() {
  return getMovies().map((movie, index) => ({
    id: movie.id || movie.slug,
    slug: movie.slug,
    title: movie.title,
    status: movie.status || 'published',
    visibility: movie.visibility || 'public',
    creator: movie.creator || '',
    year: movie.year || null,
    watchStatus: movie.watchStatus || '',
    notes: movie.notes || '',
    coverImage: movie.coverImage || movie.cover || '',
    displayOrder: movie.displayOrder ?? index,
  }));
}

function buildTvDocuments() {
  return getTvSeries().map((series, index) => ({
    id: series.id || series.slug,
    slug: series.slug,
    title: series.title,
    status: series.status || 'published',
    visibility: series.visibility || 'public',
    creator: series.creator || '',
    watchStatus: series.watchStatus || '',
    seasons: series.seasons || null,
    notes: series.notes || '',
    coverImage: series.coverImage || '',
    displayOrder: series.displayOrder ?? index,
  }));
}

function buildMusicEntryDocuments() {
  const collections = getMusicCollections();
  const collectionIdsByEntryId = new Map();

  collections.forEach((collection) => {
    (collection.entryIds || []).forEach((entryId) => {
      const current = collectionIdsByEntryId.get(entryId) || [];
      collectionIdsByEntryId.set(entryId, [...current, collection.id]);
    });
  });

  return getMusicEntries().map((entry, index) => ({
    id: entry.id || entry.slug,
    slug: entry.slug,
    title: entry.title,
    status: entry.status || 'published',
    visibility: entry.visibility || 'public',
    creator: entry.creator || '',
    kind: entry.kind || 'album',
    collectionIds: collectionIdsByEntryId.get(entry.id) || [],
    monthKey: entry.monthKey || '',
    notes: entry.notes || '',
    coverImage: entry.coverImage || '',
    displayOrder: entry.displayOrder ?? index,
    featured: Boolean(entry.featured),
  }));
}

function buildMusicCollectionDocuments() {
  return getMusicCollections().map((collection, index) => ({
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    status: collection.status || 'published',
    visibility: collection.visibility || 'public',
    type: collection.type || 'custom',
    description: collection.description || '',
    entryIds: collection.entryIds || [],
    monthKey: collection.monthKey || '',
    displayOrder: collection.displayOrder ?? index,
  }));
}

function buildLandingDocument() {
  const landing = getLandingConfig();
  return {
    id: landing.id || 'home',
    slug: landing.slug || 'home',
    title: landing.title || 'Homepage',
    status: landing.status || 'published',
    visibility: landing.visibility || 'private',
    heroProjectSlugs: landing.heroProjectSlugs || [],
    highlightProjectSlugs: landing.highlightProjectSlugs || [],
    testimonialIds: landing.testimonialIds || [],
    journeyEntryIds: landing.journeyEntryIds || [],
    updatedAt: null,
    publishedAt: null,
  };
}

function buildSettingsDocument() {
  const settings = getSiteSettings();
  return {
    id: settings.id || 'site',
    slug: settings.slug || 'site',
    title: settings.title || 'Site settings',
    status: settings.status || 'published',
    visibility: settings.visibility || 'private',
    locale: settings.locale || 'en',
    timezone: settings.timezone || 'America/New_York',
    adminTitle: settings.adminTitle || 'Editorial workspace',
    photographyHeaderLabel: settings.photographyHeaderLabel || '',
    aboutTasteLabel: settings.aboutTasteLabel || '',
    aboutTasteTitle: settings.aboutTasteTitle || '',
  };
}

function buildMediaDocuments(collections) {
  const aboutTaste = getAboutTasteColumns();
  const tasteMedia = aboutTaste.flatMap((column) =>
    (column.items || [])
      .map((item, index) => ({
        id: `${column.id}-${slugify(item.title || `${column.id}-${index}`)}`,
        slug: `${column.id}-${slugify(item.title || `${column.id}-${index}`)}`,
        title: item.title || `${column.title} ${index + 1}`,
        kind: 'image',
        src: item.cover || '',
        alt: item.coverAlt || item.title || '',
        usage: `${column.title} module`,
      }))
      .filter((item) => item.src)
  );

  const derived = [
    ...collections.cms_projects.map((project) => ({
      id: `project-${project.slug}`,
      slug: `project-${project.slug}`,
      title: project.title,
      kind: 'image',
      src: project.coverImage,
      alt: project.title,
      usage: 'Project cover',
    })),
    ...collections.cms_photos.map((photo) => ({
      id: `photo-${photo.slug}`,
      slug: `photo-${photo.slug}`,
      title: photo.title,
      kind: 'image',
      src: photo.mediaId,
      alt: photo.alt || photo.title,
      usage: 'Photography gallery',
      width: photo.width,
      height: photo.height,
    })),
    ...collections.cms_testimonials
      .filter((item) => item.avatarMediaId)
      .map((item) => ({
        id: `testimonial-${item.slug}`,
        slug: `testimonial-${item.slug}`,
        title: item.personName,
        kind: 'image',
        src: item.avatarMediaId,
        alt: item.personName,
        usage: 'Testimonial avatar',
      })),
    ...collections.cms_music_entries
      .filter((item) => item.coverImage)
      .map((item) => ({
        id: `music-${item.slug}`,
        slug: `music-${item.slug}`,
        title: item.title,
        kind: 'image',
        src: item.coverImage,
        alt: item.title,
        usage: 'Music artwork',
      })),
    ...collections.cms_movies
      .filter((item) => item.coverImage)
      .map((item) => ({
        id: `movie-${item.slug}`,
        slug: `movie-${item.slug}`,
        title: item.title,
        kind: 'image',
        src: item.coverImage,
        alt: item.title,
        usage: 'Movie artwork',
      })),
    ...collections.cms_tv_series
      .filter((item) => item.coverImage)
      .map((item) => ({
        id: `tv-${item.slug}`,
        slug: `tv-${item.slug}`,
        title: item.title,
        kind: 'image',
        src: item.coverImage,
        alt: item.title,
        usage: 'TV artwork',
      })),
    ...tasteMedia,
  ]
    .filter((item) => item.src)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      status: 'published',
      visibility: 'public',
      kind: item.kind,
      storagePath: `cms/imported/${item.slug}`,
      src: item.src,
      alt: item.alt,
      usage: item.usage,
      width: item.width || null,
      height: item.height || null,
      fileType: item.src.split('.').slice(-1)[0]?.toUpperCase() || 'IMG',
    }));

  return uniqueBy(derived, (item) => item.src || item.id);
}

export function createLiveCollections() {
  const collections = {
    cms_posts: buildPostDocuments(),
    cms_projects: buildProjectDocuments(),
    cms_photos: buildPhotoDocuments(),
    cms_testimonials: buildTestimonialDocuments(),
    cms_journey_entries: buildJourneyDocuments(),
    cms_movies: buildMovieDocuments(),
    cms_tv_series: buildTvDocuments(),
    cms_music_entries: buildMusicEntryDocuments(),
    cms_music_collections: buildMusicCollectionDocuments(),
    cms_landing_config: [buildLandingDocument()],
    cms_site_settings: [buildSettingsDocument()],
  };

  collections.cms_media = buildMediaDocuments(collections);
  return collections;
}

function createIssue(level, title, description, href, count = null) {
  return { level, title, description, href, count };
}

export function createWorkspaceInsights(collections) {
  const issues = [];
  const validationContext = {
    collections,
    slugIndex: buildSlugIndex(collections),
  };

  const photosMissingAlt = collections.cms_photos.filter((item) => !item.alt?.trim()).length;
  if (photosMissingAlt > 0) {
    issues.push(
      createIssue(
        'warning',
        'Photos need alt text',
        `${photosMissingAlt} gallery images are missing accessibility text.`,
        '/admin/photos',
        photosMissingAlt
      )
    );
  }

  const projectsMissingWriteup = collections.cms_projects.filter((item) => !item.writeupPostSlug).length;
  if (projectsMissingWriteup > 0) {
    issues.push(
      createIssue(
        'info',
        'Projects missing linked writeups',
        `${projectsMissingWriteup} case studies do not yet link back to a companion blog post.`,
        '/admin/projects',
        projectsMissingWriteup
      )
    );
  }

  const testimonialsMissingAvatars = collections.cms_testimonials.filter(
    (item) => !item.avatarMediaId
  ).length;
  if (testimonialsMissingAvatars > 0) {
    issues.push(
      createIssue(
        'warning',
        'Testimonials missing avatars',
        `${testimonialsMissingAvatars} testimonials are still rendering without headshots.`,
        '/admin/testimonials',
        testimonialsMissingAvatars
      )
    );
  }

  const mediaWithoutDimensions = collections.cms_media.filter(
    (item) => item.kind === 'image' && (!item.width || !item.height)
  ).length;
  if (mediaWithoutDimensions > 0) {
    issues.push(
      createIssue(
        'info',
        'Media metadata can be richer',
        `${mediaWithoutDimensions} media records do not currently carry intrinsic dimensions.`,
        '/admin/media',
        mediaWithoutDimensions
      )
    );
  }

  if (collections.cms_tv_series.length === 0) {
    issues.push(
      createIssue(
        'info',
        'TV library is empty',
        'No television entries have been added to the workspace yet.',
        '/admin/tv'
      )
    );
  }

  const musicValidation = validateCollection('cms_music_entries', collections.cms_music_entries, validationContext);
  const landingValidation = validateDocument(
    'cms_landing_config',
    collections.cms_landing_config[0],
    validationContext
  );
  const landingSlotIssues = validateLandingConfig(collections.cms_landing_config[0], [...landingValidation.issues]);

  if (musicValidation.some((entry) => !entry.valid)) {
    const count = musicValidation.filter((entry) => !entry.valid).length;
    issues.push(
      createIssue(
        'warning',
        'Music entries need validation',
        `${count} music records have schema issues that should be reviewed before publishing.`,
        '/admin/music',
        count
      )
    );
  }

  if (landingSlotIssues.length > 0) {
    issues.push(
      createIssue(
        'warning',
        'Landing slots need review',
        `${landingSlotIssues.length} landing-page assignment issues were found.`,
        '/admin/landing',
        landingSlotIssues.length
      )
    );
  }

  return issues;
}

export function createOverviewMetrics(collections) {
  const contentCollections = [
    'cms_posts',
    'cms_projects',
    'cms_photos',
    'cms_testimonials',
    'cms_journey_entries',
    'cms_movies',
    'cms_tv_series',
    'cms_music_entries',
  ];

  const allContent = contentCollections.flatMap((key) => collections[key] || []);
  const published = allContent.filter((item) => item.status === 'published').length;
  const drafts = allContent.filter((item) => item.status === 'draft').length;
  const scheduled = allContent.filter((item) => item.publishedAt && new Date(item.publishedAt) > new Date()).length;
  const mediaAssets = collections.cms_media.length;
  const recentUpdates = allContent.filter((item) => item.updatedAt || item.publishedAt).length;
  const attention = createWorkspaceInsights(collections).length;

  return [
    { key: 'published', label: 'Published content', value: published },
    { key: 'drafts', label: 'Drafts', value: drafts },
    { key: 'scheduled', label: 'Scheduled items', value: scheduled },
    { key: 'media', label: 'Media assets', value: mediaAssets },
    { key: 'recent', label: 'Recent updates', value: recentUpdates },
    { key: 'attention', label: 'Needs attention', value: attention },
  ];
}

export function createRecentActivity(collections) {
  const activity = [];

  Object.entries(ADMIN_MODULES).forEach(([key, module]) => {
    if (!module.collection) return;
    (collections[module.collection] || []).forEach((item) => {
      const date = item.updatedAt || item.publishedAt || item.createdAt;
      if (!date) return;

      activity.push({
        id: `${key}-${item.id}`,
        title: item.title,
        moduleKey: key,
        moduleLabel: module.label,
        date,
        href: module.supportsEditor ? `${module.href}/${item.id}` : module.href,
        summary: `${module.singular} updated ${formatAdminDate(date)}.`,
      });
    });
  });

  return activity
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 8);
}

export function createContentBreakdown(collections) {
  return Object.values(ADMIN_MODULES)
    .filter((module) => module.collection && module.key !== 'media' && module.key !== 'landing' && module.key !== 'settings')
    .map((module) => ({
      key: module.key,
      label: module.label,
      count: (collections[module.collection] || []).length,
    }))
    .filter((item) => item.count > 0);
}

export function createCommandItems(collections) {
  const items = [];

  Object.values(ADMIN_MODULES).forEach((module) => {
    if (module.href) {
      items.push({
        id: `nav-${module.key}`,
        type: 'navigate',
        title: module.label,
        subtitle: module.description,
        href: module.href,
        icon: module.icon,
      });
    }

    if (module.supportsCreate && module.createPath) {
      items.push({
        id: `create-${module.key}`,
        type: 'create',
        title: `Create ${module.singular}`,
        subtitle: `Open a new ${module.singular.toLowerCase()} draft.`,
        href: module.createPath,
        icon: 'plus',
      });
    }
  });

  Object.entries(ADMIN_MODULES).forEach(([key, module]) => {
    if (!module.collection) return;

    (collections[module.collection] || []).forEach((item) => {
      items.push({
        id: `${key}-${item.id}`,
        type: 'content',
        title: item.title,
        subtitle: `${module.label} · ${item.status || 'draft'}`,
        href: module.supportsEditor ? `${module.href}/${item.id}` : module.href,
        icon: module.icon,
        keywords: [item.slug, item.visibility, item.personName, item.creator, item.category]
          .filter(Boolean)
          .join(' '),
      });
    });
  });

  (collections.cms_music_collections || []).forEach((item) => {
    items.push({
      id: `music-collection-${item.id}`,
      type: 'content',
      title: item.title,
      subtitle: `Music collection · ${item.status || 'draft'}`,
      href: `/admin/music/collections/${item.id}`,
      icon: 'music',
      keywords: [item.slug, item.type, item.visibility, item.monthKey].filter(Boolean).join(' '),
    });
  });

  items.push(
    {
      id: 'preview-website',
      type: 'action',
      title: 'Preview public website',
      subtitle: 'Open the public site in a new tab.',
      href: '/',
      icon: 'external',
    },
    {
      id: 'sign-out',
      type: 'action',
      title: 'Sign out',
      subtitle: 'Sign out of the private workspace.',
      action: 'signOut',
      icon: 'logout',
    }
  );

  return items;
}
