import { useEffect } from 'react';

/**
 * Cursor light + grid parallax for a hero section.
 *
 * Writes two pairs of custom properties per frame and nothing else, so the glow
 * and the grid transform both stay on the compositor — no layout, no paint of
 * anything but the gradient itself.
 *
 *   --gx / --gy   cursor position in px, for the radial glow
 *   --px / --py   normalised -1..1, for the grid's parallax translate
 *
 * Sits out entirely on touch devices (no cursor to track) and under
 * prefers-reduced-motion, where a parallax that follows the pointer is exactly
 * the kind of motion people disable it to avoid.
 *
 * Extracted from HomePage so the landing hero and the Atriveo hero share one
 * implementation rather than drifting apart.
 */
export default function useHeroPointer(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return undefined;

    let frame = 0;
    let pending = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      const { x, y, w, h } = pending;
      el.style.setProperty('--gx', `${x}px`);
      el.style.setProperty('--gy', `${y}px`);
      el.style.setProperty('--px', (x / w) * 2 - 1);
      el.style.setProperty('--py', (y / h) * 2 - 1);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      pending = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
