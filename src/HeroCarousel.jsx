import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';
import { trackEvent } from './lib/analytics';

const PROJECTS = [
  {
    id: 'fomc',
    title: 'Decoding the Fed',
    subtitle: 'FOMC Intelligence Dashboard',
    description: 'NLP pipeline surfacing rate signals and sentiment shifts from Federal Reserve transcripts.',
    tags: ['Python', 'NLP', 'React'],
    image: '/fmocc.jpeg',
    to: '/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01',
    accent: '79,142,247',
  },
  {
    id: 'atriveo-job',
    title: 'Smarter Hiring Starts Here',
    subtitle: 'Job Intelligence Platform',
    description: 'AI-native recruiting intelligence that ranks candidates and accelerates hiring decisions.',
    tags: ['React', 'Node.js', 'AI'],
    image: '/chrome.png',
    href: 'https://chromewebstore.google.com/detail/atriveo-job-assistant/ocbmncmmepfjgpnakenoibaambecidcf?authuser=0&hl=en',
    accent: '6,182,212',
  },
  {
    id: 'policyfabric',
    title: 'Policy Enforcement at Every Layer',
    subtitle: 'PolicyFabric',
    description: 'Interactive data contract enforcement system with real-time architecture visualization.',
    tags: ['React', 'SVG', 'Systems'],
    image: '/5th%20image.jpeg',
    to: '/highlights/f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    accent: '139,92,246',
  },
  {
    id: 'rag',
    title: 'Ask Your Documents Anything',
    subtitle: 'Legal RAG System',
    description: 'Retrieval-augmented generation for querying legal filings in natural language.',
    tags: ['Python', 'LangChain', 'OpenAI'],
    image: '/4th.jpeg',
    to: '/highlights/c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    accent: '34,197,94',
  },
  {
    id: 'mri',
    title: 'Tumor Detection, Scan to Insight',
    subtitle: 'MRI Brain Viewer',
    description: 'CNN-powered MRI viewer with real-time tumor segmentation running in the browser.',
    tags: ['React', 'TensorFlow', 'Python'],
    image: '/mriimage.jpeg',
    to: '/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012',
    accent: '249,115,22',
  },
];

const N = PROJECTS.length;
const START = 0; // start on FOMC Intelligence Dashboard

function wrap(idx) {
  return ((idx % N) + N) % N;
}

function getOffset(idx, active) {
  let o = idx - active;
  if (o > N / 2) o -= N;
  if (o < -N / 2) o += N;
  return o;
}

// Match the Netflix fan — overlapping cards rotating away from center
function cardTransform(offset) {
  const abs = Math.abs(offset);
  const dir = offset > 0 ? 1 : -1;

  if (abs === 0) return 'translateX(0px) scale(1) rotateY(0deg)';
  if (abs === 1) return `translateX(${dir * 290}px) scale(0.84) rotateY(${-dir * 32}deg)`;
  if (abs === 2) return `translateX(${dir * 510}px) scale(0.68) rotateY(${-dir * 44}deg)`;
  return         `translateX(${dir * 660}px) scale(0.54) rotateY(${-dir * 54}deg)`;
}

function cardOpacity(abs) {
  if (abs === 0) return 1;
  if (abs === 1) return 0.82;
  if (abs === 2) return 0.55;
  return 0.28;
}

function cardFilter(abs) {
  if (abs === 0) return 'none';
  if (abs === 1) return 'blur(0.5px)';
  if (abs === 2) return 'blur(2px)';
  return 'blur(5px)';
}

