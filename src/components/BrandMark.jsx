import React from 'react';

/* The AK ligature: the A blade and the two K sweeps cut from one rhythm.
   Drawn on a 100x100 grid in currentColor so it works in any context.
   Source: the "Atishay AI Mark" concept set, mark 12 (Ascent). */
const BLADE_A = 'M47 8 C55 26 60 36 63 44 C58 60 55 72 50 80 C45 88 38 92 26 92 L8 92 Z';
const ARM_K = 'M66 12 H96 C89 32 78 41 62 46 L57 30 Z';
const LEG_K = 'M63 52 C80 47 89 68 96 92 L77 92 C65 92 58 82 56 68 Z';

/* Flat version — use below ~24px, where the extrusion muddies. */
export function BrandMarkFlat({ className, size = 24 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path d={BLADE_A} fill="currentColor" />
      <path d={ARM_K} fill="currentColor" />
      <path d={LEG_K} fill="currentColor" />
    </svg>
  );
}

/* Dimensional version — two offset ghosts behind the front faces. No
   gradients, so it still scales and prints as flat vector geometry. */
export default function BrandMark({ className, size = 28 }) {
  return (
    <svg
      viewBox="0 0 108 104"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(9 8)" opacity="0.28">
        <path d={BLADE_A} fill="currentColor" />
        <path d={ARM_K} fill="currentColor" />
        <path d={LEG_K} fill="currentColor" />
      </g>
      <g transform="translate(4.5 4)" opacity="0.5">
        <path d={BLADE_A} fill="currentColor" />
        <path d={ARM_K} fill="currentColor" />
        <path d={LEG_K} fill="currentColor" />
      </g>
      <path d={BLADE_A} fill="currentColor" />
      <path d={ARM_K} fill="currentColor" opacity="0.86" />
      <path d={LEG_K} fill="currentColor" opacity="0.72" />
    </svg>
  );
}
