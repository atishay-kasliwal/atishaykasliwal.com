import React from 'react';
import SiteHeader from '../SiteHeader';
import PageTone from './PageTone';
import '../styles/page-scope.css';

/**
 * Wrapper for the newly added routes (/about, /projects, /blog, …).
 *
 * Two jobs, both about containment:
 *
 * 1. It renders the site's existing SiteHeader, so the new pages sit under the
 *    same navigation as the rest of the site.
 * 2. The `.ak-page` class is the scope boundary for the new design system.
 *    styles/page-scope.css nests every reset and typographic rule under it, so
 *    none of it reaches the original homepage, résumé, Atriveo, or highlights
 *    pages. Those keep their existing appearance exactly.
 *
 * Removing this wrapper would let the new stylesheet's element selectors leak
 * site-wide, which is precisely what it exists to prevent.
 */
export default function PageShell({ children, tone = null }) {
  return (
    <div className={`ak-page${tone ? ` premium-page premium-page--${tone}` : ''}`}>
      {tone ? <PageTone variant={tone} /> : null}
      <SiteHeader />
      {children}
    </div>
  );
}
