import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const isWork    = pathname.startsWith('/highlights');
  const isResume  = pathname.startsWith('/resume');

  return (
    <div className="header" translate="no">
      <div className="header-inner">
        <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          Atishay Kasliwal
        </Link>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          translate="no"
        >
          {isOpen ? '✕' : '☰'}
        </button>
        <nav
          className={`nav ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(false)}
          translate="no"
        >
          <Link to="/highlights" className={isWork ? 'active' : ''}>Work</Link>
          <a
            href="https://www.linkedin.com/in/atishay-kasliwal/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <Link
            to="/resume"
            className={`nav-resume-btn${isResume ? ' active' : ''}`}
          >
            Resume
          </Link>
        </nav>
      </div>
    </div>
  );
}
