import { useState } from 'react';
import Link from 'next/link';

export default function Header({ className = '' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`header ${className}`} translate="no">
      <Link href="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileMenuOpen(false)} translate="no">
        <strong>Atishay Kasliwal</strong>
      </Link>
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
        translate="no"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>
      <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} translate="no">
        <Link href="/highlights" translate="no">HIGHLIGHTS</Link>
        <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer" translate="no">RESUME</a>
        <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" translate="no">LINKEDIN</a>
        <Link href="/art" translate="no">ART</Link>
      </nav>
    </div>
  );
}

