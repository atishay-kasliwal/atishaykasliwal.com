import React from 'react';
import { Link } from 'react-router-dom';
import { AVAILABILITY, FULL_NAME, IMAGES, JOB_TITLE, LOCATION, ORGANIZATION } from '../data/site.js';
import { YEARS_EXPERIENCE } from '../data/experience.js';
import './ProfilePlate.css';

const METRICS = [
  { value: YEARS_EXPERIENCE, label: 'Years shipping systems' },
  { value: '100K+', label: 'Users served' },
  { value: '200K+', label: 'Data points processed' },
];

export default function ProfilePlate() {
  const [firstName, ...rest] = FULL_NAME.split(' ');
  const lastName = rest.join(' ');

  return (
    <section className="pp-card" aria-label="Profile summary">
      <span className="spec-brackets" aria-hidden="true" />

      <div className="pp-main">
        <div className="pp-copy">
          <p className="spec-label pp-doc">
            <span className="pp-doc-mark" aria-hidden="true" />
            /profile.doc
          </p>
          <p className="spec-label pp-role">{JOB_TITLE} · {LOCATION.display}</p>

          <h2 className="pp-name">
            <span>{firstName}</span>
            <span>{lastName}</span>
          </h2>

          <p className="pp-summary">
            I build production AI systems where model quality, latency, and reliability all
            matter at the same time.
          </p>

          <p className="pp-current">
            Currently building <strong>{ORGANIZATION.name}</strong> and finishing an MS in
            Data Science at <strong>Stony Brook University</strong>.
          </p>

          <div className="pp-actions">
            <Link to="/projects" className="pp-btn pp-btn--primary">
              View projects
            </Link>
            <Link to="/contact" className="pp-btn pp-btn--secondary">
              Get in touch
            </Link>
          </div>
        </div>

        <figure className="pp-photo">
          <img
            src={IMAGES.headshotLarge.src}
            alt={IMAGES.headshotLarge.alt}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>

      <div className="pp-footer">
        <dl className="pp-metrics">
          {METRICS.map((metric) => (
            <div key={metric.label} className="pp-metric">
              <dt className="pp-metric-value">{metric.value}</dt>
              <dd className="pp-metric-label">{metric.label}</dd>
            </div>
          ))}
        </dl>

        <div className="pp-status">
          <p className="pp-status-top">
            <span className={`pp-status-dot${AVAILABILITY.open ? ' is-open' : ''}`} aria-hidden="true" />
            {AVAILABILITY.open ? 'Open to roles' : 'Not currently looking'}
          </p>
          <p className="pp-status-sub">
            {AVAILABILITY.open
              ? 'Available immediately · Open to relocation'
              : LOCATION.display}
          </p>
        </div>
      </div>
    </section>
  );
}
