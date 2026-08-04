/**
 * Education. Feeds `alumniOf` in Person schema and the /about timeline.
 * Institution URLs matter here: they let Google link this Person entity to
 * two already-established Organization entities, which is one of the
 * strongest signals available for entity disambiguation.
 */

export const EDUCATION = [
  {
    id: 'stony-brook',
    degree: 'Master of Science in Data Science',
    degreeShort: 'MS, Data Science',
    school: 'Stony Brook University',
    schoolUrl: 'https://www.stonybrook.edu/',
    sameAs: 'https://en.wikipedia.org/wiki/Stony_Brook_University',
    location: 'Stony Brook, New York',
    startDate: '2024-08-01',
    endDate: '2026-05-31',
    period: 'Aug 2024 — May 2026',
    gpa: '3.64 / 4.0',
    coursework: [
      'Neural Networks',
      'Big Data Algorithms and Networks',
      'Big Data Analytics',
      'Statistical Computing',
      'Data Management',
    ],
  },
  {
    id: 'symbiosis',
    degree: 'Bachelor of Technology in Computer Science and Information Technology',
    degreeShort: 'BTech, Computer Science & IT',
    school: 'Symbiosis University of Applied Sciences',
    schoolUrl: 'https://www.suas.ac.in/',
    sameAs: null,
    location: 'Indore, Madhya Pradesh, India',
    startDate: '2018-08-01',
    endDate: '2022-05-31',
    period: 'Aug 2018 — May 2022',
    gpa: '3.6 / 4.0',
    coursework: [
      'Distributed Systems',
      'Operating Systems',
      'Computer Networks',
      'Data Structures',
      'Algorithms',
      'Software Development',
    ],
  },
];

export const SKILLS = [
  {
    category: 'AI & Machine Learning',
    primary: true,
    items: [
      'Large Language Models',
      'Retrieval-Augmented Generation',
      'LLM Agents',
      'PyTorch',
      'Transformers',
      'LangChain',
      'Vector Search',
      'Embeddings',
      'NLP',
      'Computer Vision',
      'scikit-learn',
      'Model Evaluation',
    ],
  },
  {
    category: 'Languages',
    items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'Go', 'C++'],
  },
  {
    category: 'Backend & Distributed Systems',
    items: [
      'FastAPI',
      'Spring Boot',
      'Node.js',
      'Kafka',
      'REST',
      'GraphQL',
      'Microservices',
      'Event-Driven Architecture',
      'OAuth 2.0',
      'Caching',
      'Message Queues',
    ],
  },
  {
    category: 'Data & Storage',
    items: [
      'PostgreSQL',
      'DynamoDB',
      'MongoDB',
      'Redis',
      'Elasticsearch',
      'MySQL',
      'pgvector',
      'ETL / ELT',
    ],
  },
  {
    category: 'Cloud & Infrastructure',
    items: [
      'AWS (Lambda, ECS, S3, SQS, API Gateway)',
      'GCP',
      'Cloudflare Workers',
      'Docker',
      'Kubernetes',
      'Terraform',
      'Jenkins',
      'CI/CD',
      'Prometheus',
      'CloudWatch',
    ],
  },
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Vite', 'CSS Architecture', 'Web Performance', 'Accessibility'],
  },
];

/**
 * Certifications and awards. Deliberately empty — the previous site had no
 * verifiable entries and inventing them would be both dishonest and, since
 * recruiters verify, actively harmful. Populate with real credentials only;
 * the /about page and Person schema pick these up automatically once non-empty.
 */
export const AWARDS = [];
export const CERTIFICATIONS = [];
