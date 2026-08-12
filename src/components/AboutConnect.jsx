import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ABOUT_FAQS } from '../data/faqs.js';
import { AVAILABILITY, IMAGES, LOCATION, ORGANIZATION } from '../data/site.js';
import { YEARS_EXPERIENCE } from '../data/experience.js';
import './AboutConnect.css';

const METRICS = [
  { value: YEARS_EXPERIENCE, label: 'Years building systems' },
  { value: '100K+', label: 'Users served' },
  { value: '200K+', label: 'Data points processed' },
];

const MOBILE_FAQS = ABOUT_FAQS.slice(0, 3);
const ABOUT_PORTRAIT_SRC = '/atishay-kasliwal-portrait-original-cutout.png';

const formatPlate = (index) => String(index + 1).padStart(2, '0');

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function MobileDoc({ label, title, children, className = '' }) {
  return (
    <article className={`ac-doc ${className}`.trim()}>
      <span className="spec-brackets" aria-hidden="true" />
      <p className="spec-label ac-doc-label">{label}</p>
      {title ? <h3 className="ac-doc-title">{title}</h3> : null}
      {children}
    </article>
  );
}

export default function AboutConnect() {
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const [mobileFaqIndex, setMobileFaqIndex] = useState(-1);
  const activeFaq = ABOUT_FAQS[activeFaqIndex];

  return (
    <section className="ac-shell" aria-label="Profile and FAQ">
      <header className="ac-shell-head">
        <p className="spec-label ac-shell-doc">
          <span className="ac-shell-doc-mark" aria-hidden="true" />
          / about-me.doc
        </p>
        <h2 className="ac-shell-title">Little bit about me</h2>
      </header>

      <div className="ac-desktop">
        <div className="ac-strip">
          <div className="ac-strip-glow" aria-hidden="true" />
          <div className="ac-strip-grid" aria-hidden="true" />

          <section className="ac-faq-panel" aria-labelledby="ac-faq-title">
            <header className="ac-faq-head">
              <p className="spec-label ac-kicker">
                <span className="ac-kicker-dot" aria-hidden="true" />
                / FAQ
              </p>
              <h2 id="ac-faq-title" className="ac-faq-title">
                Common Questions
              </h2>
              <p className="ac-faq-preview">{activeFaq.answer}</p>
            </header>

            <ol className="ac-faq-list">
              {ABOUT_FAQS.map((item, index) => {
                const isActive = index === activeFaqIndex;
                return (
                  <li key={item.question} className={`ac-faq-item${isActive ? ' is-active' : ''}`}>
                    <button
                      type="button"
                      className="ac-faq-button"
                      aria-pressed={isActive}
                      onClick={() => setActiveFaqIndex(index)}
                    >
                      <span className="ac-faq-index">{formatPlate(index)}</span>
                      <span className="ac-faq-question">{item.question}</span>
                      <span className="ac-faq-mark" aria-hidden="true">
                        {isActive ? '−' : '+'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="ac-profile-panel" aria-labelledby="ac-profile-title">
            <div className="ac-profile-top">
              <div className="ac-copy">
                <p className="spec-label ac-profile-meta">
                  AI Engineer <span aria-hidden="true">•</span> {LOCATION.display}
                </p>

                <h2 id="ac-profile-title" className="ac-name">
                  <span>Atishay</span>
                  <span className="ac-name-accent">Kasliwal</span>
                </h2>

                <p className="ac-lede">
                  I build production AI systems where model quality, latency, and reliability all
                  matter at the same time.
                </p>

                <p className="ac-focus">
                  <span className="ac-focus-rule" aria-hidden="true" />
                  <span>
                    Currently building <strong>{ORGANIZATION.name}</strong> and finishing an MS in
                    Data Science at <strong>Stony Brook University</strong>.
                  </span>
                </p>
              </div>

              <div className="ac-visual">
                <figure className="ac-portrait" aria-label="Portrait">
                  <span className="ac-portrait-corners" aria-hidden="true" />
                  <span className="ac-portrait-glow" aria-hidden="true" />
                  <img
                    src={ABOUT_PORTRAIT_SRC}
                    alt={IMAGES.headshotLarge.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>

                <dl className="ac-stats">
                  {METRICS.map((metric) => (
                    <div key={metric.label} className="ac-stat">
                      <dt className="ac-stat-value">{metric.value}</dt>
                      <dd className="ac-stat-label">{metric.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="ac-footer">
              <div className="ac-actions">
                <Link to="/projects" className="ac-button ac-button--primary">
                  View projects
                  <ArrowIcon />
                </Link>
                <Link to="/contact" className="ac-button ac-button--ghost">
                  Get in touch
                  <ArrowIcon />
                </Link>
              </div>

              <div className="ac-availability">
                <span className="ac-status-pill">
                  <span className="ac-status-dot" aria-hidden="true" />
                  {AVAILABILITY.open ? 'Open to roles' : 'Heads-down'}
                </span>
                <span className="ac-availability-copy">
                  Available immediately <span aria-hidden="true">•</span> Open to relocation
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="ac-mobile">
        <MobileDoc label="/ PROFILE" className="ac-doc--profile">
          <div className="ac-mobile-profile">
            <div className="ac-mobile-profile-copy">
              <p className="spec-label ac-mobile-meta">
                AI Engineer <span aria-hidden="true">•</span> NYC
              </p>
              <h3 className="ac-mobile-name">Atishay Kasliwal</h3>
              <p className="ac-mobile-summary">
                Production AI systems, distributed backends, and the infrastructure that makes them
                hold up in the real world.
              </p>
            </div>

            <div className="ac-mobile-portrait" aria-hidden="true">
              <img src={ABOUT_PORTRAIT_SRC} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </MobileDoc>

        <MobileDoc label="/ CURRENT_FOCUS" title="Building right now" className="ac-doc--focus">
          <p className="ac-mobile-copy">
            <strong>{ORGANIZATION.name}</strong>, a job-search platform I run myself, plus financial
            NLP research while finishing my MS at <strong>Stony Brook University</strong>.
          </p>
        </MobileDoc>

        <MobileDoc label="/ EXPERIENCE" title="Production scale" className="ac-doc--metrics">
          <dl className="ac-mobile-metrics">
            {METRICS.map((metric) => (
              <div key={metric.label} className="ac-mobile-metric">
                <dt>{metric.value}</dt>
                <dd>{metric.label}</dd>
              </div>
            ))}
          </dl>
        </MobileDoc>

        <MobileDoc label="/ FAQ" title="Quick answers" className="ac-doc--faq">
          <ul className="ac-mobile-faq-list">
            {MOBILE_FAQS.map((item, index) => {
              const isActive = index === mobileFaqIndex;
              return (
                <li key={item.question} className={`ac-mobile-faq-item${isActive ? ' is-active' : ''}`}>
                  <button
                    type="button"
                    className="ac-mobile-faq-button"
                    aria-expanded={isActive}
                    onClick={() => setMobileFaqIndex((current) => (current === index ? -1 : index))}
                  >
                    <span className="ac-mobile-faq-question">{item.question}</span>
                    <span className="ac-mobile-faq-mark" aria-hidden="true">
                      {isActive ? '−' : '+'}
                    </span>
                  </button>

                  {isActive ? <p className="ac-mobile-faq-answer">{item.answer}</p> : null}
                </li>
              );
            })}
          </ul>
        </MobileDoc>

        <MobileDoc label="/ CONTACT" title="Open to roles" className="ac-doc--contact">
          <p className="ac-mobile-copy">
            {LOCATION.display} <span aria-hidden="true">•</span> Available immediately{' '}
            <span aria-hidden="true">•</span> Open to relocation
          </p>

          <div className="ac-mobile-actions">
            <Link to="/projects" className="ac-button ac-button--primary">
              View projects
              <ArrowIcon />
            </Link>
            <Link to="/contact" className="ac-button ac-button--ghost">
              Get in touch
              <ArrowIcon />
            </Link>
          </div>
        </MobileDoc>
      </div>
    </section>
  );
}
