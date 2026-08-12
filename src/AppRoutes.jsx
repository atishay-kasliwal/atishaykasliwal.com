import React, { lazy, Suspense, Fragment } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Footer from './components/Footer';
import PageShell from './components/PageShell';
import CommandPalette from './components/CommandPalette';

/**
 * Route table, deliberately free of any Router.
 *
 * The client wraps this in BrowserRouter (App.jsx); the prerenderer wraps it in
 * StaticRouter (entry-server.jsx). Keeping the router out of here is what lets
 * the identical tree render in both places — which is what makes build-time
 * prerendering possible at all.
 *
 * The existing pages own their own headers (HomePage renders SiteHeader itself),
 * so no header is imposed here. The new routes render the same SiteHeader for
 * consistency.
 *
 * Splitting policy is a hydration-correctness decision, not only a size one.
 * The new content routes are imported eagerly: they are static markup over the
 * data layer (a few KB each), and eager imports let the prerendered HTML hydrate
 * in one pass with no Suspense flash. The heavy legacy routes stay lazy —
 * in-browser ML, dashboards, embeds, hundreds of KB each.
 */

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ExperiencePage from './pages/ExperiencePage';
import ResearchPage from './pages/ResearchPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import SpeakingPage from './pages/SpeakingPage';
import OpenSourcePage from './pages/OpenSourcePage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Code-split routes.
 *
 * `overrides` lets the prerenderer swap in already-imported components. React.lazy
 * suspends on its first render no matter what, and a suspended boundary makes
 * React emit the FALLBACK into the static shell and defer the real markup to a
 * hydration-time swap — so these four pages were shipping an empty
 * `.route-loading` div and jumping to full height on load. Warming the modules
 * beforehand does not help, because the suspension is a property of the lazy
 * wrapper, not of module availability.
 *
 * On the client `overrides` is undefined, so lazy() is used and code splitting
 * is fully preserved.
 */
const lazyRoutes = {
  Resume: lazy(() => import('./Resume')),
  ArtPage: lazy(() => import('./pages/ArtPage')),
  AtriveoPage: lazy(() => import('./pages/AtriveoPage')),
  HighlightDetail: lazy(() => import('./HighlightDetail')),
  AdminApp: lazy(() => import('./admin/AdminApp')),
};

/* Reserves vertical space while a chunk loads so the swap-in does not shift
   layout. aria-busy lets assistive tech announce the pending state. */
function RouteFallback() {
  return <div className="route-loading" aria-busy="true" style={{ minHeight: '60svh' }} />;
}

/**
 * Suspense wrapper for the lazily-loaded legacy routes only.
 *
 * A single <Suspense> around the whole <Routes> block looked harmless and was
 * not. During prerendering React treats any Suspense boundary as potentially
 * client-resolved: it emits the FALLBACK into the shell and parks the real
 * markup in a hidden block that an inline script swaps in at hydration. Every
 * page therefore first painted an empty `.route-loading` div and then jumped to
 * full height — a 0.268 layout shift on every route, and the loss of the LCP
 * benefit prerendering exists to provide, since the visible first paint
 * contained no content at all.
 *
 * Scoping the boundary to the routes that actually need it lets every eagerly
 * imported page prerender as plain static HTML with no boundary, no fallback,
 * and no swap.
 */
const Lazy = ({ children }) => <Suspense fallback={<RouteFallback />}>{children}</Suspense>;

export default function AppRoutes({ overrides }) {
  const R = { ...lazyRoutes, ...overrides };
  const location = useLocation();
  const isAdminRoute =
    location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  /* With eager components there is nothing to suspend on, so the boundary is
     skipped entirely and the markup inlines into the static HTML. */
  const Boundary = overrides ? Fragment : Lazy;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!isAdminRoute ? <div className="bg-overlay" /> : null}
      <ErrorBoundary>
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* New routes — eagerly imported, so no Suspense boundary. */}
            <Route path="/about" element={<PageShell tone="about"><AboutPage /></PageShell>} />
            <Route path="/projects" element={<PageShell tone="projects"><ProjectsPage /></PageShell>} />
            <Route path="/projects/:slug" element={<PageShell><ProjectDetailPage /></PageShell>} />
            <Route path="/experience" element={<PageShell><ExperiencePage /></PageShell>} />
            <Route path="/research" element={<PageShell><ResearchPage /></PageShell>} />
            <Route path="/blog" element={<PageShell><BlogPage /></PageShell>} />
            <Route path="/blog/:slug" element={<PageShell><BlogPostPage /></PageShell>} />
            <Route path="/speaking" element={<PageShell><SpeakingPage /></PageShell>} />
            <Route path="/open-source" element={<PageShell><OpenSourcePage /></PageShell>} />
            <Route path="/contact" element={<PageShell><ContactPage /></PageShell>} />
            <Route path="/privacy" element={<PageShell><PrivacyPage /></PageShell>} />

            {/* Existing routes — code-split, so each carries its own boundary. */}
            <Route path="/resume" element={<Boundary><R.Resume /></Boundary>} />
            <Route path="/art" element={<Boundary><R.ArtPage /></Boundary>} />
            <Route path="/atriveo" element={<Boundary><R.AtriveoPage /></Boundary>} />
            <Route path="/admin/*" element={<Boundary><R.AdminApp /></Boundary>} />

            {/* /highlights (the index) retired to /projects — a 301 in
                public/_redirects handles it in production. The DETAIL pages
                stay: they are the live interactive demos, and the browse page
                links straight into them. */}
            <Route path="/highlights/:id" element={<Boundary><R.HighlightDetail /></Boundary>} />
            <Route path="/Highlights/:uuid" element={<Boundary><R.HighlightDetail /></Boundary>} />

            <Route path="*" element={<PageShell><NotFoundPage /></PageShell>} />
          </Routes>
        </main>
      </ErrorBoundary>
      {!isAdminRoute ? <Footer /> : null}
      {!isAdminRoute ? <CommandPalette /> : null}
    </>
  );
}
