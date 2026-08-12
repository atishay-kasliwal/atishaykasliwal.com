import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSystemPanel.css';

/* ── The right half of the hero ───────────────────────────────────────────
   Two featured projects, both linking to their live interactive build rather
   than to a write-up — the point of this column is that the work runs.

   It previously held an Atriveo system diagram ("Fig. A / System Architecture")
   above a single featured plate. The diagram came out: it duplicated the system
   map on /atriveo, which is where it belongs and has room to be read, and at
   hero size its three columns of nine nodes were the densest thing on an
   otherwise open page. */

/* uuids, not slugs. These are the ids HighlightDetail keys the live demos off
   (src/data/highlights.js), so each lands on the interactive build rather than
   on a stub. */
const FEATURED = [
  {
    id: 'mri',
    href: '/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012',
    cta: 'hero_featured_mri',
    title: 'Tumor Detection',
    body: 'A CNN that segments brain tumours entirely in the browser — no upload, no server. Quantised for TensorFlow.js, so scan data never leaves the machine.',
    action: 'Open the viewer',
    /* A real axial T1 slice — the exact modality the viewer renders — composited
       onto the plate by scripts/build-images.mjs. It replaces the generated
       placeholder plate (<slug>-tile.jpg), which was a numbered dot field and
       said nothing about the work.

       Still not /mriimage.jpeg: that file is stock photography of a radiology
       monitor, and using it here would imply the screenshot is of this system
       when it is of nothing. The slice claims only to be a scan, which is what
       it is. */
    shot: '/projects/mri-tumor-viewer-shot.jpg',
  },
  {
    id: 'fomc',
    href: '/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01',
    cta: 'hero_featured_fomc',
    title: 'FOMC Intelligence',
    body: 'An NLP pipeline that reads Fed press conferences minute by minute. Five models backtested across 13 rate decisions, with a public API behind it.',
    action: 'Open the dashboard',
    shot: '/fomc-preview.jpg',
  },
];

function HeroSystemPanel() {
  return (
    /* aria-label rather than aria-labelledby: the element that carried
       id="hsp-title" was the removed diagram's heading, and a labelledby
       pointing at a missing id leaves the region silently unnamed. */
    <aside className="hsp" aria-label="Featured projects" translate="no">
      {FEATURED.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className="hsp-plate hsp-featured"
          data-cta-position={item.cta}
          translate="no"
        >
          <div className="hsp-featured-text" translate="no">
            <span className="spec-label spec-label--accent">Featured Project</span>
            <h2 className="hsp-featured-title" translate="no">
              {item.title}
            </h2>
            <p className="hsp-featured-desc" translate="no">
              {item.body}
            </p>
            <span className="hsp-featured-cta" translate="no">
              {item.action}
              <svg width="13" height="13" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <span className="hsp-featured-shot" aria-hidden="true" translate="no">
            <img
              src={item.shot}
              alt=""
              width="560"
              height="311"
              loading="lazy"
              decoding="async"
              translate="no"
            />
          </span>
        </Link>
      ))}
    </aside>
  );
}

export default HeroSystemPanel;
