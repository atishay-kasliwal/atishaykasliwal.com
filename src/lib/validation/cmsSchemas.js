export const CMS_COLLECTIONS = [
  'cms_posts',
  'cms_projects',
  'cms_photos',
  'cms_testimonials',
  'cms_journey_entries',
  'cms_movies',
  'cms_tv_series',
  'cms_music_entries',
  'cms_music_collections',
  'cms_landing_config',
  'cms_media',
  'cms_site_settings',
];

export const CMS_STATUS_VALUES = ['draft', 'published', 'unpublished', 'archived', 'deleted'];
export const CMS_VISIBILITY_VALUES = ['private', 'public', 'unlisted'];
export const MEDIA_KINDS = ['image', 'video', 'document', 'audio'];
export const MUSIC_COLLECTION_TYPES = ['all_time', 'monthly', 'seasonal', 'custom'];
export const MUSIC_ENTRY_KINDS = ['album', 'track', 'ep', 'playlist'];
export const WATCH_STATUS_VALUES = ['planned', 'watching', 'completed'];

export const CMS_STATE_TRANSITIONS = {
  draft: ['published', 'archived', 'deleted'],
  published: ['unpublished', 'archived', 'deleted'],
  unpublished: ['draft', 'published', 'archived', 'deleted'],
  archived: ['draft', 'published', 'deleted'],
  deleted: [],
};

export const LANDING_SLOT_LIMITS = {
  heroProjectSlugs: 2,
  highlightProjectSlugs: 6,
  testimonialIds: 6,
  journeyEntryIds: 6,
};

export const LANDING_SLOT_COMPATIBILITY = {
  heroProjectSlugs: 'cms_projects',
  highlightProjectSlugs: 'cms_projects',
  testimonialIds: 'cms_testimonials',
  journeyEntryIds: 'cms_journey_entries',
};

const CMS_STORAGE_PREFIX = 'cms/';
const MAX_SEO_TITLE = 70;
const MAX_SEO_DESCRIPTION = 160;
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTP_URL_PATTERN = /^https?:\/\/.+/i;
const SITE_PATH_PATTERN = /^\/.+/;

