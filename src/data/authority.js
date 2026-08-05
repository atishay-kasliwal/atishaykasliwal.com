/**
 * Long-term authority surfaces: research, talks, media, awards.
 *
 * These are all EMPTY BY DESIGN. The pages, routing, schema generators, and
 * layouts are fully built and will render the moment real entries are added —
 * but nothing here is invented. Fabricated publications and talks are the
 * single fastest way to destroy credibility with the exact audience this site
 * is built for, and they are trivially checkable.
 *
 * ── HOW TO ADD ──────────────────────────────────────────────────────────
 * Push a real entry into the relevant array. Each page automatically:
 *   • switches out of its empty state
 *   • enters the sitemap (see scripts/generate-sitemap.mjs)
 *   • emits the matching JSON-LD (ScholarlyArticle / Event / CreativeWork)
 *   • appears in site nav and the command palette
 *
 * Google Scholar and YouTube profile URLs also belong in PROFILES in
 * src/data/site.js once they exist — they are deliberately not in `sameAs`
 * yet, because a sameAs pointing at a non-existent profile actively lowers
 * entity confidence.
 * ────────────────────────────────────────────────────────────────────────
 */

/**
 * Peer-reviewed publications.
 *
 * ── FILL THIS IN ─────────────────────────────────────────────────────────
 * Copy the block below, one per paper. Only `title`, `authors`, `venue` and
 * `date` are required; everything else improves the citation and the
 * ScholarlyArticle schema but can be omitted.
 *
 *   {
 *     title: 'Exact paper title as published',
 *     authors: ['Atishay Kasliwal', 'Co Author'],   // publication order
 *     venue: 'Journal or conference name',
 *     date: '2020-06-15',                           // ISO; publication date
 *     url: 'https://doi.org/10.xxxx/yyyy',          // or the publisher page
 *     doi: '10.xxxx/yyyy',                          // optional
 *     pdf: '/papers/your-paper.pdf',                // optional, if self-hosted
 *     abstract: 'One or two sentences.',            // optional
 *   },
 *
 * Adding one entry automatically: renders the publications list on /research,
 * emits ScholarlyArticle JSON-LD, and adds `author` links back to the Person
 * entity — which is one of the stronger Knowledge Graph signals available,
 * because it ties this site to an independently verifiable record.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @typedef {Object} Publication
 * @property {string} title
 * @property {string[]} authors      Full names, in publication order.
 * @property {string} venue          Journal or conference name.
 * @property {string} date           ISO date.
 * @property {string} [url]          Canonical link (DOI preferred).
 * @property {string} [doi]
 * @property {string} [pdf]
 * @property {string} [abstract]
 * @property {string} [volume]
 * @property {string} [issue]
 * @property {string} [pages]
 * @property {string} [issn]
 * @property {string[]} [keywords]
 * @property {string} [paperId]
 */
/*
 * Ordered newest-first by page number within the same issue, so the follow-up
 * analysis leads. It is the stronger of the two for an AI Engineer profile —
 * it applies machine learning models to the dataset the first paper collected.
 */
export const PUBLICATIONS = [
  {
    title: "Analysis Report on India's Reopening",
    authors: ['Atishay Kasliwal', 'Saanya Lasod', 'Mradul Kasliwal'],
    venue: 'International Journal for Research Trends and Innovation (IJRTI)',
    venueShort: 'IJRTI',
    date: '2020-06-01',
    volume: '5',
    issue: '6',
    pages: '64-69',
    issn: '2456-3315',
    paperId: 'IJRTI2006010',
    url: 'https://www.ijrti.org/viewpaperforall?paper=IJRTI2006010',
    pdf: 'https://www.ijrti.org/papers/IJRTI2006010.pdf',
    publisher: 'IJ Publication',
    abstract:
      'Using the dataset from our earlier survey on the same topic, we predicted respondents’ views on the Government of India’s "Unlock" phase 1 using data analysis and machine learning models.',
    keywords: ['COVID-19', 'Machine Learning', 'Data Analysis', 'Lockdown', 'Containment Zone'],
  },
  {
    title: 'Survey paper on "Is India ready to reopen?"',
    authors: ['Atishay Kasliwal', 'Saanya Lasod', 'Mradul Kasliwal'],
    venue: 'International Journal for Research Trends and Innovation (IJRTI)',
    venueShort: 'IJRTI',
    date: '2020-06-01',
    volume: '5',
    issue: '6',
    pages: '20-22',
    issn: '2456-3315',
    paperId: 'IJRTI2006005',
    url: 'https://www.ijrti.org/viewpaperforall?paper=IJRTI2006005',
    pdf: 'https://www.ijrti.org/papers/IJRTI2006005.pdf',
    publisher: 'IJ Publication',
    abstract:
      'As "Unlock" by the government was just around the corner, we all had one question in our minds: "Is India ready to reopen?" — even when COVID-19 still prevailed. We surveyed around 31 questions on what people observed and experienced during lockdown, then analysed the data and generated trends.',
    keywords: ['COVID-19', 'Lockdown', 'Unlock', 'Survey research'],
  },
];

