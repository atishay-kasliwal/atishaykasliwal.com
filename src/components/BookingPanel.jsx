import React, { useEffect, useState } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';
import '../styles/booking.css';

const CAL_USERNAME = 'atishay-kasliwal-eeug6h';

const DURATIONS = [
  { label: '15 min', slug: '15min' },
  { label: '30 min', slug: '30min' },
];

export default function BookingPanel() {
  const [duration, setDuration] = useState('30min');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal('ui', {
        theme: 'dark',
        hideEventTypeDetails: true,
        layout: 'month_view',
      });
      cal('on', {
        action: 'linkReady',
        callback: () => setLoaded(true),
      });
    })();
  }, []);

  // Clicking inside the Cal.com iframe shifts browser focus to it, and the browser's
  // native "scroll focused element into view" behavior then smooth-scrolls the whole
  // page. Watch for scroll deltas that originate while the iframe holds focus and
  // snap the page back so the calendar interaction can't drag the page with it.
  useEffect(() => {
    const root = document.querySelector('.bp-root');
    if (!root) return;

    let pinnedY = null;
    let rafId = null;

    const isCalFocused = () =>
      document.activeElement?.tagName === 'IFRAME' && root.contains(document.activeElement);

    const settle = () => {
      rafId = null;
      if (pinnedY == null) return;
      if (isCalFocused()) {
        if (window.scrollY !== pinnedY) window.scrollTo(window.scrollX, pinnedY);
        rafId = requestAnimationFrame(settle);
      } else {
        pinnedY = null;
      }
    };

    const onScroll = () => {
      if (!isCalFocused()) { pinnedY = null; return; }
      if (pinnedY == null) pinnedY = window.scrollY;
      if (rafId == null) rafId = requestAnimationFrame(settle);
    };

    const onFocusIn = (e) => {
      if (e.target.tagName === 'IFRAME' && root.contains(e.target)) {
        pinnedY = window.scrollY;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('focusin', onFocusIn);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bp-root">
      <div className="bp-glow" aria-hidden="true" />

      {/* ── Profile + booking header ── */}
      <div className="bp-profile-row">
        <div className="bp-avatar-wrap">
          <img src="/atishaylogo.png" alt="Atishay Kasliwal" className="bp-avatar" />
          <span className="bp-avatar-badge" title="Available">
            <span className="bp-avatar-dot" />
          </span>
        </div>

        <div className="bp-profile-info">
          <div className="bp-profile-name">Atishay Kasliwal</div>
          <div className="bp-profile-role">Software Engineer · ML</div>
          <div className="bp-profile-tags">
            <span className="bp-tag">⚡ AI & ML</span>
            <span className="bp-tag">🚀 Startups</span>
            <span className="bp-tag">🔬 Research</span>
            <span className="bp-tag">💬 Career</span>
          </div>
        </div>

        <div className="bp-header-controls">
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Google Meet
          </div>
        </div>
      </div>

      <div className="bp-divider" />

      {/* ── Cal.com calendar (official embed widget, header hidden natively) ── */}
      <div className="bp-cal-wrap">
        {!loaded && (
          <div className="bp-cal-loading">
            <div className="bp-cal-spinner" />
            <span>Loading calendar…</span>
          </div>
        )}
        <div className="bp-cal-clip" style={{ opacity: loaded ? 1 : 0 }}>
          <Cal
            key={duration}
            calLink={`${CAL_USERNAME}/${duration}`}
            className="bp-cal-iframe"
            config={{ theme: 'dark', layout: 'month_view', hideEventTypeDetails: 'true' }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bp-footer">
        <span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Response &lt; 24h
        </span>
        <span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          New York EST
        </span>
        <span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
