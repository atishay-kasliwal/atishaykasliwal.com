import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
/* tokens.css only declares custom properties on :root plus a reduced-motion
   block — it defines no appearance on its own, so it is safe globally and the
   existing design is untouched by it. base.css and patterns.css are NOT loaded
   here: they carry global element resets that would restyle the current site.
   They are scoped to the new routes instead, via styles/page-scope.css. */
import './styles/tokens.css';
import './styles/a11y.css';
import './App.css';
import { initAnalytics } from './lib/analytics';
import AppRoutes from './AppRoutes';

/**
 * Resets scroll on navigation and moves focus to <main>.
 *
 * The focus move is the part that matters for accessibility: without it a
 * keyboard or screen-reader user stays parked wherever the previous page left
 * them, so a "navigation" is silent and their next Tab continues from the old
 * position. preventScroll stops focusing from fighting the scroll reset.
 */
function RouteChangeEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}

function AnalyticsTracker() {
  useEffect(() => initAnalytics(), []);
  return null;
}

export default function App() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <Router>
      <RouteChangeEffects />
      <AnalyticsTracker />
      <AppRoutes />
    </Router>
  );
}
