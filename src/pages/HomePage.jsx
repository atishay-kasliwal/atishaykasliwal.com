import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SiteHeader from '../SiteHeader';
import StoryTimeline from '../StoryTimeline';
import SkillsSection from '../components/SkillsSection';
import FinalProductGrid from '../components/FinalProductGrid';
import BookingPanel from '../components/BookingPanel';
import '../styles/hero.css';
import '../styles/editorial.css';
import '../styles/testimonials.css';
import '../styles/buttons.css';

import img1 from '../assets/FidelityLogo.png';
import img4 from '../assets/bt-logo-redesign-sq-1.jpg';
import img6 from '../assets/stony_brook_university_logo.jpeg';
import img7 from '../assets/Accolite Digital_iduk-Sna9f_3.png';
import img8 from '../assets/atrium_health_wake_forest_baptist_logo.jpeg';
import img9 from '../assets/shriffle.png';
import ankitPhoto from '../assets/Ankit Jain.jpeg';
import wencuiPhoto from '../assets/Prof.jpeg';
import nehaPhoto from '../assets/Neha gupta.jpeg';
import goldyPhoto from '../assets/goldey.jpeg';
import daMaPhoto from '../assets/da ma.jpeg';
import gunjanPhoto from '../assets/gunjanjain.jpg';

const gridImages = [
  { src: img6, company: 'Stony Brook University', role: 'SWE Research', impact: 'Financial data pipelines · 27% portfolio return' },
  { src: img8, light: true, company: 'Wake Forest – CAIR', role: 'SWE Intern · ML', impact: 'ML pipeline · 90% accuracy · 1,250+ patient cases' },
  { src: img1, company: 'Fidelity Investments', role: 'Senior SWE (via Accolite)', impact: 'Event-driven ETL · 10+ enterprise systems · 99% uptime' },
  { src: img4, company: 'BT Group', role: 'SWE (via Accolite)', impact: 'GraphQL & REST APIs · 1K+ daily transactions at 200ms P99' },
  { src: img7, light: true, company: 'Accolite Digital', role: 'Senior Software Engineer', impact: 'Distributed systems · 100K+ users · 40% latency reduction' },
  { src: img9, light: true, company: 'Shriffle', role: 'SWE Intern', impact: 'Secrets management microservice · 8+ microservices secured' },
];

const testimonials = [
  {
    text: 'Atishay delivered our project ahead of schedule and exceeded expectations. His technical skills made him invaluable.',
    name: 'Ankit Jain⭐⭐⭐⭐⭐',
    company: 'Accolite Digital',
    post: 'Technical Director',
    photo: ankitPhoto,
  },
  {
    text: 'Atishay developed an NLP pipeline and designed an LLM-based trading simulation with clear visualizations.',
    name: 'Wencui Han⭐⭐⭐⭐⭐',
    company: 'Stony Brook University',
    post: 'Professor',
    photo: wencuiPhoto,
  },
  {
    text: 'Creative and reliable, Atishay brought fresh ideas to our projects and fostered a collaborative environment.',
    name: 'Neha Gupta⭐⭐⭐⭐⭐',
    company: 'Symbiosis University',
    post: 'Director SCSIT',
    photo: nehaPhoto,
  },
  {
    text: 'Atishay delivered our product on time with perfection. His technical expertise exceeded our expectations.',
    name: 'Gunjan Jain⭐⭐⭐⭐⭐',
    company: 'Brains and Taxes',
    post: 'Private Limited',
    photo: gunjanPhoto,
  },
  {
    text: "Atishay's ML expertise was instrumental in our research. His technical skills made our project a huge success.",
    name: 'Dr. Goldy Khanna⭐⭐⭐⭐⭐',
    company: 'Wake Forest University',
    post: 'Cerebrovascular & Skull Base Neurosurgeon',
    photo: goldyPhoto,
  },
  {
    text: 'Working with Atishay was a pleasure. His innovative approach made him exceptional.',
    name: 'Dr. Da Ma⭐⭐⭐⭐⭐',
    company: 'Wake Forest University',
    post: 'Assistant Professor',
    photo: daMaPhoto,
  },
];

