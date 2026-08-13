import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { webPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import SiteHeader from '../SiteHeader';
import StoryTimeline from '../StoryTimeline';
import SkillsSection from '../components/SkillsSection';
import AboutSection from '../components/AboutSection';
import HeroSystemPanel from '../components/HeroSystemPanel';
import useHeroPointer from '../lib/useHeroPointer';
import { getLandingTestimonials } from '../lib/content/publicContent.js';
import '../styles/hero.css';
import '../styles/editorial.css';
import '../styles/testimonials.css';
import '../styles/buttons.css';

/* Every figure below traces to a specific line on the résumé. Anything that
   couldn't be sourced (paper counts, project tallies) is deliberately absent —
   a recruiter who checks should find the numbers hold. */
const HERO_METRICS = [
  { value: '4+', label: 'Years shipping production systems' },
  { value: '100K+', label: 'Customers served at 99% uptime' },
  { value: '10TB+', label: 'Medical imaging through ML' },
  { value: '−40%', label: 'P99 latency · zero Sev1 after' },
  { value: 'MS', label: 'Data Science · Stony Brook ’26' },
];

const CURRENTLY = [
  { head: 'Building Atriveo', sub: 'AI job-search platform' },
  { head: 'MS Data Science', sub: 'Stony Brook · May 2026' },
  { head: 'Open to new roles', sub: 'SWE · AI/ML · Data' },
  { head: 'Based in New York', sub: 'Open to relocation' },
];

function HomePage() {
  const testimonials = getLandingTestimonials();
  /* Seeded with the desktop width rather than window.innerWidth, because this
     component is also rendered in Node by the build-time prerenderer where
     there is no window. Reading it directly threw and cost the homepage its
     entire prerendered body. The real width is picked up on mount below, so
     the only cost is that the prerendered HTML lists all six testimonials —
     which is the better default for a crawler anyway. */
  const [windowWidth, setWindowWidth] = useState(1200);
  const heroRef = useRef(null);

  useHeroPointer(heroRef);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleTestimonials = windowWidth <= 768 ? testimonials.slice(0, 3) : testimonials;

  return (
    <>
      {/* Head tags and JSON-LD come from the SEO layer, which the build-time
          prerenderer also uses — so the served HTML carries them before any JS
          runs. react-helmet only ever wrote them client-side, which OG and
          Twitter crawlers never see. */}
      <Seo path="/" schema={[webPageSchema(resolveMeta('/'), 'ProfilePage')]} />

      <div className="page-content page-content--landing" translate="no">
        <SiteHeader />

        <header className="spec-hero" ref={heroRef} data-analytics-section="hero" translate="no">
          <div className="spec-hero-grid" aria-hidden="true" />
          <div className="spec-hero-glow" aria-hidden="true" />

          <div className="spec-hero-inner" translate="no">
            <div className="spec-hero-meta" translate="no">
              <span className="spec-label">
                <span className="spec-meta-prefix">Portfolio Document · </span>AK-2026 / Rev. A
              </span>
              <span className="spec-label spec-hero-loc">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                New York, NY
              </span>
            </div>

            <div className="spec-hero-cols" translate="no">
              {/* ── Left: who / what / proof / action ── */}
              <div className="spec-hero-lead" translate="no">
                <p className="spec-status" translate="no">
                  <span className="spec-status-mark" aria-hidden="true" />
                  Open to software, AI/ML and data roles · 2026
                </p>

                <h1 className="spec-display" translate="no">
                  <span className="spec-display-line">Atishay</span>
                  <span className="spec-display-line spec-display-line--accent">Kasliwal</span>
                </h1>

                <p className="spec-headline" translate="no">
                  Building production AI systems that scale.
                  <span className="spec-caret" aria-hidden="true" />
                </p>

                <p className="spec-lede" translate="no">
                  Event-driven backends in fintech, ML pipelines on 10TB of hospital imaging,
                  research at Stony Brook, and a developer tool I run on my own.
                </p>

                <div className="spec-cta-row" translate="no">
                  <Link
                    to="/projects"
                    className="spec-btn spec-btn--primary"
                    data-cta-position="hero_view_projects"
                  >
                    View Projects
                    <svg width="13" height="13" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link to="/resume" className="spec-btn spec-btn--secondary" data-cta-position="hero_resume">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    Résumé
                  </Link>
                  <a
                    href="mailto:hire@atishaykasliwal.com"
                    className="spec-btn spec-btn--tertiary"
                    data-cta-position="hero_contact"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m2 7 10 6 10-6" />
                    </svg>
                    Contact
                  </a>
                </div>

                {/* ── Measured values: every figure traces to the résumé ── */}
                <dl className="spec-metrics" translate="no">
                  {HERO_METRICS.map((m) => (
                    <div className="spec-metric" key={m.value + m.label} translate="no">
                      <dt className="spec-metric-value" translate="no">{m.value}</dt>
                      <dd className="spec-metric-label spec-label" translate="no">{m.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* ── Right: the featured project ── */}
              <HeroSystemPanel />
            </div>

            {/* ── Currently rail ── */}
            <div className="spec-currently" translate="no">
              <span className="spec-label spec-currently-key">Currently</span>
              <ul className="spec-currently-list" translate="no">
                {CURRENTLY.map((item) => (
                  <li className="spec-currently-item" key={item.head} translate="no">
                    <span className="spec-currently-head">{item.head}</span>
                    <span className="spec-currently-sub">{item.sub}</span>
                  </li>
                ))}
              </ul>
              <p className="spec-note" translate="no">
                Most of what I build is invisible when it works. That is the part I like.
              </p>
            </div>
          </div>

          <a href="#about-section" className="spec-scroll" translate="no">
            <span className="spec-scroll-text">Scroll to explore</span>
            <span className="spec-scroll-rule" aria-hidden="true">
              <span className="spec-scroll-tick" />
            </span>
          </a>
        </header>

        <div id="testimonials-section" data-analytics-section="testimonials" className="testimonials-section section-wrap" translate="no">
          <div className="testimonials-inner" translate="no">
            <h2 className="testimonials-title" translate="no">Testimonials</h2>
            <div className="testimonials-grid" translate="no">
              {visibleTestimonials.map((t, idx) => {
                const displayName = String(t.name || '').trim();
                return (
                  <article className="testimonial-card" key={idx} translate="no">
                    <span className="spec-brackets" aria-hidden="true" />
                    <header className="testimonial-card__head" translate="no">
                      <div className="testimonial-card__person" translate="no">
                        <span className="testimonial-card__avatar-ring" aria-hidden="true" translate="no">
                          <img
                            src={t.avatar}
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
                            {t.org} · {t.role}
                          </div>
                        </div>
                      </div>
                      <div className="testimonial-card__rating" role="img" aria-label="Rated 5 out of 5" translate="no">
                        <span aria-hidden="true">★★★★★</span>
                      </div>
                    </header>
                    <p className="testimonial-card__quote" translate="no">{t.quote}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <AboutSection />

        <div id="skills-section" data-analytics-section="skills" className="section-wrap" translate="no">
          <SkillsSection />
        </div>

        <div id="journey-section" data-analytics-section="features" className="section-wrap" translate="no">
          <StoryTimeline />
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
                data-feature-name="FOMC Intelligence Dashboard"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
                data-feature-name="Legal RAG System"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
                data-feature-name="PolicyFabric"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
                data-feature-name="Atriveo Chrome Extension"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
                data-feature-name="MRI Brain Tumor Viewer"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
                style={{ backgroundImage: 'url(/Atriveo6th.jpg)' }}
                data-feature-name="Atriveo Platform"
                translate="no"
              >
                <span className="spec-brackets" aria-hidden="true" />
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
      </div>
    </>
  );
}

export default HomePage;
