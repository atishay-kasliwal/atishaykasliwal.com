/**
 * Canonical identity for the entire site.
 *
 * Everything that names, describes, or links to Atishay Kasliwal reads from
 * here — page copy, JSON-LD, the sitemap, the RSS feed, OG tags. The point is
 * that Google sees one consistent entity across every URL. Two pages
 * disagreeing about an employer or a job title is exactly what stops an entity
 * from being promoted into the Knowledge Graph, so there is deliberately no
 * second place to edit these facts.
 *
 * Rule: the name is always written "Atishay Kasliwal". Never "Atishay",
 * never "A. Kasliwal".
 */

export const ORIGIN = 'https://atishaykasliwal.com';

/** Absolute URL for a site-relative path. JSON-LD and OG tags require absolute. */
export const abs = (path = '/') =>
  `${ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

export const FULL_NAME = 'Atishay Kasliwal';
export const GIVEN_NAME = 'Atishay';
export const FAMILY_NAME = 'Kasliwal';

export const EMAIL = 'hire@atishaykasliwal.com';

/**
 * Positioning title. Distinct from the literal titles in employment history —
 * those live in experience.js and stay factually exact. This is how the site
 * presents him, and it is what recruiters search.
 */
export const JOB_TITLE = 'AI Engineer';

export const HEADLINE = 'AI Engineer building production LLM and agent systems';

/** ~155 chars — the meta description ceiling before Google truncates. */
export const META_DESCRIPTION =
  'Atishay Kasliwal is an AI Engineer building production LLM, RAG, and agent systems on distributed cloud infrastructure. MS Data Science, Stony Brook University.';

export const BIO_SHORT =
  'AI Engineer working on retrieval systems, LLM agents, and the distributed infrastructure that keeps them fast and cheap in production.';

export const BIO_LONG = `Atishay Kasliwal is an AI Engineer based in New York. He builds retrieval-augmented generation systems, LLM agents, and the event-driven infrastructure they run on — the unglamorous part where latency budgets, cost per query, and failure modes decide whether a model is actually useful.

He holds a Master of Science in Data Science from Stony Brook University and a Bachelor of Technology in Computer Science and Information Technology from Symbiosis University of Applied Sciences. Before graduate school he spent three years at Accolite Digital as a Senior Software Engineer, shipping event-driven ETL and serverless platforms for Fidelity Investments and BT Group.

He currently builds and operates Atriveo, a job-search platform serving live customers, and researches financial NLP at Stony Brook University.`;

export const LOCATION = {
  city: 'New York',
  region: 'NY',
  regionName: 'New York',
  country: 'US',
  countryName: 'United States',
  display: 'New York, NY',
};

export const NATIONALITY = 'Indian';

export const AVAILABILITY = {
  open: true,
  label: 'Open to AI Engineer and Software Engineer roles',
  detail: 'Available immediately · Open to relocation · Authorized to work in the US',
};

/**
 * sameAs — the backbone of entity resolution. Google cross-references these to
 * confirm that the person on this site is the same person on LinkedIn, GitHub,
 * and elsewhere. Every entry must be a live profile that is actually his;
 * a dead or wrong link costs more confidence than a missing one buys.
 *
 * NOTE: `scholar` and `youtube` are intentionally absent until real URLs are
 * supplied. Do not add speculative profile URLs here.
 */
export const PROFILES = {
  linkedin: 'https://www.linkedin.com/in/atishay-kasliwal/',
  github: 'https://github.com/atishay-kasliwal',
  x: 'https://x.com/AtiahayKasliwal',
  instagram: 'https://www.instagram.com/atishay_kasliwal/',
  cal: 'https://cal.com/atishay-kasliwal',
};

export const GITHUB_USERNAME = 'atishay-kasliwal';

/** Ordered list used for JSON-LD `sameAs` and the contact page. */
export const SAME_AS = [
  PROFILES.linkedin,
  PROFILES.github,
  PROFILES.x,
  PROFILES.instagram,
  PROFILES.cal,
];

export const SOCIAL_LINKS = [
  { key: 'linkedin', label: 'LinkedIn', handle: 'atishay-kasliwal', url: PROFILES.linkedin },
  { key: 'github', label: 'GitHub', handle: '@atishay-kasliwal', url: PROFILES.github },
  { key: 'x', label: 'X', handle: '@AtiahayKasliwal', url: PROFILES.x },
  { key: 'cal', label: 'Cal.com', handle: 'Book 30 min', url: PROFILES.cal },
];

export const TWITTER_HANDLE = '@AtiahayKasliwal';

/**
 * Canonical imagery. Square headshot is what Google prefers for a Person
 * entity knowledge panel; the OG image is the 1.91:1 social card.
 */
export const IMAGES = {
  headshot: {
    src: '/atishay-kasliwal-headshot-512.jpg',
    width: 512,
    height: 512,
    alt: 'Atishay Kasliwal, AI Engineer, New York',
  },
  headshotLarge: {
    src: '/atishay-kasliwal-portrait.jpg',
    width: 1200,
    height: 1200,
    alt: 'Portrait of Atishay Kasliwal, AI Engineer',
  },
  og: {
    src: '/og/atishay-kasliwal-og.png',
    width: 1200,
    height: 630,
    alt: 'Atishay Kasliwal — AI Engineer building production LLM and agent systems',
  },
  logo: {
    src: '/atishay-kasliwal-logo.png',
    width: 512,
    height: 512,
    alt: 'Atishay Kasliwal monogram',
  },
};

export const RESUME_PDF = '/Atishay-Kasliwal-Resume.pdf';

/**
 * knowsAbout drives topical association. Ordered most- to least-central so the
 * first entries carry the most weight; kept to concrete technical subjects
 * rather than soft skills, which Google ignores.
 */
export const KNOWS_ABOUT = [
  'Artificial Intelligence Engineering',
  'Large Language Models',
  'Retrieval-Augmented Generation',
  'AI Agents',
  'Machine Learning Engineering',
  'Natural Language Processing',
  'Distributed Systems',
  'Event-Driven Architecture',
  'Cloud Infrastructure',
  'MLOps',
  'Vector Databases',
  'Python',
  'TypeScript',
  'Java',
  'PyTorch',
  'FastAPI',
  'Amazon Web Services',
  'Kubernetes',
  'Developer Tools',
];

/** Short chips for the hero. Kept to seven — more reads as a keyword dump. */
export const FOCUS_AREAS = [
  'LLM Systems',
  'RAG',
  'AI Agents',
  'Distributed Systems',
  'Developer Tools',
  'Cloud Infrastructure',
  'Applied Research',
];

export const ORGANIZATION = {
  name: 'Atriveo',
  url: 'https://atriveo.com/',
  description:
    'Job-search platform that captures applications through a browser extension and surfaces pipeline analytics.',
  role: 'Founder and Engineer',
};

export const SITE = {
  name: `${FULL_NAME} — ${JOB_TITLE}`,
  shortName: FULL_NAME,
  url: ORIGIN,
  locale: 'en_US',
  language: 'en',
  themeColor: '#0A0A0A',
  accentColor: '#2563EB',
  founded: '2024',
  repo: 'https://github.com/atishay-kasliwal/atishaykasliwal.com',
};

/**
 * Verification tokens for Search Console / Bing. Empty strings render nothing —
 * an empty verification meta tag is worse than none, so they are filtered out
 * at render time.
 */
export const VERIFICATION = {
  google: '',
  bing: '',
};
