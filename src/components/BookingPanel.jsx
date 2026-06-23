import React, { useState } from 'react';
import '../styles/booking.css';

const CAL_USERNAME = 'atishay-kasliwal-eeug6h';

const DURATIONS = [
  { label: '15 min', slug: '15min' },
  { label: '30 min', slug: '30min' },
];

const TOPICS = [
  { icon: '⚡', label: 'AI & ML' },
  { icon: '🚀', label: 'Startups' },
  { icon: '🔬', label: 'Research' },
  { icon: '💬', label: 'Career' },
];

export default function BookingPanel() {
  const [duration, setDuration] = useState('30min');
  const [loaded, setLoaded] = useState(false);

  const calSrc = `https://cal.com/${CAL_USERNAME}/${duration}?embed=true&theme=dark&layout=month_view&hideEventTypeDetails=true`;

  return (
    <div className="bp-root">
      <div className="bp-glow" aria-hidden="true" />

      {/* Header */}
      <div className="bp-header">
        <div className="bp-header-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="bp-header-text">
          <div className="bp-header-title">Book a Call</div>
          <div className="bp-header-sub">Google Meet · instant confirmation</div>
        </div>
        <div className="bp-header-right">
          <div className="bp-dur-toggle">
            {DURATIONS.map(d => (
              <button
                key={d.slug}
                className={`bp-dur-btn${duration === d.slug ? ' is-active' : ''}`}
                onClick={() => { setDuration(d.slug); setLoaded(false); }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="bp-meet-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Meet
          </div>
        </div>
      </div>

      {/* Topic chips */}
      <div className="bp-topics">
        {TOPICS.map(t => (
          <div key={t.label} className="bp-topic-chip">
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Cal.com embed — direct to event type, skips profile page */}
      <div className="bp-cal-wrap">
        {!loaded && (
          <div className="bp-cal-loading">
            <div className="bp-cal-spinner" />
            <span>Loading calendar…</span>
          </div>
        )}
        <iframe
          key={duration}
          src={calSrc}
          className="bp-cal-iframe"
          style={{ opacity: loaded ? 1 : 0 }}
          frameBorder="0"
          title="Book a call with Atishay Kasliwal"
          onLoad={() => setLoaded(true)}
        />
      </div>

      {/* Footer */}
      <div className="bp-footer">
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Response &lt; 24h
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          New York EST
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Weekdays
        </span>
        <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className="bp-footer-cal">
          Powered by Cal.com
        </a>
      </div>
    </div>
  );
}
