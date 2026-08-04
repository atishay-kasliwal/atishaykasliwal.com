import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';
import { NAV_LINKS } from '../seo/routes.js';
import { FULL_NAME, RESUME_PDF } from '../data/site.js';
import { toggleTheme, resolveTheme } from '../lib/theme.js';
import './SiteHeader.css';

/**
 * Primary site header.
 *
 * Nav items come from NAV_LINKS in the route registry, so navigation can never
 * drift from what is in the sitemap — including the `hidden` flag that keeps
 * routes without real content out of both.
 */

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.5A5.75 5.75 0 0 1 6.5 2.5a5.75 5.75 0 1 0 7 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setThemeState] = useState('dark');
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    setThemeState(resolveTheme());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // While the mobile drawer is open, lock the body so the page behind it does
  // not scroll under the overlay, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onToggleTheme = useCallback(() => setThemeState(toggleTheme()), []);

  const openPalette = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ak:open-palette'));
  }, []);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-header-inner">
        <Link to="/" className="brand" aria-label={`${FULL_NAME} — home`}>
          <span className="brand-mark" aria-hidden="true">
            <BrandMark size={18} />
          </span>
          <span className="brand-name">{FULL_NAME}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <button
            type="button"
            className="header-icon-btn header-search-btn"
            onClick={openPalette}
            aria-label="Search — press Command K"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <kbd className="header-kbd" aria-hidden="true">⌘K</kbd>
          </button>

          <button
            type="button"
            className="header-icon-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <a className="header-resume-btn" href={RESUME_PDF} download>
            Résumé
          </a>

          <button
            type="button"
            className="header-menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className={`burger${open ? ' is-open' : ''}`} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer. Kept in the DOM but hidden so the open/close transition
          has something to animate; `inert` removes it from the tab order and
          the accessibility tree while closed. */}
      <div
        id="mobile-nav"
        className={`mobile-nav${open ? ' is-open' : ''}`}
        inert={open ? undefined : ''}
      >
        <nav aria-label="Mobile">
          {NAV_LINKS.map((link, i) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}
              style={{ '--i': i }}
            >
              <span className="mobile-nav-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {link.label}
            </NavLink>
          ))}
          <a
            className="mobile-nav-link mobile-nav-resume"
            href={RESUME_PDF}
            download
            style={{ '--i': NAV_LINKS.length }}
          >
            <span className="mobile-nav-num" aria-hidden="true">
              {String(NAV_LINKS.length + 1).padStart(2, '0')}
            </span>
            Download Résumé
          </a>
        </nav>
      </div>
    </header>
  );
}
