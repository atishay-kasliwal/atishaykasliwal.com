import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Resume.css';

const EXPERIENCE = [
  {
    period: 'Nov 2024 – Present',
    company: 'Stony Brook University',
    location: 'Stony Brook, NY',
    role: 'Software Engineer – Research',
    type: 'Research',
    bullets: [
      'Built a fault-tolerant, event-driven data pipeline in Python, FastAPI, and AWS processing 200K+ financial data points in real time — achieving 27% portfolio return and $2.6K profit with zero data loss under variable load.',
      'Designed a distributed ingestion system on AWS Lambda and S3, processing financial news and transcripts across 3.7K+ time-series intervals with structured schema validation and 99.9% availability.',
      'Architected RESTful APIs in FastAPI and DynamoDB exposing structured financial data across distributed microservices — maintaining sub-300ms P99 latency at production scale.',
      'Implemented Docker-based CI/CD pipelines on AWS with Jenkins, cutting deployment time by 97%; built production observability via Prometheus and CloudWatch to catch defects before customers are impacted.',
    ],
  },
  {
    period: 'May 2025 – Aug 2025',
    company: 'Wake Forest – CAIR',
    location: 'Winston-Salem, NC',
    role: 'Software Engineer – Summer Intern',
    type: 'Internship',
    bullets: [
      'Built an end-to-end ML pipeline in Python and PyTorch on GCP, achieving 90% classification accuracy and reducing clinical processing time from 20+ minutes to under 5 minutes — enabling 4x throughput improvement across 1,250+ patient cases.',
      'Provisioned fault-tolerant cloud infrastructure on GCP using Terraform and Firebase, enabling real-time ML inference at scale across 50K+ scans (10TB+) with durable, zero-loss data handling.',
    ],
  },
  {
    period: 'Aug 2021 – Aug 2024',
    company: 'Accolite Digital',
    location: 'Hyderabad, India',
    role: 'Senior Software Engineer',
    type: 'Full-time',
    bullets: [
      'Architected an event-driven ETL system for Fidelity in Java, Spring Boot, and Kafka — automating integration across 10+ enterprise systems with 99% uptime and 100% test coverage across all production paths.',
      'Owned a serverless platform in Python, Node.js, and AWS Lambda processing async workflows and onboarding 3K+ customers via REST API integrations — responsible for reliability, on-call response, and production health end-to-end.',
      'Eliminated 40% P99 latency and achieved zero Sev1 incidents post-deployment by rearchitecting Redis caching and Elasticsearch layers for a distributed system serving 100K+ customers.',
      'Delivered production REST and GraphQL APIs in Java, Spring Boot, and MySQL for BT Telecom — processing 1,000+ daily transactions at sub-200ms P99 with 99% uptime.',
    ],
  },
  {
    period: 'Aug 2020 – Jul 2021',
    company: 'Shriffle',
    location: 'Indore, India',
    role: 'Software Engineer – Intern',
    type: 'Internship',
    bullets: [
      'Designed and owned a centralized secrets management microservice in Java, Spring Boot, and MongoDB on AWS — implementing OAuth 2.0 and JWT to secure cross-service authentication across 8+ microservices with zero credential breaches in production.',
      'Built telecom microservices in Java and Spring Boot processing 10K+ daily transactions with comprehensive JUnit coverage and zero production regressions.',
    ],
  },
];

const PROJECTS = [
  {
    name: 'Atriveo',
    stack: 'Python · React · FastAPI · PostgreSQL · Docker',
    period: 'Jan 2026 – Present',
    bullets: [
      'Own and operate Atriveo end-to-end — a full-stack job search platform in Python, FastAPI, React, TypeScript, and PostgreSQL serving 100+ active customers at 2K+ daily queries with 99.9% uptime.',
      'Shipped a Chrome extension rated 5.0/5.0 stars on the Chrome Web Store — the highest possible bar — by working backwards from customer needs and iterating rapidly without sacrificing quality.',
    ],
  },
];

const EDUCATION = [
  {
    period: 'Aug 2024 – May 2026',
    school: 'Stony Brook University',
    location: 'Stony Brook, New York',
    degree: 'Master of Science in Data Science',
  },
  {
    period: 'Aug 2018 – May 2022',
    school: 'Symbiosis University of Applied Sciences',
    location: 'Indore, Madhya Pradesh',
    degree: 'Bachelor of Technology in Computer Science & IT',
  },
];

