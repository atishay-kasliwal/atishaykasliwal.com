import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer spec-footer" translate="no">
      {/* The band is the ghosted wordmark alone now. It used to also carry ten
          lapel-pin images layered over the mark — the only saturated colour on
          a site that is otherwise monochrome plus one indigo, and they sat
          directly on top of the wordmark so neither read cleanly.
          FinalProductGrid.jsx is still in the tree if they are ever wanted
          back. */}
      <div className="spec-footer-band" translate="no">
        <span className="spec-footer-wordmark" aria-hidden="true" translate="no">
          Atishay Kasliwal
        </span>
      </div>

      {/* Sitemap row. The header carries only five items, which left several
          real pages reachable solely by typing the URL — dead weight for both
          visitors and crawlers, since internal links are how PageRank and
          discovery flow. Styled with the existing .spec-label mono treatment so
          it reads as part of the same document. */}
      <nav className="footer-content spec-footer-nav" aria-label="Footer" translate="no">
        <Link to="/contact" className="spec-label spec-footer-contact">
          <span className="spec-footer-contact-dot" aria-hidden="true" />
          Contact
        </Link>
        <Link to="/projects" className="spec-label">Projects</Link>
        <Link to="/experience" className="spec-label">Experience</Link>
        <Link to="/open-source" className="spec-label">Open source</Link>
        <Link to="/blog" className="spec-label">Writing</Link>
        <Link to="/about" className="spec-label">About</Link>
        <Link to="/resume" className="spec-label">Résumé</Link>
        <Link to="/art" className="spec-label">Photography</Link>
        <Link to="/privacy" className="spec-label">Privacy</Link>
        <a className="spec-label" href="/rss.xml">RSS</a>
      </nav>

      <div className="footer-content spec-footer-row" translate="no">
        <span className="spec-label spec-footer-colophon" translate="no">
          © {new Date().getFullYear()} Atishay Kasliwal · React / Vite / Cloudflare
        </span>

        <span className="spec-label spec-footer-end" translate="no">
          End of document <span className="spec-footer-end-mark" aria-hidden="true">✦</span>
        </span>

        <span className="footer-socials" translate="no">
          <Link to="/art" aria-label="Photography" translate="no">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3l-1.83 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" />
            </svg>
          </Link>
          <a
            href="mailto:hire@atishaykasliwal.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Email"
            translate="no"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 13.065l-11.985-7.065v14c0 1.104.896 2 2 2h19.97c1.104 0 2-.896 2-2v-14l-11.985 7.065zm11.985-9.065c0-1.104-.896-2-2-2h-19.97c-1.104 0-2 .896-2 2v.217l12 7.083 11.97-7.083v-.217z" />
            </svg>
          </a>
          <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" aria-label="GitHub" translate="no">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" translate="no">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" />
            </svg>
          </a>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
