import React from 'react';
import Seo from '../seo/Seo';
import { webPageSchema, faqSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, Button, ArrowIcon, DownloadIcon } from '../components/ui';
import {
  FULL_NAME,
  BIO_LONG,
  LOCATION,
  AVAILABILITY,
  IMAGES,
  RESUME_PDF,
  FOCUS_AREAS,
} from '../data/site.js';
import { EXPERIENCE, yearsOfExperience } from '../data/experience.js';
import { EDUCATION, SKILLS } from '../data/education.js';
import './AboutPage.css';

/**
 * /about — the page that answers "who is this person" for both a recruiter and
 * a crawler. Emits ProfilePage + FAQPage: the FAQ entries target the questions
 * people literally type into Google about a named person, which is what makes
 * a name query resolve to this site rather than to LinkedIn.
 */

const FAQS = [
  {
    question: 'Who is Atishay Kasliwal?',
    answer:
      'Atishay Kasliwal is an AI Engineer based in New York who builds production large language model systems, retrieval-augmented generation pipelines, and the distributed infrastructure they run on. He holds a Master of Science in Data Science from Stony Brook University.',
  },
  {
    question: 'What does Atishay Kasliwal specialize in?',
    answer:
      'Large language model systems, retrieval-augmented generation, AI agents, event-driven distributed architecture, and cloud infrastructure on AWS and GCP. His primary languages are Python, TypeScript, and Java.',
  },
  {
    question: 'Where did Atishay Kasliwal study?',
    answer:
      'Atishay Kasliwal earned a Master of Science in Data Science from Stony Brook University and a Bachelor of Technology in Computer Science and Information Technology from Symbiosis University of Applied Sciences in Indore, India.',
  },
  {
    question: 'Where has Atishay Kasliwal worked?',
    answer:
      'He is a Graduate Research Assistant at Stony Brook University, previously a machine learning intern at the Wake Forest University Center for Artificial Intelligence Research, and spent three years as a Senior Software Engineer at Accolite Digital building systems for Fidelity Investments and BT Group.',
  },
  {
    question: 'Is Atishay Kasliwal available for hire?',
    answer: `${AVAILABILITY.label}. ${AVAILABILITY.detail}. He can be reached at hire@atishaykasliwal.com.`,
  },
];

const PRINCIPLES = [
  {
    title: 'The model is the easy part',
    body: 'Most of the difficulty in an AI system is upstream and downstream of inference — data correctness, retrieval quality, latency budgets, failure modes. That is where the work actually is, and where I spend my time.',
  },
  {
    title: 'Measure the thing you claim',
    body: 'A number without a definition is decoration. P99 under what load, accuracy on which split, cost per query at what volume. If I cannot say how it was measured, I do not put it on a slide.',
  },
  {
    title: 'Build for the failure case',
    body: 'Production systems are defined by what they do when a dependency is slow, a schema changes, or a model returns nonsense. The happy path is the demo; the rest is the job.',
  },
  {
    title: 'Ship, then earn the complexity',
    body: 'Every abstraction should be paid for by a problem that already exists. I would rather ship something plain and add structure when the pressure is real than build for a scale that never arrives.',
  },
];

export default function AboutPage() {
  const meta = resolveMeta('/about');
  const years = yearsOfExperience();

  return (
    <>
      <Seo
        path="/about"
        schema={[webPageSchema(meta, 'ProfilePage'), faqSchema(FAQS)]}
      />

      <PageHeader
        eyebrow="About"
        title={`${FULL_NAME} builds AI systems that hold up in production.`}
        lede={`${years} years of engineering across research, healthcare, and financial infrastructure — most of it on the parts of a system that decide whether a model is actually useful.`}
        breadcrumbs={meta.breadcrumbs}
      >
        <Button href={RESUME_PDF} download icon={<DownloadIcon />}>
          Download résumé
        </Button>
        <Button to="/contact" variant="ghost" icon={<ArrowIcon />}>
          Get in touch
        </Button>
      </PageHeader>

      <Section className="about-intro">
        <Container>
          <div className="about-grid">
            <div className="about-bio">
              {BIO_LONG.split('\n\n').map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>

            <aside className="about-aside" aria-label="Quick facts">
              <img
                className="about-portrait"
                src={IMAGES.headshot.src}
                width={IMAGES.headshot.width}
                height={IMAGES.headshot.height}
                alt={IMAGES.headshot.alt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <dl className="about-facts">
                <div>
                  <dt>Location</dt>
                  <dd>{LOCATION.display}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>LLM systems, RAG, distributed infrastructure</dd>
                </div>
                <div>
                  <dt>Education</dt>
                  <dd>MS Data Science, Stony Brook University</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="status-dot" aria-hidden="true" />
                    {AVAILABILITY.label}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="about-focus">
        <Container>
          <h2 className="section-title">What I work on</h2>
          <ul className="focus-list">
            {FOCUS_AREAS.map((area) => (
              <li key={area} className="focus-item">
                {area}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="about-principles">
        <Container>
          <h2 className="section-title">How I work</h2>
          <div className="principles-grid">
            {PRINCIPLES.map((p, i) => (
              <article key={p.title} className="principle">
                <span className="principle-num mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="principle-title">{p.title}</h3>
                <p className="principle-body">{p.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="about-skills">
        <Container>
          <h2 className="section-title">Technical depth</h2>
          <div className="skills-grid">
            {SKILLS.map((group) => (
              <div key={group.category} className={`skill-group${group.primary ? ' is-primary' : ''}`}>
                <h3 className="skill-category">{group.category}</h3>
                <ul className="skill-items">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="about-education">
        <Container>
          <h2 className="section-title">Education</h2>
          <ul className="edu-list">
            {EDUCATION.map((e) => (
              <li key={e.id} className="edu-item">
                <div className="edu-head">
                  <h3 className="edu-degree">{e.degree}</h3>
                  <span className="edu-period mono">{e.period}</span>
                </div>
                <p className="edu-school">
                  {e.schoolUrl ? (
                    <a href={e.schoolUrl} target="_blank" rel="noopener noreferrer">
                      {e.school}
                    </a>
                  ) : (
                    e.school
                  )}{' '}
                  · {e.location}
                </p>
                <p className="edu-meta">GPA {e.gpa}</p>
                <p className="edu-courses">{e.coursework.join(' · ')}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Rendered visibly as well as in JSON-LD. Google will not show an FAQ
          rich result for content that exists only in structured data. */}
      <Section className="about-faq">
        <Container width="prose">
          <h2 className="section-title">Common questions</h2>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details key={f.question} className="faq-item">
                <summary className="faq-q">{f.question}</summary>
                <p className="faq-a">{f.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="about-cta">
        <Container>
          <div className="cta-panel">
            <h2 className="cta-title">Currently open to new roles.</h2>
            <p className="cta-body">{AVAILABILITY.detail}</p>
            <div className="cta-actions">
              <Button to="/contact" icon={<ArrowIcon />}>
                Get in touch
              </Button>
              <Button href={RESUME_PDF} download variant="ghost" icon={<DownloadIcon />}>
                Résumé
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
