import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from './components/BrandMark';

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const isWork    = pathname.startsWith('/highlights');
  const isAtriveo = pathname.startsWith('/atriveo');
  const isResume  = pathname.startsWith('/resume');
  const isHome    = pathname === '/';

  /* About lives on the landing page. From home that's a plain in-page scroll;
     from anywhere else we route home first, then scroll once it has painted. */
  const goToAbout = (e) => {
    e.preventDefault();
    const scroll = () =>
      document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (isHome) {
      scroll();
    } else {
      navigate('/');
      requestAnimationFrame(() => setTimeout(scroll, 120));
    }
  };

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
          <Link to="/highlights" className={isWork ? 'active' : ''}>
            <span className="nav-num" aria-hidden="true">01</span>Projects
          </Link>
          <Link to="/atriveo" className={isAtriveo ? 'active' : ''}>
            <span className="nav-num" aria-hidden="true">02</span>Atriveo
          </Link>
          <a href="/#about-section" className="nav-about-link" onClick={goToAbout}>
            <span className="nav-num" aria-hidden="true">03</span>About
          </a>
          <a href="mailto:hire@atishaykasliwal.com" className="nav-contact-link">
            <span className="nav-num" aria-hidden="true">04</span>Contact
          </a>
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
