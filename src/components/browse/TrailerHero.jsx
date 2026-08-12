import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SPOTLIGHT, resolvePlay } from '../../data/projects.js';
import { ArrowIcon, ExternalIcon } from '../ui';
import { mediaSources, canPlayPreview } from './videoSupport';
import './TrailerHero.css';

/** How long each spotlight holds before advancing. */
const ROTATE_MS = 11000;

/**
 * Rotating spotlight at the top of /projects.
 *
 * Every poster is in the DOM at once, stacked and cross-faded with opacity.
 * That is five images rather than one, which buys a genuine dissolve between
 * entries with no JavaScript in the transition and no black frame in the middle
 * — mounting one image per index means the outgoing frame is gone before the
 * incoming one has decoded. The posters are small generated plates, so the
 * whole stack costs less than a single photograph would.
 *
 * The video layer sits above the posters and is a single element whose source
 * follows the active index. It stays hidden until it has painted a frame, so a
 * slow or refused load simply leaves the poster showing.
 *
 * Rotation is pausable, which WCAG 2.2.2 requires of anything that moves on its
 * own for more than five seconds, and it stops on hover, on focus within the
 * hero, and whenever the tab is hidden — an unattended timer advancing in a
 * background tab means returning to the page mid-dissolve.
 */
export default function TrailerHero({ onInfo }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

  const project = SPOTLIGHT[index];
  const play = resolvePlay(project);
  const sources = mediaSources(project?.video?.trailer);

  const goTo = useCallback((next) => {
    setIndex(next);
    setVideoReady(false);
  }, []);

  /* `held` covers hover and focus; `paused` is the explicit control. Kept
     separate so moving the mouse away does not silently undo a user's decision
     to stop the rotation. */
  const stopped = paused || held;

  useEffect(() => {
    if (stopped || SPOTLIGHT.length < 2) return undefined;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SPOTLIGHT.length);
      setVideoReady(false);
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [stopped]);

  /* A hidden tab still runs intervals. Without this the rotation races ahead
     while the page is in the background and lands on an arbitrary entry
     mid-transition when the user comes back. */
  useEffect(() => {
    const onVisibility = () => setHeld(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const [allowVideo, setAllowVideo] = useState(false);
  /* Decided after mount, never during render: canPlayPreview() reads
     matchMedia and navigator.connection, neither of which exists in Node, and
     a value that differs between server and client is a hydration mismatch. */
  useEffect(() => setAllowVideo(canPlayPreview()), []);

  /* Changing <source> children does not change what a <video> is playing —
     the element only re-reads them on an explicit load(). Without this the
     hero would keep showing the first project's trailer forever.

     `allowVideo` is a dependency, not just a guard: it starts false and only
     flips true after the mount effect above, which is what mounts the <video>
     at all. Without it in the deps this runs once against a null ref, finds
     nothing, and never runs again — the element appears but never plays. */
  useEffect(() => {
    if (!allowVideo) return;
    const el = videoRef.current;
    if (!el || !sources.length) return;

    el.load();
    el.play().catch(() => {});
  }, [index, sources.length, allowVideo]);

  if (!project) return null;

  return (
    <section
      className="trailer-hero"
      aria-label="Featured projects"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
    >
      <div className="trailer-hero__media">
        {SPOTLIGHT.map((entry, i) => (
          <img
            key={entry.slug}
            className={`trailer-hero__poster${i === index ? ' is-active' : ''}`}
            src={entry.video?.poster || entry.image?.tile || entry.image?.src}
            alt=""
            width={entry.image?.width || 1600}
            height={entry.image?.height || 900}
            /* Only the first is part of the initial paint; it is the LCP
               element for this route. */
            loading={i === 0 ? 'eager' : 'lazy'}
            {...(i === 0 ? { fetchPriority: 'high' } : {})}
            decoding="async"
            aria-hidden="true"
          />
        ))}

        {allowVideo && sources.length > 0 && (
          <video
            ref={videoRef}
            className={`trailer-hero__video${videoReady ? ' is-ready' : ''}`}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
            onCanPlay={() => setVideoReady(true)}
          >
            {sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        )}

        <div className="trailer-hero__scrim" aria-hidden="true" />
      </div>

      <div className="trailer-hero__inner">
        <div className="trailer-hero__lockup">
          <p className="trailer-hero__eyebrow mono">
            {project.category} · {project.year} · {project.status}
          </p>

          <h2 className="trailer-hero__title">{project.name}</h2>
          <p className="trailer-hero__tagline">{project.tagline}</p>

          {project.metrics?.length > 0 && (
            <dl className="trailer-hero__metrics">
              {project.metrics.slice(0, 4).map((metric) => (
                <div key={metric.label}>
                  <dd className="tabular">{metric.value}</dd>
                  <dt>{metric.label}</dt>
                </div>
              ))}
            </dl>
          )}

          <div className="trailer-hero__actions">
            {play &&
              (play.to ? (
                <Link to={play.to} className="trailer-hero__cta trailer-hero__cta--primary">
                  {project.uuid ? 'Open live demo' : 'Open project'}
                  <ArrowIcon />
                </Link>
              ) : (
                <a
                  href={play.href}
                  className="trailer-hero__cta trailer-hero__cta--primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open project
                  <ExternalIcon />
                </a>
              ))}

            <button
              type="button"
              className="trailer-hero__cta"
              onClick={() => onInfo(project.slug)}
            >
              More info
            </button>
          </div>
        </div>

        {SPOTLIGHT.length > 1 && (
          <div className="trailer-hero__controls">
            <button
              type="button"
              className="trailer-hero__pause"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? 'Resume rotation' : 'Pause rotation'}
            >
              {paused ? <PlayGlyph /> : <PauseGlyph />}
            </button>

            <ul className="trailer-hero__ticks">
              {SPOTLIGHT.map((entry, i) => (
                <li key={entry.slug}>
                  <button
                    type="button"
                    className={`trailer-hero__tick${i === index ? ' is-active' : ''}`}
                    onClick={() => {
                      goTo(i);
                      /* Choosing an entry is a statement of intent — resuming
                         the timer would yank it away a few seconds later. */
                      setPaused(true);
                    }}
                    aria-label={`Show ${entry.name}`}
                    aria-current={i === index ? 'true' : undefined}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

const PauseGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect x="2" y="1.5" width="3" height="9" fill="currentColor" />
    <rect x="7" y="1.5" width="3" height="9" fill="currentColor" />
  </svg>
);

const PlayGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 1.5l7 4.5-7 4.5z" fill="currentColor" />
  </svg>
);