const SKILLS = [
  { category: 'Languages', items: ['Java', 'Python', 'TypeScript', 'JavaScript', 'Node.js', 'SQL'] },
  { category: 'Backend', items: ['Spring Boot', 'FastAPI', 'Kafka', 'REST APIs', 'GraphQL', 'Microservices', 'OAuth 2.0', 'JWT'] },
  { category: 'Systems', items: ['Distributed Systems', 'Event-Driven Architecture', 'CI/CD', 'Release Engineering', 'System Design', 'Caching', 'Message Queues'] },
  { category: 'Data & Storage', items: ['PostgreSQL', 'MySQL', 'DynamoDB', 'MongoDB', 'Redis', 'Elasticsearch', 'ETL/ELT', 'NoSQL'] },
  { category: 'Cloud & Infrastructure', items: ['AWS (Lambda, S3, ECS, SQS, DynamoDB, CloudWatch)', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Git'] },
  { category: 'ML / AI', items: ['PyTorch', 'scikit-learn', 'NLP', 'Deep Learning', 'A/B Experimentation', 'LangChain', 'RAG'] },
];

const STATS = [
  { label: 'Role', value: 'Software Engineer' },
  { label: 'Focus', value: 'AI/ML · Data Science' },
  { label: 'Experience', value: '4+ years' },
  { label: 'Location', value: 'New York, NY' },
  { label: 'Availability', value: 'Open to Relocation' },
];

function highlightMetrics(text) {
  const pattern = /(\d[\d,.KkMm+%x]*[KkMm+%x]*(?:\s*(?:users|records|scans|cases|transactions|uptime|accuracy|profit|return|latency|ms|TB|K\+|M\+))?|\$[\d,.]+[Km]?|(?:\d+)%|P99|99\.9%|99%|27%|90%|97%|40%|100%|\$2\.6K|200K\+|3\.7K\+|50K\+|100K\+|10K\+|3K\+|1,250\+|1,000\+|300ms|200ms)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? <mark key={i} className="rp-metric">{part}</mark> : part
  );
}

export default function Resume() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="resume-page">
      <div className="bg-art" />

      <div className="header">
        <div className="header-inner">
          <Link to="/" className="nav-logo">Atishay Kasliwal</Link>
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Link to="/highlights">Work</Link>
            <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="/Atishay_Kasliwal.pdf" className="nav-resume-btn" download>↓ PDF</a>
          </nav>
        </div>
      </div>

      <div className="resume-content">

        {/* Hero */}
        <section className="rp-hero">
          <p className="rp-eyebrow">Software Engineer · AI / ML · Data Science · Distributed Systems</p>
          <h1 className="rp-name">Atishay Kasliwal</h1>
          <p className="rp-tagline">
            Software Engineer with 4+ years building distributed systems, high-availability services, and ML pipelines at scale. Deep experience in event-driven architecture, CI/CD, and consumer-facing APIs in Java, Python, and AWS. Currently pursuing MS in Data Science at Stony Brook University.
          </p>
          <div className="rp-meta-row">
            <span className="rp-meta-item">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="currentColor"/></svg>
              New York, NY · Open to relocation
            </span>
            <span className="rp-meta-dot">·</span>
            <a href="mailto:katishay@gmail.com" className="rp-meta-item rp-meta-link">katishay@gmail.com</a>
            <span className="rp-meta-dot">·</span>
            <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" className="rp-meta-item rp-meta-link">LinkedIn</a>
            <span className="rp-meta-dot">·</span>
            <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" className="rp-meta-item rp-meta-link">GitHub</a>
          </div>
          <div className="rp-cta-row">
            <a
              href="/Atishay_Kasliwal.pdf"
              className="rp-btn rp-btn--primary"
              download
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M4 8l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Resume PDF
            </a>
            <a href="mailto:katishay@gmail.com" className="rp-btn rp-btn--ghost">Get in touch</a>
          </div>
        </section>

        {/* Stats bar */}
        <div className="rp-stats-bar">
          {STATS.map((s) => (
            <div key={s.label} className="rp-stat-item">
              <span className="rp-stat-label">{s.label}</span>
              <span className="rp-stat-value">
                {s.label === 'Availability' && <span className="rp-status-dot" />}
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Experience */}
        <section className="rp-section">
          <h2 className="rp-section-title">Experience</h2>
          <div className="rp-cards">
            {EXPERIENCE.map((exp, i) => (
              <div key={i} className="rp-card">
                <div className="rp-card-rail">
                  <span className="rp-card-period">{exp.period}</span>
                  <span className="rp-card-company">{exp.company}</span>
                  <span className="rp-card-location">{exp.location}</span>
                  <span className={`rp-card-badge rp-card-badge--${exp.type === 'Full-time' ? 'full' : exp.type === 'Research' ? 'research' : 'intern'}`}>
                    {exp.type}
                  </span>
                </div>
                <div className="rp-card-body">
                  <h3 className="rp-card-role">{exp.role}</h3>
                  <ul className="rp-card-bullets">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="rp-section">
          <h2 className="rp-section-title">Projects</h2>
          <div className="rp-cards">
            {PROJECTS.map((proj, i) => (
              <div key={i} className="rp-card rp-card--project">
                <div className="rp-card-rail">
                  <span className="rp-card-period">{proj.period}</span>
                  <span className="rp-card-company">{proj.name}</span>
                  <span className="rp-card-location rp-card-stack">{proj.stack}</span>
                </div>
                <div className="rp-card-body">
                  <h3 className="rp-card-role">{proj.name}</h3>
                  <ul className="rp-card-bullets">
                    {proj.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="rp-section">
          <h2 className="rp-section-title">Education</h2>
          <div className="rp-cards">
            {EDUCATION.map((edu, i) => (
              <div key={i} className="rp-card">
                <div className="rp-card-rail">
                  <span className="rp-card-period">{edu.period}</span>
                  <span className="rp-card-company">{edu.school}</span>
                  <span className="rp-card-location">{edu.location}</span>
                </div>
                <div className="rp-card-body rp-card-body--edu">
                  <h3 className="rp-card-role">{edu.degree}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="rp-section">
          <h2 className="rp-section-title">Technical Skills</h2>
          <div className="rp-skills-grid">
            {SKILLS.map((group) => (
              <div key={group.category} className="rp-skill-group">
                <span className="rp-skill-category">{group.category}</span>
                <div className="rp-skill-tags">
                  {group.items.map((item) => (
                    <span key={item} className="rp-skill-tag">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="rp-footer-cta">
          <div className="rp-footer-cta-inner">
            <div>
              <p className="rp-footer-cta-heading">Open to full-time roles</p>
              <p className="rp-footer-cta-sub"><span className="rp-status-dot" />New York, NY · Remote · Open to relocation</p>
            </div>
            <div className="rp-cta-row">
              <a href="mailto:katishay@gmail.com" className="rp-btn rp-btn--primary">katishay@gmail.com</a>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" className="rp-btn rp-btn--ghost">LinkedIn</a>
              <a href="/Atishay_Kasliwal.pdf" className="rp-btn rp-btn--ghost" download>↓ PDF</a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