/**
 * Conference appearances that are not papers — panels, poster sessions,
 * presentations, or attendance worth recording.
 *
 * Kept separate from PUBLICATIONS because conflating the two is the fastest way
 * to look like you are padding a CV, and separate from TALKS because a
 * conference appearance is not necessarily a talk you gave.
 *
 *   {
 *     name: 'Conference name',
 *     role: 'Presenter' | 'Poster' | 'Panelist' | 'Attendee',
 *     topic: 'What it was about',
 *     date: '2024-09-12',
 *     location: 'City, Country',
 *     url: 'https://conference-site.example',   // optional
 *   },
 */
export const CONFERENCES = [
  {
    title:
      'Market Expectations and FOMC Speech: a Large Language Model Approach to Asset Pricing',
    authors: ['Qianqian Zhang', 'Wencui Han', 'Atishay Kasliwal'],
    event: 'International Conference on Business, Management, Economics, and Information Systems',
    date: '2025-01-01',
    location: 'New York, United States',
    /* Presented in person by Atishay Kasliwal — confirmed. (The message about
       nobody attending referred to DSS, a different conference.) */
    role: 'Presented',
    presentedBy: 'Atishay Kasliwal',
    year: '2025',
    relatedProject: 'fomc-intelligence',
    description:
      'Applies large language models to Federal Reserve speech to study how market expectations are priced, extending the FOMC research pipeline into an asset-pricing setting.',
  },
];

/**
 * @typedef {Object} Talk
 * @property {string} title
 * @property {string} event
 * @property {string} date           ISO date.
 * @property {string} location
 * @property {string} [url]
 * @property {string} [slides]
 * @property {string} [video]
 * @property {string} description
 */
export const TALKS = [
  {
    title: 'Building an End-to-End Radiomics and GenAI System for Clinical Decision Support',
    event: '',            // ← NEEDS VENUE: where was this delivered?
    date: '2025-11-19',   // taken from the title slide
    location: '',         // ← NEEDS LOCATION
    description:
      'An end-to-end pipeline for stroke outcome prediction: ROI segmentation, radiomics feature extraction, and a retrieval-augmented GenAI assistant that matches radiomic patterns against the stroke imaging literature to make predictions clinically interpretable.',
    topics: ['GenAI', 'RAG', 'Radiomics', 'Medical Imaging', 'Clinical Decision Support'],
    solo: true,
  },
  {
    /**
     * A journal-club style presentation OF a paper, not a paper authored here.
     * The title slide reads "Presented by Atishay Kasliwal, Bryan Ramillano" —
     * the underlying NHANES study is other researchers' work.
     *
     * `presentationOf` keeps that distinction explicit in the data, so this can
     * never drift into the publications list. Claiming authorship of a
     * research-integrity paper you reviewed would be exactly the kind of thing
     * this site's credibility cannot survive.
     */
    title:
      'Explosion of Formulaic Research Articles Based on the NHANES US National Health Database',
    presentationOf: 'a paper by other authors — presented and critiqued, not authored',
    coPresenter: 'Bryan Ramillano',
    event: '',            // ← NEEDS VENUE
    date: '',             // ← NEEDS DATE
    location: '',
    description:
      'A review and critique of the rapid rise in formulaic NHANES-based research articles: how automated and AI-assisted study generation produces inappropriate designs and false discoveries, and what multifactorial analysis and multiple-hypothesis correction can do about it.',
    topics: ['Research Integrity', 'Bias in AI', 'Health Equity', 'Study Design'],
  },
];

/**
 * Ongoing research threads. Distinct from PUBLICATIONS — this is work in
 * progress, which is legitimate to show as long as it is labeled as such.
 */
