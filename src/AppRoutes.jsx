import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import SiteHeader from './components/SiteHeader';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';

/**
 * Route table, deliberately free of any Router.
 *
 * The client wraps this in BrowserRouter (App.jsx); the prerenderer wraps it in
 * StaticRouter (entry-server.jsx). Keeping the router out of here is what lets
 * the identical tree render in both places.
 *
 * Splitting policy — this is a hydration correctness decision, not just a size
 * one. Content pages are imported eagerly: they are mostly static markup over
 * the data layer (a few KB each), and eager imports mean the prerendered HTML
 * hydrates in one pass with no Suspense flash and no layout shift. The heavy
 * legacy routes below — in-browser ML, dashboards, embeds — stay lazy because
 * they are hundreds of KB and are not the pages search traffic lands on.
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

const Resume = lazy(() => import('./Resume'));
const ArtPage = lazy(() => import('./pages/ArtPage'));
const AtriveoPage = lazy(() => import('./pages/AtriveoPage'));
const LegacyProjects = lazy(() => import('./Projects'));
const HighlightDetail = lazy(() => import('./HighlightDetail'));

/* Reserves vertical space while a chunk loads so the swap-in doesn't shift
   layout. aria-busy lets assistive tech announce the pending state. */
function RouteFallback() {
  return <div className="route-loading" aria-busy="true" style={{ minHeight: '60svh' }} />;
}

export default function AppRoutes() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <ErrorBoundary>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/speaking" element={<SpeakingPage />} />
              <Route path="/open-source" element={<OpenSourcePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              <Route path="/resume" element={<Resume />} />

              {/* Existing URLs kept live so nothing already indexed 404s. */}
              <Route path="/art" element={<ArtPage />} />
              <Route path="/atriveo" element={<AtriveoPage />} />
              <Route path="/highlights" element={<LegacyProjects />} />
              <Route path="/highlights/:id" element={<HighlightDetail />} />
              <Route path="/Highlights/:uuid" element={<HighlightDetail />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
      <CommandPalette />
    </>
  );
}
