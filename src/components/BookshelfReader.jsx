import React, { forwardRef, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { BOOKSHELF } from '../data/bookshelf.js';
import './BookshelfReader.css';

const plate = (i) => String(i + 1).padStart(2, '0');

const Cover = forwardRef(({ book, index }, ref) => (
  <div className="bs-page bs-page--cover" ref={ref}>
    <span className="spec-label bs-page-eyebrow">Fig. {plate(index)} / Plate</span>
    <div className="bs-page-title">{book.title}</div>
    <div className="bs-page-rule" />
    <div className="bs-page-author">{book.author}</div>
    <div className="bs-page-year">{book.year}</div>
  </div>
));
Cover.displayName = 'Cover';

const Leaf = forwardRef(({ text, number }, ref) => (
  <div className="bs-page" ref={ref}>
    <p className="bs-page-text">{text}</p>
    <span className="bs-page-num mono">{number}</span>
  </div>
));
Leaf.displayName = 'Leaf';

export default function BookshelfReader() {
  const [activeId, setActiveId] = useState(BOOKSHELF[0].id);
  const activeIndex = BOOKSHELF.findIndex((b) => b.id === activeId);
  const book = BOOKSHELF[activeIndex];
  const flipRef = useRef(null);

  const openBook = (id) => {
    setActiveId(id);
    flipRef.current?.pageFlip()?.turnToPage(0);
  };

  return (
    <div className="bs-wrap">
      <div className="bs-shelf" role="listbox" aria-label="Choose a book">
        {BOOKSHELF.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="option"
            aria-selected={b.id === activeId}
            className={`bs-spine${b.id === activeId ? ' is-active' : ''}`}
            onClick={() => openBook(b.id)}
          >
            <span className="bs-spine-title">{b.title}</span>
            <span className="bs-spine-num mono">{plate(i)}</span>
            <span className="bs-spine-tooltip">
              <span className="bs-spine-tooltip-title">{b.title}</span>
              <span className="bs-spine-tooltip-author">{b.author} · {b.year}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="bs-reader">
        <HTMLFlipBook
          key={book.id}
          ref={flipRef}
          width={280}
          height={280}
          size="stretch"
          minWidth={220}
          maxWidth={360}
          minHeight={280}
          maxHeight={280}
          showCover={false}
          usePortrait={false}
          drawShadow={false}
          className="bs-flipbook"
        >
          <Cover book={book} index={activeIndex} />
          {book.pages.map((text, i) => (
            <Leaf key={i} text={text} number={i + 1} />
          ))}
          <Cover book={book} index={activeIndex} />
        </HTMLFlipBook>
      </div>
    </div>
  );
}