export const COLLECTION_SCHEMAS = {
  cms_posts: {
    slugField: 'slug',
    relationshipFields: {
      relatedProjectSlugs: 'cms_projects',
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'contentMarkdown'],
  },
  cms_projects: {
    slugField: 'slug',
    relationshipFields: {
      coverImage: 'cms_media',
      writeupPostSlug: 'cms_posts',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'category'],
  },
  cms_photos: {
    slugField: 'slug',
    relationshipFields: {
      mediaId: 'cms_media',
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'mediaId'],
  },
  cms_testimonials: {
    slugField: 'slug',
    relationshipFields: {
      avatarMediaId: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'quote', 'personName'],
  },
  cms_journey_entries: {
    slugField: 'slug',
    relationshipFields: {
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'role'],
  },
  cms_movies: {
    slugField: 'slug',
    relationshipFields: {
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility'],
  },
  cms_tv_series: {
    slugField: 'slug',
    relationshipFields: {
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility'],
  },
  cms_music_entries: {
    slugField: 'slug',
    relationshipFields: {
      coverImage: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'kind'],
  },
  cms_music_collections: {
    slugField: 'slug',
    relationshipFields: {
      entryIds: 'cms_music_entries',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'type'],
  },
  cms_landing_config: {
    slugField: 'slug',
    relationshipFields: {
      heroProjectSlugs: 'cms_projects',
      highlightProjectSlugs: 'cms_projects',
      testimonialIds: 'cms_testimonials',
      journeyEntryIds: 'cms_journey_entries',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility'],
  },
  cms_media: {
    slugField: 'slug',
    relationshipFields: {},
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility', 'kind', 'storagePath'],
  },
  cms_site_settings: {
    slugField: 'slug',
    relationshipFields: {
      defaultOgMediaId: 'cms_media',
    },
    requiredFields: ['id', 'slug', 'title', 'status', 'visibility'],
  },
};

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function addIssue(issues, path, message) {
  issues.push({ path, message });
}

function isBlank(value) {
  return value === undefined || value === null || value === '';
}

function validateRequiredString(value, path, issues) {
  if (typeof value !== 'string' || !value.trim()) {
    addIssue(issues, path, 'Must be a non-empty string.');
  }
}

function validateOptionalString(value, path, issues) {
  if (!isBlank(value) && typeof value !== 'string') {
    addIssue(issues, path, 'Must be a string when provided.');
  }
}

function validateEnum(value, allowed, path, issues) {
  if (!allowed.includes(value)) {
    addIssue(issues, path, `Must be one of: ${allowed.join(', ')}.`);
  }
}

function validateDateString(value, path, issues) {
  if (isBlank(value)) return;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    addIssue(issues, path, 'Must be a valid ISO date string.');
  }
}

function validateUrlish(value, path, issues) {
  if (isBlank(value)) return;
  if (typeof value !== 'string' || (!HTTP_URL_PATTERN.test(value) && !SITE_PATH_PATTERN.test(value))) {
    addIssue(issues, path, 'Must be an absolute http(s) URL or a site-relative path.');
  }
}

function validateSlug(value, path, issues) {
  if (typeof value !== 'string' || !SLUG_PATTERN.test(value)) {
    addIssue(
      issues,
      path,
      'Must use lowercase letters, numbers, and single hyphens only.'
    );
  }
}

function validateDisplayOrder(value, path, issues) {
  if (isBlank(value)) return;
  if (!Number.isInteger(value) || value < 0) {
    addIssue(issues, path, 'Must be a non-negative integer.');
  }
}

function validateSeoLengths(document, issues) {
  if (document.seoTitle && document.seoTitle.length > MAX_SEO_TITLE) {
    addIssue(issues, 'seoTitle', `Must be ${MAX_SEO_TITLE} characters or fewer.`);
  }
  if (document.seoDescription && document.seoDescription.length > MAX_SEO_DESCRIPTION) {
    addIssue(issues, 'seoDescription', `Must be ${MAX_SEO_DESCRIPTION} characters or fewer.`);
  }
}

function validateMediaReference(value, path, issues) {
  if (isBlank(value)) return;

  if (typeof value === 'string') {
    if (!SLUG_PATTERN.test(value) && !SITE_PATH_PATTERN.test(value)) {
      addIssue(issues, path, 'Media references must be a document id or site-relative path.');
    }
    return;
  }

  if (!isObject(value)) {
    addIssue(issues, path, 'Media references must be a string id/path or an object.');
    return;
  }

  if (!value.mediaId && !value.src && !value.storagePath) {
    addIssue(issues, path, 'Media references must include mediaId, src, or storagePath.');
  }
  if (value.src) validateUrlish(value.src, `${path}.src`, issues);
  if (value.storagePath && !String(value.storagePath).startsWith(CMS_STORAGE_PREFIX)) {
    addIssue(issues, `${path}.storagePath`, `Storage paths must start with "${CMS_STORAGE_PREFIX}".`);
  }
}

function validateArrayOfStrings(value, path, issues) {
  if (isBlank(value)) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    addIssue(issues, path, 'Must be an array of non-empty strings.');
  }
}

function validateRelationshipValue(value, relationshipCollection, path, issues, context) {
  if (isBlank(value)) return;

  const collection = context.collections?.[relationshipCollection];
  if (!collection) return;

  const ids = new Set();
  collection.forEach((entry) => {
    [entry?.id, entry?.slug, entry?.src, entry?.storagePath, entry?.mediaId]
      .filter(Boolean)
      .forEach((item) => ids.add(String(item)));
  });

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (!ids.has(String(item))) {
        addIssue(
          issues,
          `${path}[${index}]`,
          `References missing ${relationshipCollection} document "${item}".`
        );
      }
    });
    return;
  }

  const refValue =
    typeof value === 'string'
      ? value
      : value?.mediaId || value?.id || value?.slug || value?.storagePath;

  if (refValue && !ids.has(String(refValue))) {
    addIssue(
      issues,
      path,
      `References missing ${relationshipCollection} document "${refValue}".`
    );
  }
}