export default function HeroCarousel() {
  const [active, setActive] = useState(START);
  const drag = useRef({ startX: 0, down: false, t: 0 });

  const goTo = useCallback((idx) => {
    const target = wrap(idx);
    setActive(target);
    trackEvent('carousel_navigate', {
      project_name: PROJECTS[target].title,
      project_id: PROJECTS[target].id,
      page_path: window.location.pathname,
    });
  }, []);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // Keyboard nav
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [prev, next]);

  // Drag (mouse + touch)
  const onDown = (clientX) => {
    drag.current = { startX: clientX, down: true, t: Date.now() };
  };
  const onUp = (clientX) => {
    if (!drag.current.down) return;
    drag.current.down = false;
    const dx = clientX - drag.current.startX;
    const dt = Date.now() - drag.current.t;
    if (Math.abs(dx) > 50 || (Math.abs(dx) > 20 && dt < 300)) {
      dx < 0 ? next() : prev();
    }
  };

  const ap = PROJECTS[active];

  return (
    <section className="hc-section" aria-label="Project showcase" data-analytics-section="carousel">
      {/* Ambient glow */}
      <div
        className="hc-ambient"
        style={{ background: `radial-gradient(ellipse 55% 45% at 50% 65%, rgba(${ap.accent},0.22), transparent 70%)` }}
      />


      {/* Carousel viewport */}
      <div
        className="hc-viewport"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseUp={(e) => onUp(e.clientX)}
        onMouseLeave={(e) => { if (drag.current.down) onUp(e.clientX); }}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchEnd={(e) => onUp(e.changedTouches[0].clientX)}
        role="region"
        aria-label="Projects carousel"
      >
        {PROJECTS.map((p, idx) => {
          const offset = getOffset(idx, active);
          const abs = Math.abs(offset);
          if (abs > 2) return null;
          const isActive = offset === 0;

          return (
            <div
              key={p.id}
              className={`hc-card${isActive ? ' hc-card--active' : ''}`}
              style={{
                transform: cardTransform(offset),
                opacity: cardOpacity(abs),
                filter: cardFilter(abs),
                zIndex: 20 - abs * 5,
                cursor: isActive ? 'default' : 'pointer',
              }}
              onClick={() => !isActive && goTo(idx)}
            >
              {/* Background image */}
              <div className="hc-card-bg" style={{ backgroundImage: `url(${p.image})` }} />

              {/* Gradient overlay — stronger at bottom */}
              <div className="hc-card-gradient" />

              {/* Tags — top */}
              <div className="hc-card-tags">
                {p.tags.map(t => <span key={t} className="hc-tag">{t}</span>)}
              </div>

              {/* Content — bottom, only fully visible on active */}
              <div className={`hc-card-content${isActive ? ' hc-card-content--active' : ''}`}>
                <span className="hc-card-sub">{p.subtitle}</span>
                <h2 className="hc-card-title">{p.title}</h2>
                {isActive && (
                  <>
                    <p className="hc-card-desc">{p.description}</p>
                    <div className="hc-card-actions">
                      {p.to ? (
                        <Link to={p.to} className="hc-btn hc-btn--primary">
                          View Project
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>
                        </Link>
                      ) : (
                        <a href={p.href} target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn--primary">
                          View Project
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>
                        </a>
                      )}
                      <span className="hc-btn-divider" />
                      <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn--ghost">
                        View Code
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Active border glow */}
              {isActive && (
                <div className="hc-card-ring" style={{ boxShadow: `0 0 0 1px rgba(${ap.accent},0.5), 0 0 60px rgba(${ap.accent},0.18)` }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button className="hc-arrow hc-arrow--prev" onClick={prev} aria-label="Previous project">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button className="hc-arrow hc-arrow--next" onClick={next} aria-label="Next project">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Dots */}
      <div className="hc-dots" role="tablist" aria-label="Project navigation">
        {PROJECTS.map((_, idx) => (
          <button
            key={idx}
            className={`hc-dot${idx === active ? ' hc-dot--active' : ''}`}
            onClick={() => goTo(idx)}
            aria-label={`Project ${idx + 1}`}
            aria-selected={idx === active}
            role="tab"
          />
        ))}
      </div>
    </section>
  );
}
