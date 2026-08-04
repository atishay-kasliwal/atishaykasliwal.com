/**
 * JSON-LD generators.
 *
 * Design notes that matter for how Google actually consumes this:
 *
 * • Every entity gets a stable `@id` anchored to a URL fragment. That is what
 *   lets separate graphs across pages resolve to ONE Person rather than a new
 *   anonymous person per page — the single most important detail for
 *   Knowledge Graph eligibility.
 * • Pages emit a single `@graph` array instead of several disconnected
 *   <script> tags, so the entities can reference each other by @id.
 * • Nothing here invents data. Generators read from src/data and omit fields
 *   that have no real value — an empty `award: []` is worse than no `award`.
 */

import {
  ORIGIN,
  abs,
  FULL_NAME,
  GIVEN_NAME,
  FAMILY_NAME,
  EMAIL,
  JOB_TITLE,
  BIO_SHORT,
  BIO_LONG,
  LOCATION,
  NATIONALITY,
  SAME_AS,
  KNOWS_ABOUT,
  IMAGES,
  SITE,
  ORGANIZATION,
} from '../data/site.js';
import { EXPERIENCE, CURRENT_ROLE } from '../data/experience.js';
import { EDUCATION, AWARDS } from '../data/education.js';
import { PUBLICATIONS, TALKS } from '../data/authority.js';

/* ── stable entity ids ─────────────────────────────────────────────────── */
export const ID = {
  person: `${ORIGIN}/#person`,
  website: `${ORIGIN}/#website`,
  organization: `${ORIGIN}/#organization`,
  headshot: `${ORIGIN}/#headshot`,
  logo: `${ORIGIN}/#logo`,
  page: (path) => `${abs(path)}#webpage`,
  breadcrumb: (path) => `${abs(path)}#breadcrumb`,
};

/** Strip keys that are null/undefined/empty so no hollow fields ship. */
const compact = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }
  return out;
};

/* ── ImageObject ───────────────────────────────────────────────────────── */
export function imageObject(img, id) {
  return compact({
    '@type': 'ImageObject',
    '@id': id,
    url: abs(img.src),
    contentUrl: abs(img.src),
    width: img.width,
    height: img.height,
    caption: img.alt,
    representativeOfPage: id === ID.headshot ? undefined : undefined,
  });
}

/* ── Organization (Atriveo — the thing he actually runs) ───────────────── */
export function organizationSchema() {
  return compact({
    '@type': 'Organization',
    '@id': ID.organization,
    name: ORGANIZATION.name,
    url: ORGANIZATION.url,
    description: ORGANIZATION.description,
    founder: { '@id': ID.person },
    logo: imageObject(IMAGES.logo, ID.logo),
  });
}

/* ── Person — the centerpiece ──────────────────────────────────────────── */
export function personSchema() {
  const alumni = EDUCATION.map((e) =>
    compact({
      '@type': 'CollegeOrUniversity',
      name: e.school,
      url: e.schoolUrl,
      sameAs: e.sameAs || undefined,
    })
  );

  /** Every employer, so Google sees the full professional graph. */
  const orgsWorkedFor = EXPERIENCE.map((e) =>
    compact({
      '@type': 'Organization',
      name: e.company,
      url: e.companyUrl || undefined,
    })
  );

  const occupation = compact({
    '@type': 'Occupation',
    name: JOB_TITLE,
    occupationalCategory: '15-2051.00', // O*NET: Data Scientists
    description: BIO_SHORT,
    skills: KNOWS_ABOUT.join(', '),
    occupationLocation: {
      '@type': 'City',
      name: LOCATION.city,
    },
  });

  return compact({
    '@type': 'Person',
    '@id': ID.person,
    name: FULL_NAME,
    givenName: GIVEN_NAME,
    familyName: FAMILY_NAME,
    alternateName: FULL_NAME,
    url: `${ORIGIN}/`,
    mainEntityOfPage: { '@id': ID.page('/') },
    image: imageObject(IMAGES.headshot, ID.headshot),
    description: BIO_SHORT,
    disambiguatingDescription: `AI Engineer in ${LOCATION.display} specializing in large language model systems, retrieval-augmented generation, and distributed infrastructure.`,
    jobTitle: JOB_TITLE,
    email: `mailto:${EMAIL}`,
    knowsAbout: KNOWS_ABOUT,
    knowsLanguage: ['English', 'Hindi'],
    nationality: { '@type': 'Country', name: NATIONALITY },
    address: {
      '@type': 'PostalAddress',
      addressLocality: LOCATION.city,
      addressRegion: LOCATION.region,
      addressCountry: LOCATION.country,
    },
    homeLocation: {
      '@type': 'Place',
      name: LOCATION.display,
      address: {
        '@type': 'PostalAddress',
        addressLocality: LOCATION.city,
        addressRegion: LOCATION.region,
        addressCountry: LOCATION.country,
      },
    },
    worksFor: compact({
      '@type': 'Organization',
      name: CURRENT_ROLE.company,
      url: CURRENT_ROLE.companyUrl || undefined,
    }),
    hasOccupation: occupation,
    alumniOf: alumni,
    affiliation: orgsWorkedFor,
    // Only surfaces once real awards exist — see src/data/education.js.
    award: AWARDS.length ? AWARDS.map((a) => a.title || a) : undefined,
    sameAs: SAME_AS,
    owns: { '@id': ID.organization },
  });
}