function validateCommonDocument(document, issues) {
  validateRequiredString(document.id, 'id', issues);
  validateOptionalString(document.slug, 'slug', issues);
  if (!isBlank(document.slug)) validateSlug(document.slug, 'slug', issues);
  validateRequiredString(document.title, 'title', issues);
  validateEnum(document.status, CMS_STATUS_VALUES, 'status', issues);
  validateEnum(document.visibility, CMS_VISIBILITY_VALUES, 'visibility', issues);
  validateDisplayOrder(document.displayOrder, 'displayOrder', issues);
  validateDateString(document.createdAt, 'createdAt', issues);
  validateDateString(document.updatedAt, 'updatedAt', issues);
  validateDateString(document.publishedAt, 'publishedAt', issues);
  validateDateString(document.archivedAt, 'archivedAt', issues);
  validateDateString(document.deletedAt, 'deletedAt', issues);
  validateOptionalString(document.createdBy, 'createdBy', issues);
  validateOptionalString(document.updatedBy, 'updatedBy', issues);
  validateUrlish(document.canonicalUrl, 'canonicalUrl', issues);
  validateSeoLengths(document, issues);
  validateMediaReference(document.coverImage, 'coverImage', issues);

  if (!isBlank(document.featured) && typeof document.featured !== 'boolean') {
    addIssue(issues, 'featured', 'Must be a boolean when provided.');
  }
}

function validateCollectionSpecific(collectionName, document, issues) {
  switch (collectionName) {
    case 'cms_posts':
      validateRequiredString(document.contentMarkdown, 'contentMarkdown', issues);
      validateArrayOfStrings(document.tags, 'tags', issues);
      validateArrayOfStrings(document.relatedProjectSlugs, 'relatedProjectSlugs', issues);
      break;

    case 'cms_projects':
      validateRequiredString(document.category, 'category', issues);
      validateArrayOfStrings(document.stack, 'stack', issues);
      validateUrlish(document.href, 'href', issues);
      validateUrlish(document.demo, 'demo', issues);
      validateUrlish(document.github, 'github', issues);
      if (!isBlank(document.writeupPostSlug)) validateSlug(document.writeupPostSlug, 'writeupPostSlug', issues);
      break;

    case 'cms_photos':
      validateRequiredString(document.mediaId, 'mediaId', issues);
      validateDateString(document.takenAt, 'takenAt', issues);
      break;

    case 'cms_testimonials':
      validateRequiredString(document.quote, 'quote', issues);
      validateRequiredString(document.personName, 'personName', issues);
      validateOptionalString(document.personRole, 'personRole', issues);
      validateOptionalString(document.organization, 'organization', issues);
      break;

    case 'cms_journey_entries':
      validateRequiredString(document.role, 'role', issues);
      validateOptionalString(document.tag, 'tag', issues);
      validateOptionalString(document.date, 'date', issues);
      break;

    case 'cms_movies':
    case 'cms_tv_series':
      if (!isBlank(document.watchStatus)) {
        validateEnum(document.watchStatus, WATCH_STATUS_VALUES, 'watchStatus', issues);
      }
      validateOptionalString(document.creator, 'creator', issues);
      break;

    case 'cms_music_entries':
      validateEnum(document.kind, MUSIC_ENTRY_KINDS, 'kind', issues);
      validateOptionalString(document.creator, 'creator', issues);
      validateArrayOfStrings(document.collectionIds, 'collectionIds', issues);
      break;

    case 'cms_music_collections':
      validateEnum(document.type, MUSIC_COLLECTION_TYPES, 'type', issues);
      validateArrayOfStrings(document.entryIds, 'entryIds', issues);
      break;

    case 'cms_landing_config':
      validateLandingConfig(document, issues);
      break;

    case 'cms_media':
      validateEnum(document.kind, MEDIA_KINDS, 'kind', issues);
      validateRequiredString(document.storagePath, 'storagePath', issues);
      if (!String(document.storagePath).startsWith(CMS_STORAGE_PREFIX)) {
        addIssue(issues, 'storagePath', `Must be inside the "${CMS_STORAGE_PREFIX}" prefix.`);
      }
      if (!isBlank(document.contentType) && typeof document.contentType !== 'string') {
        addIssue(issues, 'contentType', 'Must be a string when provided.');
      }
      if (!isBlank(document.sizeBytes) && (!Number.isInteger(document.sizeBytes) || document.sizeBytes <= 0)) {
        addIssue(issues, 'sizeBytes', 'Must be a positive integer when provided.');
      }
      if (document.sizeBytes > MAX_MEDIA_BYTES) {
        addIssue(issues, 'sizeBytes', `Must be ${MAX_MEDIA_BYTES} bytes or fewer for this phase.`);
      }
      break;

    case 'cms_site_settings':
      validateOptionalString(document.locale, 'locale', issues);
      validateOptionalString(document.timezone, 'timezone', issues);
      break;

    default:
      break;
  }
}

