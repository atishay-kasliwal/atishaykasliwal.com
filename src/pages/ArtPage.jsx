import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import SiteHeader from '../SiteHeader';
import './ArtPage.css';

const images = [
  'https://i.pinimg.com/736x/bd/87/b4/bd87b4569684fe1a7819c96a9ab0e843.jpg',
  'https://i.pinimg.com/736x/a9/0c/64/a90c643c914751ab8143afd6fc845f07.jpg',
  'https://i.pinimg.com/736x/61/a8/52/61a852ecc3adb00d35c71476fd6977a6.jpg',
  'https://i.pinimg.com/736x/5b/e2/1b/5be21bebd4edafca1843cc30b77b9314.jpg',
  'https://i.pinimg.com/736x/34/08/30/3408302ead9068d3f32d0ca667b4a762.jpg',
  'https://i.pinimg.com/736x/bc/1f/05/bc1f05cda34faa0100ae7a0e8508d6b8.jpg',
  'https://i.pinimg.com/736x/b1/62/ce/b162ce51da3005c3e6f70dfe5fd3a88a.jpg',
  'https://i.pinimg.com/736x/c7/de/6a/c7de6a1b54676e8a9070fbaa9601fc9e.jpg',
  'https://i.pinimg.com/736x/c7/7e/a5/c77ea537089d45b70afe9be7216ba432.jpg',
  'https://i.pinimg.com/736x/83/5d/a0/835da0d88511880ba1b7a114adcc07f1.jpg',
  'https://i.pinimg.com/736x/38/ac/84/38ac84f183371337ffe68dd083c950ae.jpg',
  'https://i.pinimg.com/736x/82/ec/b7/82ecb7744895473c92c42241c9afe5f8.jpg',
  'https://i.pinimg.com/736x/97/32/e6/9732e6d233ae6561e97f87fd7ed47271.jpg',
  'https://i.pinimg.com/736x/47/c2/f1/47c2f1c528654d76214860f6d2afc2ac.jpg',
  'https://i.pinimg.com/736x/c1/ca/c4/c1cac4cddb0523efc6e88efa30142688.jpg',
  'https://i.pinimg.com/736x/47/80/ba/4780bafefa14c368f7b14bcc29d1f95c.jpg',
  'https://i.pinimg.com/736x/37/c0/48/37c048374a1a821113a64e026c47bf83.jpg',
  'https://i.pinimg.com/736x/ff/cf/ee/ffcfee499f19a898b02c2edfa0d50e29.jpg',
  'https://i.pinimg.com/736x/7f/85/02/7f8502daa513beb6f00c278823d5d309.jpg',
  'https://i.pinimg.com/736x/1a/66/14/1a6614465d013fd7faadfb64562aa68e.jpg',
  'https://i.pinimg.com/736x/12/69/61/126961d201f398910990b6ff90bfe04c.jpg',
  'https://i.pinimg.com/736x/4a/6b/03/4a6b03442ebf89bbedbcfa1dd93565c2.jpg',
  'https://i.pinimg.com/736x/a6/83/d2/a683d26c47e3210adb0feb495da8670d.jpg',
  'https://i.pinimg.com/736x/3c/48/9b/3c489b06a81e11d13da06766405ea2e6.jpg',
  'https://i.pinimg.com/736x/07/94/f7/0794f76a9e6e89fd7a3445d9edc8974d.jpg',
  'https://i.pinimg.com/736x/97/a8/82/97a882a77adbf8075e4d3befb4e9c289.jpg',
  'https://i.pinimg.com/736x/e8/67/1b/e8671b3a446bea5ca754dce360874c23.jpg',
  'https://i.pinimg.com/736x/0c/e6/53/0ce653ad09f10aa1d972ecf9d7b0ef3e.jpg',
  'https://i.pinimg.com/736x/17/bb/7d/17bb7d82b05504e1577335952f19ca0a.jpg',
  'https://i.pinimg.com/736x/8b/3b/bc/8b3bbce8bcc7cd7b35fc4847aeb1477f.jpg',
  'https://i.pinimg.com/736x/cb/ac/59/cbac59e9e06fa03f2db5600755832448.jpg',
  'https://i.pinimg.com/736x/ed/0c/7e/ed0c7ef5a1b11af6fa307818a109b628.jpg',
  'https://i.pinimg.com/736x/42/35/69/423569cdf592eec39b4cf5abf39680ee.jpg',
  'https://i.pinimg.com/736x/6d/0c/f0/6d0cf0dbb6a7479aa201bf781592c289.jpg',
  'https://i.pinimg.com/736x/03/fe/d0/03fed02a43dfdf13981e24f2485cb879.jpg',
  'https://i.pinimg.com/736x/84/f9/cb/84f9cb28cbea4a133aa6d0030f0ac4d7.jpg',
  'https://i.pinimg.com/736x/24/db/7e/24db7e52d88a305235bdbd6178bf69a1.jpg',
  'https://i.pinimg.com/736x/1a/a6/2b/1aa62bcb3a70e896abbff635a74050e6.jpg',
  'https://i.pinimg.com/736x/f7/c0/ce/f7c0cef5c09f71605a8ccee99114e95c.jpg',
  'https://i.pinimg.com/736x/7b/30/ee/7b30ee92245350786bf70b88802c1a0a.jpg',
  'https://i.pinimg.com/736x/be/24/58/be2458a58771772b60fa757d52214b70.jpg',
  'https://i.pinimg.com/736x/e2/f0/e6/e2f0e616411462c8c7c431a1d72f47fc.jpg',
];

const plate = (i) => String(i + 1).padStart(2, '0');

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
      aria-label={`Plate ${plate(index)} of ${images.length}`}
      onClick={onClose}
      translate="no"
    >
      <div className="art-lb-bar" translate="no">
        <span className="spec-label">
          Plate {plate(index)} / {images.length}
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
        src={images[index]}
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
    setOpen((i) => (i === null ? i : (i + d + images.length) % images.length));
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="art-page" translate="no">
      <Helmet>
        <html lang="en" translate="no" />
        <title>Photography | Atishay Kasliwal</title>
        <link rel="canonical" href="https://atishaykasliwal.com/art" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Art | Atishay Kasliwal" />
        <meta property="og:description" content="Photo stories and visual moments by Atishay Kasliwal." />
        <meta property="og:url" content="https://atishaykasliwal.com/art" />
        <meta property="og:image" content="https://atishaykasliwal.com/atishaylogo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Helmet>
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
              <dd className="art-meta-value">{images.length}</dd>
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
          {images.map((src, idx) => (
            <button
              type="button"
              className="art-plate"
              key={src}
              onClick={() => setOpen(idx)}
              aria-label={`Open plate ${plate(idx)}`}
              translate="no"
            >
              <img src={src} alt="" loading="lazy" decoding="async" translate="no" />
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
