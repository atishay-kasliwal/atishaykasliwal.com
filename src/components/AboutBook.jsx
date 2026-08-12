import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { BOOKSHELF } from '../data/bookshelf.js';
import './AboutBook.css';

const ImagePage = forwardRef(({ src, alt }, ref) => (
  <div className="ab-page ab-page--image" ref={ref}>
    <img src={src} alt={alt} loading="lazy" />
  </div>
));
ImagePage.displayName = 'ImagePage';

const CoverPage = forwardRef(({ book }, ref) => (
  <div className="ab-page ab-page--cover" ref={ref}>
    <span className="spec-brackets" aria-hidden="true" />
    <span className="spec-label ab-eyebrow">Plate</span>
    <h2 className="ab-plate-title">{book.title}</h2>
    <div className="ab-plate-rule" />
    <span className="spec-label ab-cover-author">{book.author}</span>
    <span className="spec-label ab-cover-year">{book.year}</span>
  </div>
));
CoverPage.displayName = 'CoverPage';

const TextPage = forwardRef(({ text, number }, ref) => (
  <div className="ab-page ab-page--text" ref={ref}>
    <span className="spec-brackets" aria-hidden="true" />
    <p className="ab-text-copy">{text}</p>
    <span className="spec-label ab-text-num">{number}</span>
  </div>
));
TextPage.displayName = 'TextPage';

const MIN_BOOK_HEIGHT = 320;
const MIN_PAGE_WIDTH = 160;
const PAGE_ASPECT = 595.28 / 841.89; // the magazine's own A4 page ratio
const ARROWS_OVERHEAD = 2 * 36 + 2 * 16; // two 2.25rem arrow buttons + their gaps

export default function AboutBook({
  documentLabel = '/reading.doc',
  title = 'Reading',
  subtitle = '',
}) {
  const [activeBook, setActiveBook] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [navHeight, setNavHeight] = useState(MIN_BOOK_HEIGHT);
  const [readerWidth, setReaderWidth] = useState(0);
  const flipRef = useRef(null);
  const navRef = useRef(null);
  const readerRef = useRef(null);

  const book = BOOKSHELF[activeBook];
  const pageCount = book.images ? book.images.length : book.pages.length + 2;

  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;
    const update = () => setNavHeight(Math.max(MIN_BOOK_HEIGHT, el.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = readerRef.current;
    if (!el) return undefined;
    const update = () => setReaderWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Two pages sit side by side, so each page's own width is at most half of
  // whatever room is left after the arrow buttons.
  const maxWidthFromContainer = Math.max(
    MIN_PAGE_WIDTH,
    Math.floor((readerWidth - ARROWS_OVERHEAD) / 2)
  );
  // What we'd use on a spacious viewport: width follows the shelf's height
  // at the page's own aspect ratio, so the page fills that height exactly
  // instead of letterboxing — nothing to do with available space yet.
  const desiredWidth = Math.max(MIN_PAGE_WIDTH, Math.round(navHeight * PAGE_ASPECT));

  // Pin both dimensions exactly (min === max) so react-pageflip's own
  // aspect-ratio math can't override what we just computed. Only fall back
  // to sizing from the available width — recomputing height to match, so
  // pages shrink instead of distorting — when the viewport is actually too
  // narrow for desiredWidth. That keeps the desktop height-match intact
  // while still making the magazine pages fit on small screens.
  const isContainerConstrained = maxWidthFromContainer < desiredWidth;
  const bookWidth = isContainerConstrained
    ? Math.max(MIN_PAGE_WIDTH, maxWidthFromContainer)
    : desiredWidth;
  const bookHeight = isContainerConstrained ? Math.round(bookWidth / PAGE_ASPECT) : navHeight;

  const openBook = useCallback((index) => {
    setActiveBook(index);
    setPageIndex(0);
  }, []);

  const handleFlip = useCallback((e) => {
    setPageIndex(e.data);
  }, []);

  const flipNext = useCallback(() => flipRef.current?.pageFlip()?.flipNext(), []);
  const flipPrev = useCallback(() => flipRef.current?.pageFlip()?.flipPrev(), []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        flipNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        flipPrev();
      }
    },
    [flipNext, flipPrev]
  );

  return (
    <div className="ab-wrap">
      <header className="ab-header">
        <p className="spec-label ab-doc">
          <span className="ab-doc-mark" aria-hidden="true" />
          {documentLabel}
        </p>
        <h2 className="ab-section-title">{title}</h2>
        {subtitle ? <p className="ab-section-subtitle">{subtitle}</p> : null}
      </header>

      <nav className="ab-nav" ref={navRef} aria-label="Bookshelf">
        {BOOKSHELF.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-current={i === activeBook}
            className={`ab-nav-item${i === activeBook ? ' is-active' : ''}`}
            onClick={() => openBook(i)}
          >
            <span className="ab-nav-swatch" style={{ background: b.spine }} aria-hidden="true" />
            <span className="ab-nav-text">
              <span className="ab-nav-title">{b.title}</span>
              <span className="spec-label ab-nav-sub">
                {b.author} &middot; {b.year}
              </span>
            </span>
          </button>
        ))}
      </nav>

      <div className="ab-reader" ref={readerRef} onKeyDown={onKeyDown} tabIndex={0} role="group" aria-label="Open book">
        <div className="ab-reader-row">
          <button type="button" className="ab-arrow ab-arrow--prev" onClick={flipPrev} aria-label="Previous page">
            &#8592;
          </button>

          <div className="ab-flip-outer">
            <HTMLFlipBook
              key={book.id}
              ref={flipRef}
              width={bookWidth}
              height={bookHeight}
              size="stretch"
              minWidth={bookWidth}
              maxWidth={bookWidth}
              minHeight={bookHeight}
              maxHeight={bookHeight}
              showCover={false}
              usePortrait={false}
              drawShadow={false}
              maxShadowOpacity={0}
              className="ab-flipbook"
              onFlip={handleFlip}
            >
              {book.images
                ? book.images.map((src, i) => (
                    <ImagePage key={src} src={src} alt={`${book.title} — page ${i + 1}`} />
                  ))
                : [
                    <CoverPage key={`${book.id}-cover-front`} book={book} />,
                    ...book.pages.map((text, i) => <TextPage key={i} text={text} number={i + 1} />),
                    <CoverPage key={`${book.id}-cover-back`} book={book} />,
                  ]}
            </HTMLFlipBook>
          </div>

          <button type="button" className="ab-arrow ab-arrow--next" onClick={flipNext} aria-label="Next page">
            &#8594;
          </button>
        </div>

        <div className="ab-progress spec-label">
          {String(pageIndex + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}
