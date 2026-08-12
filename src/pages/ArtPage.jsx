import React, { useState, useEffect, useCallback, useRef } from 'react';
import SiteHeader from '../SiteHeader';
import { getPhotos } from '../lib/content/publicContent.js';
import './ArtPage.css';

const plate = (i) => String(i + 1).padStart(2, '0');
const photos = getPhotos();

/* ── Lightbox ──────────────────────────────────────────────────────────────
   Mounts only while open. Arrows and Escape work, the close button takes
   focus on open, and body scroll is locked underneath. */
function Lightbox({ index, onClose, onStep }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onStep]);

  return (
    <div
      className="art-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Plate ${plate(index)} of ${photos.length}`}
      onClick={onClose}
      translate="no"
    >
      <div className="art-lb-bar" translate="no">
        <span className="spec-label">
          Plate {plate(index)} / {photos.length}
        </span>
        <button
          type="button"
          ref={closeRef}
          className="art-lb-close"
          onClick={onClose}
          aria-label="Close"
        >
          Close ✕
        </button>
      </div>

      <button
        type="button"
        className="art-lb-nav art-lb-nav--prev"
        onClick={(e) => { e.stopPropagation(); onStep(-1); }}
        aria-label="Previous plate"
      >
        ‹
      </button>

      <img
        className="art-lb-img"
        src={photos[index]?.src}
        alt={`Plate ${plate(index)}`}
        onClick={(e) => e.stopPropagation()}
        translate="no"
      />

      <button
        type="button"
        className="art-lb-nav art-lb-nav--next"
        onClick={(e) => { e.stopPropagation(); onStep(1); }}
        aria-label="Next plate"
      >
        ›
      </button>
    </div>
  );
}

function ArtPage() {
  const [open, setOpen] = useState(null);

  const step = useCallback((d) => {
    setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="art-page" translate="no">
      <div className="art-grid-bg" aria-hidden="true" />

      <div className="page-content page-content--art" translate="no">
        <SiteHeader />

        <header className="art-intro" translate="no">
          <p className="spec-label art-doc" translate="no">
            <span className="art-doc-mark" aria-hidden="true" />
            /contact_sheet.doc
          </p>

          <h1 className="art-title" translate="no">
            Frames I kept <em>looking at</em>
          </h1>

          <p className="art-lede" translate="no">
            The other half of what I do. No brief, no client, no deadline. Just the things that
            made me stop walking.
          </p>

          <dl className="art-meta" translate="no">
            <div className="art-meta-cell" translate="no">
              <dt className="spec-label">Plates</dt>
              <dd className="art-meta-value">{photos.length}</dd>
            </div>
            <div className="art-meta-cell" translate="no">
              <dt className="spec-label">Shot in</dt>
              <dd className="art-meta-value">New York · Chicago</dd>
            </div>
            <div className="art-meta-cell" translate="no">
              <dt className="spec-label">Sequence</dt>
              <dd className="art-meta-value">Unordered</dd>
            </div>
          </dl>
        </header>

        {/* Masonry rather than forced squares — every frame keeps the crop it
            was shot with instead of being centre-cropped to a thumbnail. */}
        <div className="art-wall" translate="no">
          {photos.map((photo, idx) => (
            <button
              type="button"
              className="art-plate"
              key={photo.id}
              onClick={() => setOpen(idx)}
              aria-label={`Open plate ${plate(idx)}`}
              translate="no"
            >
              {/* Real intrinsic size, measured at build time by
                  scripts/build-gallery-dims.mjs. Without it the masonry
                  reserves no space and the whole column reflows as each image
                  arrives. */}
              <img
                src={photo.src}
                alt=""
                width={photo.width}
                height={photo.height}
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                loading="lazy"
                decoding="async"
                translate="no"
              />
              <span className="art-plate-num" aria-hidden="true">{plate(idx)}</span>
            </button>
          ))}
        </div>
      </div>

      {open !== null && <Lightbox index={open} onClose={close} onStep={step} />}
    </div>
  );
}

export default ArtPage;
