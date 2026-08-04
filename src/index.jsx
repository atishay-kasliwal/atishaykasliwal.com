import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initTheme } from './lib/theme';

initTheme();

const container = document.getElementById('root');

/**
 * Hydrate when the route was prerendered, mount fresh otherwise.
 *
 * scripts/prerender.mjs stamps data-prerendered on #root for every route it
 * successfully rendered. Hydrating those reuses the existing DOM instead of
 * throwing it away and rebuilding, which is what keeps LCP tied to the static
 * HTML rather than to when React finishes booting. Routes that fell back to
 * head-only output are mounted normally.
 *
 * StrictMode is intentionally not used around hydration — its double-invoke
 * defeats the reuse this is built for. It stays on in dev via vite's HMR entry.
 */
if (container.dataset.prerendered === 'true') {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
