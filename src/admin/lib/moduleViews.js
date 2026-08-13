import { ADMIN_MODULES } from '../adminRoutes.js';
import { formatAdminDate } from './adminUtils.js';

export function getPreviewPath(moduleKey, document) {
  switch (moduleKey) {
    case 'blogs':
      return document?.slug ? `/blog/${document.slug}` : '/blog';
    case 'projects':
      return document?.slug ? `/projects/${document.slug}` : '/projects';
    case 'photos':
      return '/art';
    case 'testimonials':
    case 'journey':
    case 'landing':
      return '/';
    case 'movies':
    case 'tv':
    case 'music':
      return '/about';
    case 'media':
      return document?.src || '/';
    default:
      return '/';
  }
}

export const MODULE_VIEW_CONFIGS = {
  blogs: {
    searchFields: ['title', 'description', 'excerpt', 'slug', 'category', 'tags'],
    sortOptions: [
      { value: 'updated-desc', label: 'Newest updated' },
      { value: 'published-desc', label: 'Newest published' },
      { value: 'title-asc', label: 'Title A–Z' },
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'category', label: 'Category' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'publishedAt', label: 'Published' },
      { key: 'updatedAt', label: 'Updated' },
    ],
  },
  projects: {
    searchFields: ['title', 'tagline', 'slug', 'category', 'stack', 'role'],
    sortOptions: [
      { value: 'featured-desc', label: 'Featured first' },
      { value: 'title-asc', label: 'Title A–Z' },
      { value: 'updated-desc', label: 'Recently updated' },
    ],
    columns: [
      { key: 'title', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'category', label: 'Category' },
      { key: 'featured', label: 'Featured' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'updatedAt', label: 'Updated' },
    ],
  },
  photos: {
    searchFields: ['title', 'slug', 'location', 'gallery'],
    sortOptions: [
      { value: 'displayOrder-asc', label: 'Gallery order' },
      { value: 'title-asc', label: 'Title A–Z' },
    ],
    columns: [
      { key: 'title', label: 'Photo' },
      { key: 'status', label: 'Status' },
      { key: 'gallery', label: 'Gallery' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'updatedAt', label: 'Updated' },
    ],
  },
  testimonials: {
    searchFields: ['title', 'quote', 'personName', 'personRole', 'organization'],
    sortOptions: [
      { value: 'displayOrder-asc', label: 'Homepage order' },
      { value: 'title-asc', label: 'Name A–Z' },
    ],
    columns: [
      { key: 'title', label: 'Person' },
      { key: 'status', label: 'Status' },
      { key: 'organization', label: 'Organization' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'updatedAt', label: 'Updated' },
    ],
  },
  journey: {
    searchFields: ['title', 'role', 'tag', 'date'],
    sortOptions: [
      { value: 'displayOrder-asc', label: 'Timeline order' },
      { value: 'title-asc', label: 'Title A–Z' },
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'role', label: 'Role' },
      { key: 'tag', label: 'Tag' },
      { key: 'status', label: 'Status' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  movies: {
    searchFields: ['title', 'creator', 'year', 'notes'],
    sortOptions: [
      { value: 'displayOrder-asc', label: 'Display order' },
      { value: 'title-asc', label: 'Title A–Z' },
      { value: 'year-desc', label: 'Newest release' },
    ],
    columns: [
      { key: 'title', label: 'Movie' },
      { key: 'creator', label: 'Creator' },
      { key: 'year', label: 'Year' },
      { key: 'status', label: 'Status' },
      { key: 'visibility', label: 'Visibility' },
    ],
  },
  tv: {
    searchFields: ['title', 'creator', 'watchStatus', 'notes'],
    sortOptions: [
      { value: 'displayOrder-asc', label: 'Display order' },
      { value: 'title-asc', label: 'Title A–Z' },
    ],
    columns: [
      { key: 'title', label: 'Series' },
      { key: 'creator', label: 'Creator' },
      { key: 'watchStatus', label: 'Watch state' },
      { key: 'status', label: 'Status' },
      { key: 'visibility', label: 'Visibility' },
    ],
  },
  media: {
    searchFields: ['title', 'kind', 'usage', 'fileType', 'src'],
    sortOptions: [
      { value: 'title-asc', label: 'Title A–Z' },
      { value: 'kind-asc', label: 'File type' },
    ],
    columns: [
      { key: 'title', label: 'Asset' },
      { key: 'kind', label: 'Kind' },
      { key: 'usage', label: 'Usage' },
      { key: 'fileType', label: 'Type' },
    ],
  },
};

export function getModuleViewConfig(moduleKey) {
  return MODULE_VIEW_CONFIGS[moduleKey];
}

export function sortDocuments(documents, sortValue) {
  const [field, direction] = (sortValue || 'updated-desc').split('-');
  const factor = direction === 'desc' ? -1 : 1;

  return [...documents].sort((left, right) => {
    let a = left[field];
    let b = right[field];

    if (field === 'published' || field === 'publishedAt') {
      a = left.publishedAt || left.createdAt;
      b = right.publishedAt || right.createdAt;
    }

    if (field === 'updated') {
      a = left.updatedAt || left.publishedAt || left.createdAt;
      b = right.updatedAt || right.publishedAt || right.createdAt;
    }

    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    if (field.includes('At') || field === 'updated' || field === 'published') {
      return (new Date(a) - new Date(b)) * factor;
    }

    if (typeof a === 'boolean' || typeof b === 'boolean') {
      return ((a === b ? 0 : a ? -1 : 1) || 0) * factor;
    }

    if (typeof a === 'number' || typeof b === 'number') {
      return ((Number(a) || 0) - (Number(b) || 0)) * factor;
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor;
  });
}

export function filterDocuments(documents, query, filters = {}, moduleConfig) {
  const searchFields = moduleConfig?.searchFields || ['title', 'slug'];

  return documents.filter((document) => {
    const haystack = searchFields
      .flatMap((field) => {
        const value = document[field];
        if (Array.isArray(value)) return value;
        return [value];
      })
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (query && !haystack.includes(query.toLowerCase())) {
      return false;
    }

    if (filters.status && filters.status !== 'all' && document.status !== filters.status) {
      return false;
    }

    if (
      filters.visibility &&
      filters.visibility !== 'all' &&
      document.visibility !== filters.visibility
    ) {
      return false;
    }

    if (filters.kind && filters.kind !== 'all' && document.kind !== filters.kind) {
      return false;
    }

    if (
      filters.category &&
      filters.category !== 'all' &&
      String(document.category || document.type || document.tag || document.watchStatus || '').toLowerCase() !==
        filters.category.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}

export function getDocumentFieldValue(document, key) {
  switch (key) {
    case 'featured':
      return document.featured ? 'Featured' : '—';
    case 'publishedAt':
    case 'updatedAt':
      return formatAdminDate(document[key]);
    case 'displayOrder':
      return document.displayOrder ?? '—';
    case 'creator':
      return document.creator || '—';
    default:
      return document[key] || '—';
  }
}

export function getEditorSections(moduleKey, workspace) {
  const module = ADMIN_MODULES[moduleKey];
  const musicCollections = workspace?.collections?.cms_music_collections || [];
  const projectOptions = (workspace?.collections?.cms_projects || []).map((item) => ({
    label: item.title,
    value: item.slug,
  }));

  const sharedSidebar = {
    title: 'Publishing',
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'unpublished', 'archived'] },
      { key: 'visibility', label: 'Visibility', type: 'select', options: ['private', 'public', 'unlisted'] },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      { key: 'publishedAt', label: 'Publish date', type: 'datetime' },
      { key: 'displayOrder', label: 'Display order', type: 'number' },
    ],
  };

  const sharedSeo = {
    title: 'SEO',
    fields: [
      { key: 'seoTitle', label: 'SEO title', type: 'text' },
      { key: 'seoDescription', label: 'SEO description', type: 'textarea', rows: 4 },
      { key: 'coverImage', label: 'Cover image', type: 'media', mediaKind: 'image', placeholder: '/blog/cover-image.webp' },
    ],
  };

  const sharedHeader = {
    title: 'Basics',
    fields: [
      { key: 'title', label: module?.singular || 'Title', type: 'text' },
      { key: 'slug', label: 'Slug', type: 'text' },
    ],
  };

  switch (moduleKey) {
    case 'blogs':
      return {
        main: [
          sharedHeader,
          {
            title: 'Editorial',
            fields: [
              { key: 'category', label: 'Category', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
              { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 4 },
              { key: 'tags', label: 'Tags', type: 'list' },
              { key: 'relatedProjectSlugs', label: 'Related projects', type: 'multiselect', options: projectOptions },
              { key: 'contentMarkdown', label: 'Body content', type: 'textarea', rows: 14 },
            ],
          },
          sharedSeo,
        ],
        sidebar: [sharedSidebar],
      };
    case 'projects':
      return {
        main: [
          sharedHeader,
          {
            title: 'Summary',
            fields: [
              { key: 'category', label: 'Category', type: 'text' },
              { key: 'tagline', label: 'Tagline', type: 'textarea', rows: 3 },
              { key: 'timeline', label: 'Timeline', type: 'text' },
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'href', label: 'Primary link', type: 'url' },
              { key: 'demo', label: 'Demo link', type: 'url' },
              { key: 'github', label: 'GitHub link', type: 'url' },
              { key: 'stack', label: 'Tech stack', type: 'list' },
              { key: 'writeupPostSlug', label: 'Linked writeup', type: 'text' },
            ],
          },
          {
            title: 'Case study',
            fields: [
              { key: 'problem', label: 'Problem', type: 'textarea', rows: 5 },
              { key: 'approach', label: 'Approach', type: 'textarea', rows: 5 },
              { key: 'architecture', label: 'Architecture points', type: 'list' },
              { key: 'challenges', label: 'Challenges', type: 'list' },
              { key: 'lessons', label: 'Lessons', type: 'list' },
            ],
          },
          sharedSeo,
        ],
        sidebar: [sharedSidebar],
      };
    case 'photos':
      return {
        main: [
          sharedHeader,
          {
            title: 'Image details',
            fields: [
              { key: 'mediaId', label: 'Image source', type: 'media', mediaKind: 'image', placeholder: '/photography/photo.webp' },
              { key: 'caption', label: 'Caption', type: 'textarea', rows: 3 },
              { key: 'alt', label: 'Alt text', type: 'textarea', rows: 3 },
              { key: 'location', label: 'Location', type: 'text' },
              { key: 'gallery', label: 'Gallery', type: 'text' },
            ],
          },
        ],
        sidebar: [sharedSidebar],
      };
    case 'testimonials':
      return {
        main: [
          sharedHeader,
          {
            title: 'Attribution',
            fields: [
              { key: 'personName', label: 'Name', type: 'text' },
              { key: 'personRole', label: 'Role', type: 'text' },
              { key: 'organization', label: 'Organization', type: 'text' },
              { key: 'quote', label: 'Quote', type: 'textarea', rows: 6 },
              { key: 'avatarMediaId', label: 'Avatar image', type: 'media', mediaKind: 'image', placeholder: '/testimonials/person.jpg' },
            ],
          },
        ],
        sidebar: [sharedSidebar],
      };
    case 'journey':
      return {
        main: [
          sharedHeader,
          {
            title: 'Timeline details',
            fields: [
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'tag', label: 'Tag', type: 'text' },
              { key: 'date', label: 'Display date', type: 'text' },
              { key: 'summary', label: 'Summary', type: 'textarea', rows: 4 },
              { key: 'coverImage', label: 'Cover image', type: 'media', mediaKind: 'image', placeholder: '/journey/cover.webp' },
            ],
          },
        ],
        sidebar: [sharedSidebar],
      };
    case 'movies':
      return {
        main: [
          sharedHeader,
          {
            title: 'Film details',
            fields: [
              { key: 'creator', label: 'Director / creator', type: 'text' },
              { key: 'year', label: 'Release year', type: 'number' },
              { key: 'notes', label: 'Personal note', type: 'textarea', rows: 5 },
              { key: 'coverImage', label: 'Poster artwork', type: 'media', mediaKind: 'image', placeholder: '/movies/poster.webp' },
            ],
          },
        ],
        sidebar: [
          {
            ...sharedSidebar,
            fields: [
              ...sharedSidebar.fields,
              { key: 'watchStatus', label: 'Watch state', type: 'select', options: ['planned', 'watching', 'completed'] },
            ],
          },
        ],
      };
    case 'tv':
      return {
        main: [
          sharedHeader,
          {
            title: 'Series details',
            fields: [
              { key: 'creator', label: 'Creator / showrunner', type: 'text' },
              { key: 'seasons', label: 'Seasons', type: 'number' },
              { key: 'notes', label: 'Personal note', type: 'textarea', rows: 5 },
              { key: 'coverImage', label: 'Series artwork', type: 'media', mediaKind: 'image', placeholder: '/tv/series-cover.webp' },
            ],
          },
        ],
        sidebar: [
          {
            ...sharedSidebar,
            fields: [
              ...sharedSidebar.fields,
              { key: 'watchStatus', label: 'Watch state', type: 'select', options: ['planned', 'watching', 'completed'] },
            ],
          },
        ],
      };
    case 'music':
      return {
        main: [
          sharedHeader,
          {
            title: 'Music details',
            fields: [
              { key: 'creator', label: 'Artist / creator', type: 'text' },
              { key: 'kind', label: 'Entry type', type: 'select', options: ['album', 'track', 'ep', 'playlist'] },
              { key: 'monthKey', label: 'Listening month', type: 'text' },
              { key: 'collectionIds', label: 'Collections', type: 'multiselect', options: musicCollections.map((item) => ({ label: item.title, value: item.id })) },
              { key: 'notes', label: 'Personal note', type: 'textarea', rows: 5 },
              { key: 'coverImage', label: 'Artwork image', type: 'media', mediaKind: 'image', placeholder: '/music/album-cover.webp' },
            ],
          },
          sharedSeo,
        ],
        sidebar: [sharedSidebar],
      };
    case 'media':
      return {
        main: [
          sharedHeader,
          {
            title: 'Asset details',
            fields: [
              { key: 'kind', label: 'Asset type', type: 'select', options: ['image', 'video', 'document', 'audio'] },
              { key: 'src', label: 'Public source URL', type: 'url' },
              { key: 'storagePath', label: 'Storage path', type: 'text' },
              { key: 'alt', label: 'Alternative text', type: 'textarea', rows: 3 },
              { key: 'usage', label: 'Usage summary', type: 'text' },
              { key: 'width', label: 'Width', type: 'number' },
              { key: 'height', label: 'Height', type: 'number' },
              { key: 'fileType', label: 'File type', type: 'text' },
            ],
          },
        ],
        sidebar: [sharedSidebar],
      };
    default:
      return {
        main: [sharedHeader, sharedSeo],
        sidebar: [sharedSidebar],
      };
  }
}
