import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowIcon } from '../ui';
import './BrowseRail.css';

/**
 * The horizontally scrolling shelf every browse row is built on.
 *
 * Extracted from ProjectRow once the writing section needed the same rail:
 * identical scroll behaviour, chevrons, edge fades, and keyboard handling, but
 * holding blog tiles instead of project tiles. Duplicating it would have meant
 * two copies of the arrow-key logic drifting apart.
 *
 * Children are the tiles, and must be <li> elements — the rail renders a <ul>
 * so the row announces as a list with a count. Anything with a
 * `.browse-card__link` inside participates in arrow-key navigation.
 *
 * Scrolling is native — `overflow-x: auto` with scroll snapping — rather than a
 * transform carousel. That gives trackpad momentum, touch swipe, shift+wheel,
 * screen-reader scroll-into-view, and keyboard scrolling for free, all of which
 * a transform carousel has to reimplement badly. The chevrons just call
 * scrollBy() on the same element.
 *
 * The chevrons are enhancement-only: they render nothing until an effect has
 * measured that the track actually overflows, so the prerendered HTML carries
 * no controls that would be dead on a narrow viewport or without JS.
 */
export default function BrowseRail({ title, action, children }) {
  const trackRef = useRef(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  /* One measurement used by both the initial pass and every scroll/resize.
     `- 1` absorbs sub-pixel rounding, which otherwise leaves the right chevron
     enabled at the end of the track on fractional-DPI displays. */
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setOverflow({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    measure();
    el.addEventListener('scroll', measure, { passive: true });

    /* Tile widths are fixed but the viewport is not, so a resize changes
       whether the row overflows. ResizeObserver catches that plus any layout
       change from fonts loading, which a window resize listener would miss. */
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, children]);

  /* Scroll by a viewport minus one tile, so the tile at the edge stays
     partially visible and the eye keeps its place — a full-viewport jump loses
     the reader's position entirely. */
  const scrollByPage = useCallback((direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.browse-card');
    const step = Math.max(el.clientWidth - (card?.offsetWidth || 0), el.clientWidth * 0.6);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  /* Left/Right arrows move focus between tiles rather than scrolling the box.
     Moving focus is what a user expects from a horizontal list, and it scrolls
     the track as a side effect because the browser reveals the focused link. */
  const handleKeyDown = useCallback((event) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const el = trackRef.current;
    if (!el) return;

    const links = [...el.querySelectorAll('.browse-card__link')].filter(
      (node) => node.tagName === 'A'
    );
    if (!links.length) return;

    const current = links.indexOf(document.activeElement.closest('.browse-card__link'));

    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = links.length - 1;
    else if (current === -1) next = 0;
    else next = current + (event.key === 'ArrowRight' ? 1 : -1);

    /* Clamped, not wrapped. Wrapping in a scroller yanks the viewport across
       the whole track and reads as a bug. */
    if (next < 0 || next >= links.length) return;

    event.preventDefault();
    links[next].focus();
  }, []);

  const id = `rail-${slugId(title)}`;

  return (
    <section className="browse-row" aria-labelledby={id}>
      <header className="browse-row__head">
        <h2 className="browse-row__title spec-label" id={id}>
          {title}
        </h2>

        <div className="browse-row__tools">
          {action && (
            <Link to={action.to} className="browse-row__action">
              {action.label}
              <ArrowIcon />
            </Link>
          )}

          {(overflow.left || overflow.right) && (
            <div className="browse-row__nav">
              <button
                type="button"
                className="browse-row__chevron"
                onClick={() => scrollByPage(-1)}
                disabled={!overflow.left}
                aria-label={`Scroll ${title} backward`}
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                className="browse-row__chevron"
                onClick={() => scrollByPage(1)}
                disabled={!overflow.right}
                aria-label={`Scroll ${title} forward`}
              >
                <Chevron direction="right" />
              </button>
            </div>
          )}
        </div>
      </header>

      <ul
        className="browse-row__track"
        ref={trackRef}
        onKeyDown={handleKeyDown}
        data-overflow-left={overflow.left || undefined}
        data-overflow-right={overflow.right || undefined}
      >
        {children}
      </ul>
    </section>
  );
}

const slugId = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const Chevron = ({ direction }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