function HomePage() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleTestimonials = windowWidth <= 768 ? testimonials.slice(0, 3) : testimonials;

  return (
    <>
      <Helmet>
        <html lang="en" translate="no" />
        <title>Atishay Kasliwal - Software Engineer | Portfolio & Resume</title>
        <link rel="canonical" href="https://atishaykasliwal.com/" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Atishay Kasliwal - Software Engineer" />
        <meta property="og:description" content="Portfolio & resume of Atishay Kasliwal - Software Engineer specializing in distributed systems, ML pipelines, and backend engineering. MS Data Science, Stony Brook University." />
        <meta property="og:url" content="https://atishaykasliwal.com/" />
        <meta property="og:image" content="https://atishaykasliwal.com/atishaylogo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Atishay Kasliwal - Software Engineer" />
        <meta name="twitter:description" content="Portfolio & resume of Atishay Kasliwal - Software Engineer specializing in distributed systems, ML pipelines, and backend engineering. MS Data Science, Stony Brook University." />
        <meta name="description" content="Atishay Kasliwal - Software Engineer. Portfolio, resume, and projects. 4+ years building scalable distributed systems across fintech, healthcare, and research. MS Data Science at Stony Brook University. Python, Java, FastAPI, Spring Boot, AWS, GCP." />
        <meta name="keywords" content="Atishay Kasliwal, Atishay Kasliwal portfolio, Atishay Kasliwal resume, software engineer, distributed systems, machine learning, Python developer, Java developer, FastAPI, Spring Boot, Stony Brook University, Accolite Digital, Wake Forest CAIR, Atriveo" />
        <meta name="author" content="Atishay Kasliwal" />
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "https://atishaykasliwal.com/#person",
            "name": "Atishay Kasliwal",
            "url": "https://atishaykasliwal.com/",
            "image": "https://atishaykasliwal.com/atishaylogo.png",
            "description": "Software Engineer specializing in distributed systems, ML pipelines, and backend engineering. MS Data Science, Stony Brook University.",
            "jobTitle": "Software Engineer",
            "email": "katishay@gmail.com",
            "alumniOf": [
              { "@type": "CollegeOrUniversity", "name": "Stony Brook University" },
              { "@type": "CollegeOrUniversity", "name": "Symbiosis University of Applied Sciences" }
            ],
            "sameAs": [
              "https://www.linkedin.com/in/atishay-kasliwal/",
              "https://github.com/atishay-kasliwal",
              "https://x.com/AtiahayKasliwal",
              "https://www.instagram.com/atishay_kasliwal/"
            ]
          }`}
        </script>
      </Helmet>

      <div className="page-content page-content--landing" translate="no">
        <SiteHeader />

        <div className="landing-hero-wrap" translate="no">
          <div className="landing-hero-stack" translate="no">
            <div className="landing-two-col" data-analytics-section="hero" translate="no">
              <div className="landing-left-text" translate="no">
                <p className="hero-eyebrow" translate="no">
                  Software Engineer · Distributed Systems · Machine Learning
                </p>
                <h1 className="hero-name" translate="no">Atishay Kasliwal</h1>
                <p className="hero-description" translate="no">
                  Software engineer with 4+ years building scalable distributed systems and ML pipelines
                  across fintech, healthcare, and research. Currently pursuing MS in Data Science at Stony
                  Brook University.
                </p>
                <div className="button-group-theme hero-ctas" translate="no">
                  <Link
                    to="/highlights"
                    className="btn-theme btn-primary-action btn-lg"
                    data-cta-position="hero_view_work"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }}>
                      View Work
                      <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                  <Link to="/resume" className="btn-theme btn-secondary btn-lg" data-cta-position="hero_resume">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }}>Resume</span>
                  </Link>
                  <a
                    href="https://www.linkedin.com/in/atishay-kasliwal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-theme btn-icon btn-lg"
                    aria-label="LinkedIn"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/atishay-kasliwal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-theme btn-icon btn-lg"
                    aria-label="GitHub"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
                <div className="hero-stats" translate="no">
                  <div className="hero-stat">
                    <span className="hero-stat-num">5+</span>
                    <span className="hero-stat-label">Years Experience</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-num">10+</span>
                    <span className="hero-stat-label">Projects Shipped</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-num">8+</span>
                    <span className="hero-stat-label">Enterprise Clients</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-num">MS</span>
                    <span className="hero-stat-label">
                      Data Science,
                      <br />
                      Stony Brook
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side — booking panel */}
              <div className="landing-right-images">
                <BookingPanel />
              </div>

            </div>
          </div>
        </div>

        <section className="editorial-grid-section section-wrap" data-analytics-section="editorial" translate="no">
          <div className="editorial-grid-inner">
            <div className="editorial-grid-header" translate="no">
              <h2 translate="no">Featured Highlights</h2>
              <p translate="no">A curated look at recent work, research, and creative explorations.</p>
            </div>
            <div className="editorial-grid" translate="no">
              <Link
                to="/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01"
                className="editorial-card editorial-card--wide editorial-card--has-bg"
                style={{ backgroundImage: 'url(/fmocc.jpeg)' }}
                aria-label="Read more: FOMC Intelligence Dashboard"
                data-feature-name="FOMC Intelligence Dashboard"
                translate="no"
              >
                <span className="editorial-tag" translate="no">Research</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">NLP · Monetary Policy</span>
                  <h3>Decoding the Fed, One Meeting at a Time</h3>
                  <p className="editorial-desc">
                    Parses FOMC transcripts and press releases to surface rate signals, hawkish/dovish
                    sentiment shifts, and policy language trends across meeting cycles.
                  </p>
                  <span className="editorial-cta">
                    Read case study{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </Link>

              <Link
                to="/highlights/c3d4e5f6-a7b8-4901-c234-56789abcdef0"
                className="editorial-card editorial-card--medium editorial-card--has-bg"
                style={{ backgroundImage: 'url(/4th.jpeg)' }}
                aria-label="Discover: Legal RAG"
                data-feature-name="Legal RAG System"
                translate="no"
              >
                <span className="editorial-tag" translate="no">AI</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">LLM · Document Intelligence</span>
                  <h3>Ask Your Documents Anything</h3>
                  <p className="editorial-desc">
                    A retrieval-augmented generation pipeline that lets you query legal documents, filings,
                    and contracts using natural language.
                  </p>
                  <span className="editorial-cta">
                    Try the demo{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </Link>

              <Link
                to="/highlights/f6a7b8c9-d0e1-4234-f567-89abcdef0123"
                className="editorial-card editorial-card--medium editorial-card--has-bg"
                style={{ backgroundImage: 'url(/5th%20image.jpeg)' }}
                aria-label="Explore: PolicyFabric"
                data-feature-name="PolicyFabric"
                translate="no"
              >
                <span className="editorial-tag" translate="no">Systems</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">Systems Design · Data Contracts</span>
                  <h3>Policy Enforcement at Every Layer</h3>
                  <p className="editorial-desc">
                    A live architecture walkthrough of how raw data flows through aggregation, contract
                    validation, and cryptographic signing before reaching consumers.
                  </p>
                  <span className="editorial-cta">
                    Explore the system{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </Link>

              <a
                href="https://chromewebstore.google.com/detail/atriveo-job-assistant/ocbmncmmepfjgpnakenoibaambecidcf?authuser=0&hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-card editorial-card--medium editorial-card--has-bg"
                style={{ backgroundImage: 'url(/chrome.png)' }}
                aria-label="View demo: Job Intelligence Platform"
                data-feature-name="Atriveo Chrome Extension"
                translate="no"
              >
                <span className="editorial-tag" translate="no">Product</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">AI Product · Hiring</span>
                  <h3>Smarter Hiring Starts Here</h3>
                  <p className="editorial-desc">
                    AI-native recruitment intelligence that ranks candidates, surfaces behavioral signals,
                    and helps teams hire faster with less noise.
                  </p>
                  <span className="editorial-cta">
                    Visit Atriveo{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </a>

              <Link
                to="/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012"
                className="editorial-card editorial-card--medium editorial-card--has-bg"
                style={{ backgroundImage: 'url(/mriimage.jpeg)' }}
                aria-label="View: MRI Brain Tumor Viewer"
                data-feature-name="MRI Brain Tumor Viewer"
                translate="no"
              >
                <span className="editorial-tag" translate="no">Medical AI</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">Computer Vision · Radiology</span>
                  <h3>Tumor Detection, Scan to Insight</h3>
                  <p className="editorial-desc">
                    An interactive MRI viewer powered by a trained CNN that segments and classifies brain
                    tumor regions directly in the browser.
                  </p>
                  <span className="editorial-cta">
                    View project{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </Link>

              <a
                href="https://www.atriveo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-card editorial-card--wide editorial-card--has-bg"
                style={{ backgroundImage: 'url(/Atriveo6th.png)' }}
                aria-label="Visit Atriveo"
                data-feature-name="Atriveo Platform"
                translate="no"
              >
                <span className="editorial-tag" translate="no">Product</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">AI Recruiting Platform</span>
                  <h3>The AI-Native Hiring Platform</h3>
                  <p className="editorial-desc">
                    Built for modern recruiting teams. Atriveo combines candidate intelligence, engagement
                    tracking, and workflow automation in one seamless platform.
                  </p>
                  <span className="editorial-cta">
                    Visit Atriveo{' '}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </div>
              </a>
            </div>
          </div>
        </section>

        <div id="skills-section" data-analytics-section="skills" translate="no">
          <SkillsSection />
        </div>

        <div id="journey-section" data-analytics-section="features" className="section-wrap" translate="no">
          <StoryTimeline />
        </div>

        <div id="testimonials-section" data-analytics-section="testimonials" className="testimonials-section section-wrap" translate="no">
          <div className="testimonials-inner" translate="no">
            <h2 className="testimonials-title" translate="no">Testimonials</h2>
            <div className="testimonials-grid" translate="no">
              {visibleTestimonials.map((t, idx) => {
                const displayName = String(t.name || '').replace('⭐⭐⭐⭐⭐', '').trim();
                return (
                  <article className="testimonial-card" key={idx} translate="no">
                    <header className="testimonial-card__head" translate="no">
                      <div className="testimonial-card__person" translate="no">
                        <span className="testimonial-card__avatar-ring" aria-hidden="true" translate="no">
                          <img
                            src={t.photo}
                            alt={displayName}
                            className="testimonial-card__avatar"
                            loading="lazy"
                            decoding="async"
                            translate="no"
                          />
                        </span>
                        <div className="testimonial-card__meta" translate="no">
                          <div className="testimonial-card__name" translate="no">{displayName}</div>
                          <div className="testimonial-card__role" translate="no">
                            {t.company} — {t.post}
                          </div>
                        </div>
                      </div>
                      <div className="testimonial-card__rating" aria-label="5 out of 5 stars" translate="no">
                        <span aria-hidden="true">★★★★★</span>
                      </div>
                    </header>
                    <p className="testimonial-card__quote" translate="no">{t.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div id="final-product-section" data-analytics-section="gallery" className="section-wrap" translate="no">
          <FinalProductGrid />
        </div>
      </div>
    </>
  );
}

export default HomePage;