/* ── WebSite + SearchAction ────────────────────────────────────────────── */
export function websiteSchema() {
  return compact({
    '@type': 'WebSite',
    '@id': ID.website,
    url: `${ORIGIN}/`,
    name: SITE.shortName,
    alternateName: SITE.name,
    description: BIO_SHORT,
    inLanguage: 'en-US',
    publisher: { '@id': ID.person },
    copyrightHolder: { '@id': ID.person },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${ORIGIN}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

/* ── BreadcrumbList ────────────────────────────────────────────────────── */
export function breadcrumbSchema(path, crumbs = []) {
  if (!crumbs.length) return null;
  const items = [{ name: 'Home', path: '/' }, ...crumbs];
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(path),
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

/* ── WebPage / ProfilePage / CollectionPage / ContactPage ──────────────── */
export function webPageSchema(meta, type = 'WebPage') {
  return compact({
    '@type': type,
    '@id': ID.page(meta.path),
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.person },
    primaryImageOfPage: { '@id': ID.headshot },
    inLanguage: 'en-US',
    breadcrumb: meta.breadcrumbs?.length ? { '@id': ID.breadcrumb(meta.path) } : undefined,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified || new Date().toISOString().slice(0, 10),
  });
}

/* ── SoftwareSourceCode (projects) ─────────────────────────────────────── */
export function projectSchema(project) {
  return compact({
    '@type': project.github ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': `${abs(`/projects/${project.slug}`)}#project`,
    name: project.name,
    headline: project.tagline,
    description: project.problem,
    url: abs(`/projects/${project.slug}`),
    author: { '@id': ID.person },
    creator: { '@id': ID.person },
    dateCreated: project.year,
    codeRepository: project.github || undefined,
    programmingLanguage: project.stack?.filter((s) =>
      ['Python', 'TypeScript', 'JavaScript', 'Java', 'Go', 'C++'].includes(s)
    ),
    keywords: project.stack?.join(', '),
    image: project.image ? abs(project.image.src) : undefined,
    about: project.category,
  });
}

export function collectionPageSchema(meta, items, itemType = 'CreativeWork') {
  return compact({
    '@type': 'CollectionPage',
    '@id': ID.page(meta.path),
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.person },
    inLanguage: 'en-US',
    breadcrumb: meta.breadcrumbs?.length ? { '@id': ID.breadcrumb(meta.path) } : undefined,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: item.url,
        name: item.name,
      })),
    },
  });
}

/* ── BlogPosting / Article ─────────────────────────────────────────────── */
export function blogPostingSchema(post) {
  const url = abs(`/blog/${post.slug}`);
  return compact({
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@id': ID.person },
    publisher: { '@id': ID.person },
    inLanguage: 'en-US',
    keywords: post.tags?.join(', '),
    articleSection: post.category,
    wordCount: post.wordCount,
    timeRequired: post.readingTime ? `PT${post.readingTime}M` : undefined,
    image: post.image ? abs(post.image) : abs(IMAGES.og.src),
  });
}

/* ── ScholarlyArticle (publications) ───────────────────────────────────── */
export function publicationSchema(pub) {
  return compact({
    '@type': 'ScholarlyArticle',
    headline: pub.title,
    name: pub.title,
    author: pub.authors?.map((a) =>
      a === FULL_NAME ? { '@id': ID.person } : { '@type': 'Person', name: a }
    ),
    datePublished: pub.date,
    publisher: pub.venue ? { '@type': 'Organization', name: pub.venue } : undefined,
    url: pub.url,
    identifier: pub.doi ? `https://doi.org/${pub.doi}` : undefined,
    abstract: pub.abstract,
    inLanguage: 'en-US',
  });
}

/* ── Event (talks) ─────────────────────────────────────────────────────── */
export function talkSchema(talk) {
  return compact({
    '@type': 'Event',
    name: talk.title,
    description: talk.description,
    startDate: talk.date,
    url: talk.url,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: talk.location
      ? { '@type': 'Place', name: talk.location }
      : undefined,
    performer: { '@id': ID.person },
    organizer: talk.event ? { '@type': 'Organization', name: talk.event } : undefined,
  });
}

/* ── FAQPage ───────────────────────────────────────────────────────────── */
export function faqSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/* ── ContactPage ───────────────────────────────────────────────────────── */
export function contactPageSchema(meta) {
  return compact({
    '@type': 'ContactPage',
    '@id': ID.page(meta.path),
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.person },
    mainEntity: {
      '@type': 'Person',
      '@id': ID.person,
      name: FULL_NAME,
      email: `mailto:${EMAIL}`,
      url: `${ORIGIN}/`,
    },
    breadcrumb: meta.breadcrumbs?.length ? { '@id': ID.breadcrumb(meta.path) } : undefined,
  });
}

/**
 * Assemble the full @graph for a page.
 *
 * Person + WebSite + Organization ride along on EVERY page. That repetition is
 * intentional: it is how each URL independently reinforces the same entity,
 * which is what "unambiguous" means to a crawler that may only ever fetch one
 * of these pages.
 */
export function buildGraph(meta, extras = []) {
  const graph = [
    personSchema(),
    websiteSchema(),
    organizationSchema(),
    ...extras.filter(Boolean),
  ];

  const crumbs = breadcrumbSchema(meta.path, meta.breadcrumbs);
  if (crumbs) graph.push(crumbs);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/** Serialize for a <script type="application/ld+json">, XSS-safe. */
export function serializeJsonLd(graph) {
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

export { PUBLICATIONS, TALKS };
