import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaSources, canPlayPreview, hasFinePointer } from './videoSupport';
import './ProjectCard.css';

/* Dwell before a preview loads. Short enough to feel immediate on a deliberate
   hover, long enough that dragging the cursor across a row does not fire five
   video requests. */
const HOVER_INTENT_MS = 380;

/**
 * One tile in a browse row.
 *
 * ── Why the poster IS the card ──────────────────────────────────────────────
 *
 * The first version stacked a 16:9 image above a block of category, title,
 * tagline, and buttons inside a bordered box. That is a card grid, and it read
 * like one: tiles were twice as tall as the image they were showing, most of
 * that height was text on a flat panel, and a row of them looked like a table
 * of contents rather than a shelf of things you could open.
 *
 * Here the media fills the tile and the text sits on top of it under a
 * gradient. Everything else follows from that — tiles are half the height, so
 * more of the page is content; the image is the largest element, so the eye
 * lands on the work rather than on its label; and hover has somewhere to go,
 * because the actions can rise over the poster instead of occupying permanent
 * space beneath it.
 *
 * ── Clicking a tile opens the overlay, it does not navigate ─────────────────
 *
 * A tile leads with the detail overlay so the visitor decides where to go from
 * there — live demo, case study, source, write-up — instead of being thrown
 * straight to whichever destination this code guessed was primary. Half of
 * those destinations are off-site, and sending someone to another domain on a
 * single click of a poster is a bad trade for them and for the site.
 *
 * It is still a real <a href> to the case study, not a <div onClick>. That is
 * deliberate: crawlers follow it and index the case study, the status bar shows
 * a destination on hover, and cmd/ctrl/middle-click still opens the case study
 * in a new tab because the handler bails on modified clicks. Only the plain
 * left-click is intercepted.
 */
export default function ProjectCard({ project, onInfo, priority = false }) {
  /* `tile` before `src`: src is the og:image title card, which repeats the name
     this tile already renders as text. See the generator in build-images.mjs. */
  const poster = project.video?.poster || project.image?.tile || project.image?.src;

  const handleClick = useCallback(
    (event) => {
      /* Let the browser handle any click that means "open elsewhere" — a
         modified click is an explicit request for a new tab or window, and
         hijacking it into a modal is the kind of thing that makes people stop
         trusting links. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onInfo(project.slug);
    },
    [onInfo, project.slug]
  );

  /* `preview` is the mounted-and-loading state; `ready` is "has painted a
     frame". Two flags rather than one because the crossfade must wait for the
     second — fading in on mount shows a black box for however long the first
     frame takes, which is the exact flicker the poster exists to prevent. */
  const [preview, setPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const sources = mediaSources(project.video?.preview);

  const stopPreview = useCallback(() => {
    clearTimeout(timerRef.current);
    setPreview(false);
    setReady(false);
  }, []);

  const startPreview = useCallback(() => {
    if (!sources.length) return;
    /* Both guards are read here, at interaction time, rather than on mount: a
       tile rendered on page load may be hovered ten minutes later on a
       different network, and matchMedia results change with OS settings. */
    if (!hasFinePointer() || !canPlayPreview()) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPreview(true), HOVER_INTENT_MS);
  }, [sources.length]);

  /* A pending timer outliving the component would call setState on an unmounted
     tile — harmless in React 19 but still a leaked timer per card. */
  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!preview) return;
    const el = videoRef.current;
    if (!el) return;

    /* play() rejects for reasons entirely outside this code — autoplay policy,
       a backgrounded tab, the element being torn down mid-load. Swallowing it
       is correct: the poster is still showing, so a refused play is a no-op. */
    el.play().catch(() => {});
  }, [preview]);

  const caption = (
    <>
      <span className="browse-card__media">
        <img
          src={poster}
          alt={project.image?.alt || ''}
          width={project.image?.width || 1600}
          height={project.image?.height || 900}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' } : {})}
        />

        {/* Mounted only once hover intent fires, which keeps video bytes off
            the initial load and out of the prerendered HTML. The poster stays
            underneath rather than being replaced, so there is something to
            fall back to if the file never loads. */}
        {preview && (
          <video
            ref={videoRef}
            className={`browse-card__video${ready ? ' is-ready' : ''}`}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
            onCanPlay={() => setReady(true)}
          >
            {sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        )}

        <span className="browse-card__scrim" aria-hidden="true" />
      </span>

      {project.status && (
        <span className={`browse-card__status browse-card__status--${project.status.toLowerCase()}`}>
          {project.status}
        </span>
      )}

      <span className="browse-card__caption">
        <span className="browse-card__meta">
          {project.category} · {project.year}
        </span>
        <span className="browse-card__title">{project.name}</span>
        {/* Present in the DOM at all times and revealed on hover, rather than
            mounted on hover. A crawler and a screen reader both get the full
            description; only its visibility is conditional. */}
        <span className="browse-card__tagline">{project.tagline}</span>
      </span>
    </>
  );

  return (
    <li className="browse-card">
      {/* Preview starts on pointer enter and on focus, so a keyboard user
          tabbing through a row gets the same behaviour as a mouse user. Pointer
          events rather than mouse events: they cover pen input, and
          pointerleave fires reliably when the element is removed under the
          cursor. */}
      <article
        className="browse-card__inner"
        onPointerEnter={startPreview}
        onPointerLeave={stopPreview}
        onFocus={startPreview}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) stopPreview();
        }}
      >
        <Link
          to={`/projects/${project.slug}`}
          className="browse-card__link"
          onClick={handleClick}
          aria-label={`${project.name} — details`}
        >
          {caption}
        </Link>

        {/* A visible affordance for what the tile does. Not a second control —
            it is inside the link and inert, so a click anywhere on the tile,
            including here, does the same one thing. */}
        <span className="browse-card__cue" aria-hidden="true">
          <InfoIcon />
        </span>
      </article>
    </li>
  );
}

const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="5.2" r="0.85" fill="currentColor" />
  </svg>
);