export const RESEARCH_AREAS = [
  {
    id: 'financial-nlp',
    title: 'Financial NLP and central bank communication',
    affiliation: 'Stony Brook University',
    period: 'Nov 2024 — Present',
    status: 'Active',
    summary:
      'Extracting stance and stance-change from Federal Reserve publications, and testing whether the delta between consecutive releases carries information beyond what is already priced in.',
    outputs: ['FOMC Intelligence pipeline'],
    relatedProject: 'fomc-intelligence',
  },
  {
    id: 'medical-imaging-ml',
    title: 'Deployable ML for medical imaging',
    affiliation: 'Wake Forest University — Center for Artificial Intelligence Research',
    period: 'May 2025 — Aug 2025',
    status: 'Completed',
    summary:
      'Brain tumor segmentation with a deployment constraint: inference must run client-side so patient imaging never leaves the reviewing machine.',
    outputs: ['MRI Tumor Viewer'],
    relatedProject: 'mri-tumor-viewer',
  },
];

/**
 * Graduate coursework presentations, Stony Brook University.
 *
 * Deliberately NOT in TALKS. These are graded course projects, and listing them
 * beside a conference presentation would make the real speaking credential look
 * smaller — the course codes give it away instantly to anyone reading. Shown on
 * /research under an explicit heading so the academic context is unmistakable.
 *
 * Collaborator names are included because the work was genuinely collaborative;
 * student ID numbers from the title slides are deliberately stripped, as those
 * are PII and have no business on a public page.
 */
export const COURSEWORK = [
  {
    title: 'Cross-Lingual Document Retrieval using Embedding Models',
    course: 'AMS 691.02 — Natural Language Processing',
    instructor: 'Professor Jiawei (Joe) Zhou',
    date: '2025-01-01',
    summary:
      'Retrieval across languages using multilingual embedding models, so a query in one language surfaces relevant documents in another.',
    collaborators: ['Rutika Avinash Kadam', 'Sai Ruthvik Madireddy'],
    topics: ['NLP', 'Embeddings', 'Retrieval'],
  },
  {
    title: 'Cross-Lingual Document Retrieval and Question Answering',
    course: 'AMS 560 — Big Data Systems, Algorithms and Networks',
    instructor: 'Professor Zhenhua Liu',
    date: '2025-01-01',
    summary:
      'Extends the cross-lingual retrieval work into a question-answering system, breaking the language silos that keep parallel corpora isolated from each other.',
    collaborators: ['Meet Zalavadiya', 'Moraish Kapoor', 'Shaunak Mahajan', 'Swati'],
    topics: ['Retrieval', 'Question Answering', 'Distributed Systems'],
  },
  {
    title: 'Distributed Healthcare Cost Prediction with Spark and PySpark',
    course: 'AMS 598 — Big Data Analysis',
    instructor: 'Dr. Song Wu',
    date: '2025-12-03',
    summary:
      'Benchmarks Apache Spark against traditional systems for large-scale healthcare cost prediction, and shows that behavioural indicators can predict high drug spending without access to direct cost data.',
    collaborators: [
      'Aishwarya Bhanage',
      'Harsha Vardhan Reddy Vummadi',
      'Sriram Vivek Sanjyot Amritkar',
      'Dhananjay Sharma',
      'Gowhith Gandem',
      'Matthew Davison',
      'Xiang Ji',
      'Kabir Manoj Ohekar',
    ],
    topics: ['Apache Spark', 'PySpark', 'Distributed Computing', 'Healthcare'],
  },
  {
    title: 'Forecasting and Segmentation of Guest Booking Patterns in Hospitality',
    course: 'AMS 597 — Statistical Computing',
    date: '2025-01-01',
    summary:
      'Forecasting booking demand and segmenting guest behaviour to understand cancellations and fluctuating demand in the hospitality industry.',
    collaborators: [
      'Venkata Sai Ashrit Kommireddy',
      'Abhishek Sai Maddineni',
      'Meet Zalavadiya',
      'Harish Kandan',
    ],
    topics: ['Forecasting', 'Segmentation', 'Statistical Computing'],
  },
  {
    title: 'MovieDB: A Comprehensive Movie Database System',
    course: 'Data Management',
    date: '2025-01-01',
    summary:
      'A relational database system for cataloguing films and tracking user activity, covering schema design, normalisation, and query performance.',
    collaborators: ['Abhishek Sai Maddineni', 'S. Varshaa Sai Sripriya'],
    topics: ['PostgreSQL', 'Schema Design', 'Data Modelling'],
  },
];

/** Press, podcasts, interviews. Empty until real. */
export const MEDIA = [];

export const hasPublications = () => PUBLICATIONS.length > 0;
export const hasConferences = () => CONFERENCES.length > 0;
export const hasCoursework = () => COURSEWORK.length > 0;
export const hasTalks = () => TALKS.length > 0;
export const hasMedia = () => MEDIA.length > 0;
export const hasResearch = () => RESEARCH_AREAS.length > 0;
