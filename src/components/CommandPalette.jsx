import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { search, groupResults } from '../lib/searchIndex.js';
import './CommandPalette.css';

/**
 * Global command palette (⌘K / Ctrl-K).
 *
 * Handles the full modal-dialog accessibility contract, which is most of the
 * code here: focus moves in on open and returns to the trigger on close, Tab is
 * trapped inside, Escape closes, the page behind is inert, and the active
 * option is announced via aria-activedescendant rather than by moving DOM
 * focus (moving focus to each option would break type-ahead in the input).
 */

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const results = useMemo(() => search(query), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    // Return focus where it was, or the palette becomes a focus black hole.
    restoreFocusRef.current?.focus?.();
  }, []);

  const openPalette = useCallback(() => {
    restoreFocusRef.current = document.activeElement;
    setOpen(true);
  }, []);

  /* Global shortcut + the header button's custom event. */
  useEffect(() => {
    const onKey = (e) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const slash =
        e.key === '/' &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') &&
        !document.activeElement?.isContentEditable;

      if (cmdK || slash) {
        e.preventDefault();
        open ? close() : openPalette();
      }
    };

    const onOpenEvent = () => openPalette();

    window.addEventListener('keydown', onKey);
    window.addEventListener('ak:open-palette', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ak:open-palette', onOpenEvent);
    };
  }, [open, close, openPalette]);

  /* Lock scroll and focus the input on open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // rAF so the element exists and is visible before focusing.
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(raf);
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  /* Keep the highlighted row in view during keyboard navigation. */
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const go = useCallback(
    (entry) => {
      if (!entry) return;
      close();
      if (entry.path) {
        navigate(entry.path);
      } else if (entry.href) {
        if (entry.download) {
          const a = document.createElement('a');
          a.href = entry.href;
          a.download = '';
          a.click();
        } else if (entry.href.startsWith('mailto:')) {
          window.location.href = entry.href;
        } else {
          window.open(entry.href, '_blank', 'noopener,noreferrer');
        }
      }
    },
    [close, navigate]
  );

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
      return;
    }

    // Focus trap. Only the input and the close button are tabbable, so cycling
    // between them is enough to keep Tab inside the dialog.
    if (e.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll(
        'input, button:not([disabled])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div
      className="palette-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <div className="palette-input-row">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, projects, writing…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `palette-opt-${active}` : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" className="palette-close" onClick={close} aria-label="Close search">
            esc
          </button>
        </div>

        <div className="palette-results" ref={listRef}>
          {results.length === 0 ? (
            <p className="palette-empty" role="status">
              No results for “{query}”
            </p>
          ) : (
            <ul id="palette-list" role="listbox" aria-label="Results">
              {grouped.map(({ group, items }) => (
                <li key={group} role="presentation">
                  <p className="palette-group" role="presentation">
                    {group}
                  </p>
                  <ul role="presentation">
                    {items.map((entry) => {
                      flatIndex += 1;
                      const i = flatIndex;
                      return (
                        <li
                          key={entry.id}
                          id={`palette-opt-${i}`}
                          data-index={i}
                          role="option"
                          aria-selected={i === active}
                          className={`palette-item${i === active ? ' is-active' : ''}`}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(entry)}
                        >
                          <span className="palette-item-title">{entry.title}</span>
                          {entry.subtitle && (
                            <span className="palette-item-sub">{entry.subtitle}</span>
                          )}
                          {entry.href && (
                            <span className="palette-item-ext" aria-hidden="true">
                              ↗
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
