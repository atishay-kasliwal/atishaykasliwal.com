import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolvePlay, projectLinks } from '../../data/projects.js';
import { MetricRow, TagList, ArrowIcon, ExternalIcon } from '../ui';
import { mediaSources, canPlayPreview } from './videoSupport';
import './ProjectModal.css';

/**
 * Detail overlay for a project.
 *
 * Built on the native <dialog> element via showModal(), which supplies focus
 * trapping, Esc-to-close, inertness of the page behind it, and the ::backdrop
 * pseudo-element — four things that a div-based modal has to hand-roll and
 * usually gets subtly wrong. The only thing added on top is body scroll lock,
 * which <dialog> does not do.
 *
 * Never rendered during prerender: the parent gates it behind ClientOnly, and
 * showModal() does not exist in Node.
 */
export default function ProjectModal({ project, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);

  /* Trailer first, preview second. The trailer is the longer cut meant to be
     watched; the preview is the few-second loop the card plays under the
     cursor. This surface was opened deliberately, so it gets the longer one and
     falls back only if a project defines no trailer. */
  const sources = mediaSources(project?.video?.trailer || project?.video?.preview);

  /* Open on mount, and close through the dialog's own API so the browser runs
     its teardown (restoring focus, releasing inertness) before React unmounts
     the node. */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el || el.open) return undefined;

    el.showModal();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
      if (el.open) el.close();
    };
  }, []);

  /* `allowVideo` is the same three-way gate the card and hero use — reduced
     motion, Data Saver, slow connection. Decided after mount, never during
     render: it reads matchMedia and navigator.connection, neither of which
     exists in Node.

     `ready` is separate from `allowVideo` because the crossfade has to wait for
     a painted frame. Fading in on mount shows a black rectangle for however long
     the first frame takes, which is the exact flicker the poster prevents. */
  const [allowVideo, setAllowVideo] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => setAllowVideo(canPlayPreview()), []);

  /* `allowVideo` is a dependency rather than just a guard: it starts false and
     is what mounts the <video> at all, so an effect that skipped it would run
     once against a null ref and never again. */
  useEffect(() => {
    if (!allowVideo || !sources.length) return;
    const el = videoRef.current;
    if (!el) return;

    /* play() rejects for reasons outside this code — autoplay policy, a
       backgrounded tab, teardown mid-load. Swallowing it is correct: the poster
       is still showing underneath, so a refused play is a no-op. */
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [allowVideo, playing, sources.length]);

  if (!project) return null;

  const play = resolvePlay(project);
  const links = projectLinks(project);
  /* Same precedence as the card: the lockup below prints the name and tagline,
     so the title-card cover would render both twice. */
  const poster = project.video?.poster || project.image?.tile || project.image?.src;
  const titleId = `browse-modal-${project.slug}`;

  /* A <dialog> backdrop click reports as a click on the dialog itself, so the
     only way to tell "clicked the backdrop" from "clicked the panel" is to
     check whether the target is the dialog element. */
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      className="browse-modal"
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby={titleId}
    >
      <article className="browse-modal__panel">
        <button
          type="button"
          className="browse-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="browse-modal__media">
          <img
            src={poster}
            alt={project.image?.alt || ''}
            width={project.image?.width || 1600}
            height={project.image?.height || 900}
            decoding="async"
          />

          {/* Layered over the poster rather than replacing it, so a file that
              never loads leaves the still frame showing instead of a hole.
              Muted: this is a screen recording that starts on its own, and
              unrequested sound in an overlay is the single most hostile thing a
              modal can do. */}
          {allowVideo && sources.length > 0 && (
            <video
              ref={videoRef}
              className={`browse-modal__video${ready ? ' is-ready' : ''}`}
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

          {/* WCAG 2.2.2: anything that moves on its own for more than five
              seconds needs a way to stop it. It doubles as the control for
              actually studying a demo, which a loop with no pause makes
              needlessly hard. Only rendered once there is something playing. */}
          {allowVideo && sources.length > 0 && ready && (
            <button
              type="button"
              className="browse-modal__playback"
              onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? 'Pause video' : 'Play video'}
            >
              {playing ? <PauseGlyph /> : <PlayGlyph />}
            </button>
          )}

          <div className="browse-modal__lockup">
            <p className="browse-modal__eyebrow mono">
              {project.category} · {project.year} · {project.status}
            </p>
            <h2 className="browse-modal__title" id={titleId}>
              {project.name}
            </h2>
            <p className="browse-modal__tagline">{project.tagline}</p>
          </div>
        </div>

        <div className="browse-modal__body">
          <div className="browse-modal__actions">
            {play && (
              <PlayAction play={play} className="browse-modal__cta browse-modal__cta--primary">
                {project.uuid ? 'Open live demo' : 'Open project'}
                {play.external ? <ExternalIcon /> : <ArrowIcon />}
              </PlayAction>
            )}

            {links.map((link) =>
              link.to ? (
                <Link key={link.label} to={link.to} className="browse-modal__cta">
                  {link.label}
                  <ArrowIcon />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="browse-modal__cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <ExternalIcon />
                </a>
              )
            )}
          </div>

          {project.problem && (
            <section className="browse-modal__section">
              <h3 className="browse-modal__label spec-label">Problem</h3>
              <p>{project.problem}</p>
            </section>
          )}

          {project.approach && (
            <section className="browse-modal__section">
              <h3 className="browse-modal__label spec-label">Approach</h3>
              <p>{project.approach}</p>
            </section>
          )}

          {project.metrics?.length > 0 && (
            <MetricRow items={project.metrics} className="browse-modal__metrics" />
          )}

          {project.architecture?.length > 0 && (
            <section className="browse-modal__section">
              <h3 className="browse-modal__label spec-label">Architecture</h3>
              <ul className="browse-modal__list">
                {project.architecture.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {project.stack?.length > 0 && (
            <section className="browse-modal__section">
              <h3 className="browse-modal__label spec-label">Stack</h3>
              <TagList items={project.stack} />
            </section>
          )}

          <dl className="browse-modal__facts">
            <div>
              <dt className="mono">Timeline</dt>
              <dd>{project.timeline}</dd>
            </div>
            <div>
              <dt className="mono">Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="mono">Status</dt>
              <dd>{project.status}</dd>
            </div>
          </dl>
        </div>
      </article>
    </dialog>
  );
}

/** Renders the play destination as the right element for where it points. */
function PlayAction({ play, className, children }) {
  if (play.to) {
    return (
      <Link to={play.to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={play.href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
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
