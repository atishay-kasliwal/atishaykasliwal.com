/**
 * Employment history — the factual record.
 *
 * These are the literal titles and employers, and they must stay exact even
 * where the site's positioning language elsewhere says "AI Engineer". Resolved
 * Aug 2021 – Aug 2024 to Accolite Digital (the previous `about-me.json` listed
 * Bounteous for the same dates, which was the conflicting entry and has been
 * removed).
 *
 * `startDate` / `endDate` are ISO so they can feed schema.org and sort
 * reliably. `endDate: null` means current.
 */

export const EXPERIENCE = [
  {
    id: 'stony-brook-research',
    role: 'Graduate Research Assistant, Software Engineering',
    company: 'Stony Brook University',
    companyUrl: 'https://www.stonybrook.edu/',
    location: 'Stony Brook, NY',
    type: 'Research',
    current: true,
    startDate: '2024-11-01',
    endDate: null,
    period: 'Nov 2024 — Present',
    summary:
      'Financial NLP research: event-driven pipelines that turn Federal Reserve communications into structured trading signals.',
    stack: ['Python', 'FastAPI', 'AWS Lambda', 'DynamoDB', 'S3', 'Docker', 'Prometheus'],
    highlights: [
      {
        text: 'Built a fault-tolerant, event-driven pipeline in Python and FastAPI on AWS processing 200K+ financial data points in real time with zero data loss under variable load.',
        metric: '200K+',
        metricLabel: 'data points',
      },
      {
        text: 'Designed a distributed ingestion system on AWS Lambda and S3 covering 3.7K+ time-series intervals with schema validation, sustaining 99.9% availability.',
        metric: '99.9%',
        metricLabel: 'availability',
      },
      {
        text: 'Architected REST APIs in FastAPI and DynamoDB exposing structured financial data across microservices at sub-300ms P99 latency.',
        metric: '<300ms',
        metricLabel: 'P99 latency',
      },
      {
        text: 'Implemented Docker-based CI/CD on AWS with Jenkins, cutting deployment time by 97%, and added Prometheus/CloudWatch observability to catch defects before release.',
        metric: '97%',
        metricLabel: 'faster deploys',
      },
    ],
  },
  {
    id: 'wake-forest-cair',
    role: 'Software Engineer, Machine Learning (Intern)',
    company: 'Wake Forest University — Center for Artificial Intelligence Research',
    companyShort: 'Wake Forest CAIR',
    companyUrl: 'https://school.wakehealth.edu/',
    location: 'Winston-Salem, NC',
    type: 'Internship',
    current: false,
    startDate: '2025-05-01',
    endDate: '2025-08-31',
    period: 'May 2025 — Aug 2025',
    summary:
      'Medical imaging ML: a diagnostic pipeline that cut clinical processing from twenty minutes to under five.',
    stack: ['Python', 'PyTorch', 'GCP', 'Terraform', 'Firebase'],
    highlights: [
      {
        text: 'Built an end-to-end ML pipeline in PyTorch on GCP reaching 90% classification accuracy across 1,250+ patient cases.',
        metric: '90%',
        metricLabel: 'accuracy',
      },
      {
        text: 'Reduced clinical processing time from 20+ minutes to under 5, a 4x throughput improvement for the reviewing team.',
        metric: '4x',
        metricLabel: 'throughput',
      },
      {
        text: 'Provisioned fault-tolerant GCP infrastructure with Terraform and Firebase for real-time inference across 50K+ scans (10TB+) with zero-loss data handling.',
        metric: '10TB+',
        metricLabel: 'imaging data',
      },
    ],
  },
  {
    id: 'accolite-digital',
    role: 'Senior Software Engineer',
    company: 'Accolite Digital',
    companyUrl: 'https://www.accolite.com/',
    location: 'Hyderabad, India',
    type: 'Full-time',
    current: false,
    startDate: '2021-08-01',
    endDate: '2024-08-31',
    period: 'Aug 2021 — Aug 2024',
    summary:
      'Three years on distributed backend systems for Fidelity Investments and BT Group — event-driven ETL, serverless platforms, and latency work at 100K+ customer scale.',
    clients: ['Fidelity Investments', 'BT Group'],
    stack: ['Java', 'Spring Boot', 'Kafka', 'AWS Lambda', 'Redis', 'Elasticsearch', 'MySQL', 'GraphQL'],
    highlights: [
      {
        text: 'Architected an event-driven ETL system for Fidelity Investments in Java, Spring Boot, and Kafka, automating integration across 10+ enterprise systems at 99% uptime with full test coverage on production paths.',
        metric: '10+',
        metricLabel: 'systems integrated',
      },
      {
        text: 'Owned a serverless platform in Python, Node.js, and AWS Lambda handling async workflows and onboarding 3K+ customers through REST integrations — including reliability and on-call.',
        metric: '3K+',
        metricLabel: 'customers onboarded',
      },
      {
        text: 'Cut P99 latency by 40% and eliminated Sev1 incidents by rearchitecting the Redis caching and Elasticsearch layers of a system serving 100K+ customers.',
        metric: '40%',
        metricLabel: 'P99 reduction',
      },
      {
        text: 'Delivered production REST and GraphQL APIs in Java, Spring Boot, and MySQL for BT Group, processing 1,000+ daily transactions at sub-200ms P99.',
        metric: '<200ms',
        metricLabel: 'P99 latency',
      },
    ],
  },
  {
    id: 'shriffle',
    role: 'Software Engineer (Intern)',
    company: 'Shriffle',
    companyUrl: null,
    location: 'Indore, India',
    type: 'Internship',
    current: false,
    startDate: '2020-08-01',
    endDate: '2021-07-31',
    period: 'Aug 2020 — Jul 2021',
    summary: 'Secrets management and telecom microservices on AWS.',
    stack: ['Java', 'Spring Boot', 'MongoDB', 'AWS', 'OAuth 2.0', 'JWT'],
    highlights: [
      {
        text: 'Designed and owned a centralized secrets management microservice in Java, Spring Boot, and MongoDB, securing cross-service auth across 8+ microservices with OAuth 2.0 and JWT and zero credential breaches in production.',
        metric: '8+',
        metricLabel: 'services secured',
      },
      {
        text: 'Built telecom microservices processing 10K+ daily transactions with comprehensive JUnit coverage and zero production regressions.',
        metric: '10K+',
        metricLabel: 'daily transactions',
      },
    ],
  },
];

export const CURRENT_ROLE = EXPERIENCE.find((e) => e.current) || EXPERIENCE[0];

/** Companies worked with, for the "trusted by" strip and Organization schema. */
export const NOTABLE_ORGS = [
  { name: 'Fidelity Investments', logo: '/logos/fidelity.png', via: 'Accolite Digital' },
  { name: 'BT Group', logo: '/logos/bt-group.png', via: 'Accolite Digital' },
  { name: 'Stony Brook University', logo: '/logos/stony-brook.png', via: null },
  { name: 'Wake Forest University', logo: '/logos/wake-forest.png', via: null },
  { name: 'Accolite Digital', logo: '/logos/accolite.png', via: null },
];

/**
 * Derived headline number. Computed rather than hardcoded so it never goes
 * stale — the old copy claimed "5+ years" on one page and "4+ years" on
 * another, which is the kind of thing recruiters notice.
 */
export function yearsOfExperience(now = new Date()) {
  const start = new Date('2020-08-01');
  return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
}
