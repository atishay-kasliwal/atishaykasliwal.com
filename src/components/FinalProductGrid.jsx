import React from 'react';

/* Lapel pins for the places this work happened. They live in the footer band,
   layered over the ghosted wordmark.

   Each pin ships as a 240px WebP (built by scripts/build-images.mjs) with the
   original PNG as the <picture> fallback. Previously these were full-size PNGs
   — ~1.8 MB across ten images rendered at roughly 100px each, which was enough
   for one of them to register as the homepage's largest contentful paint.

   width/height are required, not decorative: without them the browser cannot
   reserve space before the image loads, and ten lazy images popping in at once
   was the homepage's entire layout-shift score. */
const PINS = [
  { src: '/final-product/new_york_pplapel_pin-removebg-preview', label: 'New York' },
  { src: '/final-product/Chicago_lapel_opin-removebg-preview', label: 'Chicago' },
  { src: '/final-product/Chicago_lapepl_pion-removebg-preview', label: 'Chicago' },
  { src: '/final-product/fomc_market_predictions_1min', label: 'FOMC' },
  { src: '/final-product/lirr', label: 'LIRR' },
  { src: '/final-product/mlirr', label: 'Metro' },
  { src: '/final-product/WS', label: 'Winston-Salem' },
  { src: '/final-product/SBY', label: 'Stony Brook' },
  { src: '/final-product/WF', label: 'Wake Forest' },
  { src: '/final-product/ny1', label: 'New York' },
];

function FinalProductGrid() {
  return (
    <ul className="spec-pins" aria-label="Places" translate="no">
      {PINS.map((pin, idx) => (
        <li className="spec-pin" key={pin.src + idx} translate="no">
          <picture>
            <source srcSet={`${pin.src}.webp`} type="image/webp" />
            <img
              src={`${pin.src}.png`}
              alt={pin.label}
              width="240"
              height="240"
              loading="lazy"
              decoding="async"
              translate="no"
            />
          </picture>
        </li>
      ))}
    </ul>
  );
}

export default FinalProductGrid;
