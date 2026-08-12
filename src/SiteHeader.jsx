import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandMark from './components/BrandMark';

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  /* Projects points at /projects — the browse page. It used to open the legacy
     /highlights index, which has since been retired into it. /highlights/:id
     still serves the live demos, so `isWork` keeps matching both prefixes:
     browsing into a demo should leave the nav item lit. */
  const isWork    = pathname.startsWith('/highlights') || pathname.startsWith('/projects');
  const isAbout   = pathname.startsWith('/about') || pathname.startsWith('/experience');
  const isResume  = pathname.startsWith('/resume');

  return (
    <div className="header" translate="no">
      <div className="header-inner">
        <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          <span className="nav-monogram" aria-hidden="true">
            <BrandMark size={19} />
          </span>
          <span className="nav-logo-text">Atishay Kasliwal</span>
          <span className="nav-logo-sub" aria-hidden="true">Spec Sheet · Rev 2026</span>
        </Link>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          translate="no"
        >
          {isOpen ? '✕' : '☰'}
        </button>
        {/* Site IA only — LinkedIn moved out of the primary nav to the hero and
            footer, where an outbound link belongs. */}
        <nav
          className={`nav ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(false)}
          aria-label="Primary"
          translate="no"
        >
          {/* Contact lives in the footer now, not here. The header carries
              the three places worth browsing plus the résumé; contact is a
              destination people go to when they have already decided, which is
              the bottom of the page. */}
          {/* Atriveo came out of the primary nav — it is one project among
              several, and giving it a top-level slot beside Projects and About
              claimed more of the site than it is. /atriveo still exists and is
              still linked from the footer sitemap, the projects browse page,
              and its own case study. */}
          <Link to="/projects" className={isWork ? 'active' : ''}>
            <span className="nav-num" aria-hidden="true">01</span>Projects
          </Link>
          <Link to="/about" className={isAbout ? 'active' : ''}>
            <span className="nav-num" aria-hidden="true">02</span>About
          </Link>
          <Link
            to="/resume"
            className={`nav-resume-btn${isResume ? ' active' : ''}`}
          >
            Résumé
          </Link>
        </nav>
      </div>
    </div>
  );
}