export function validateLandingConfig(document, initialIssues = []) {
  const issues = initialIssues;

  for (const [field, limit] of Object.entries(LANDING_SLOT_LIMITS)) {
    const value = document[field];
    if (isBlank(value)) continue;
    if (!Array.isArray(value)) {
      addIssue(issues, field, 'Must be an array.');
      continue;
    }
    if (value.length > limit) {
      addIssue(issues, field, `Must contain at most ${limit} entries.`);
    }
    const duplicates = new Set();
    const seen = new Set();

    value.forEach((entry, index) => {
      if (typeof entry !== 'string' || !entry.trim()) {
        addIssue(issues, `${field}[${index}]`, 'Must be a non-empty string.');
      }
      if (seen.has(entry)) duplicates.add(entry);
      seen.add(entry);
    });

    if (duplicates.size > 0) {
      addIssue(
        issues,
        field,
        `Contains duplicate exclusive slot assignments: ${[...duplicates].join(', ')}.`
      );
    }
  }

  return issues;
}

export function validateStateTransition(fromStatus, toStatus) {
  const allowed = CMS_STATE_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function validateDocument(collectionName, document, context = {}) {
  const issues = [];
  const schema = COLLECTION_SCHEMAS[collectionName];

  if (!schema) {
    return {
      valid: false,
      issues: [{ path: 'collection', message: `Unknown CMS collection "${collectionName}".` }],
    };
  }

  if (!isObject(document)) {
    return {
      valid: false,
      issues: [{ path: '$', message: 'Document payload must be an object.' }],
    };
  }

  for (const field of schema.requiredFields) {
    if (isBlank(document[field])) {
      addIssue(issues, field, 'This field is required.');
    }
  }

  validateCommonDocument(document, issues);
  validateCollectionSpecific(collectionName, document, issues);

  for (const [field, relationshipCollection] of Object.entries(schema.relationshipFields)) {
    validateRelationshipValue(document[field], relationshipCollection, field, issues, context);
  }

  if (schema.slugField && document[schema.slugField]) {
    const existing = context.slugIndex?.[collectionName] || new Map();
    const slug = String(document[schema.slugField]);
    const record = existing.get(slug);
    if (record && (record.owner !== document.id || record.count > 1)) {
      addIssue(issues, schema.slugField, `Slug "${slug}" is already used by "${record.owner}".`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function buildSlugIndex(collections = {}) {
  const index = {};

  for (const [collectionName, documents] of Object.entries(collections)) {
    const map = new Map();
    for (const document of documents || []) {
      if (!document?.slug) continue;

      const slug = String(document.slug);
      const existing = map.get(slug);

      map.set(slug, {
        owner: existing?.owner || document.id || document.slug,
        count: (existing?.count || 0) + 1,
      });
    }
    index[collectionName] = map;
  }

  return index;
}

export function validateCollection(collectionName, documents = [], context = {}) {
  const slugIndex = buildSlugIndex({
    ...(context.collections || {}),
    [collectionName]: documents,
  });

  return documents.map((document) => ({
    id: document?.id || document?.slug || null,
    ...validateDocument(collectionName, document, {
      ...context,
      slugIndex,
    }),
  }));
}
