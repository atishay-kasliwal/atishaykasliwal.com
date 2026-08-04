import React from 'react';

/* Lapel pins for the places this work happened. They live in the footer band,
   layered over the ghosted wordmark. */
const PINS = [
  { src: '/final-product/new_york_pplapel_pin-removebg-preview.png', label: 'New York' },
  { src: '/final-product/Chicago_lapel_opin-removebg-preview.png', label: 'Chicago' },
  { src: '/final-product/Chicago_lapepl_pion-removebg-preview.png', label: 'Chicago' },
  { src: '/final-product/fomc_market_predictions_1min.png', label: 'FOMC' },
  { src: '/final-product/lirr.png', label: 'LIRR' },
  { src: '/final-product/mlirr.png', label: 'Metro' },
  { src: '/final-product/WS.png', label: 'Winston-Salem' },
  { src: '/final-product/SBY.png', label: 'Stony Brook' },
  { src: '/final-product/WF.png', label: 'Wake Forest' },
  { src: '/final-product/ny1.png', label: 'New York' },
];

function FinalProductGrid() {
  return (
    <ul className="spec-pins" aria-label="Places" translate="no">
      {PINS.map((pin, idx) => (
        <li className="spec-pin" key={pin.src + idx} translate="no">
          <img src={pin.src} alt={pin.label} loading="lazy" decoding="async" translate="no" />
        </li>
      ))}
    </ul>
  );
}

export default FinalProductGrid;
