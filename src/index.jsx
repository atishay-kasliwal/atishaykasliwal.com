import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
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
 * defeats the reuse this is built for.
 */
/**
 * Routes whose component is code-split. Hydration must not suspend on these.
 *
 * React.lazy suspends on its first render even when the chunk is cached, and a
 * suspended boundary during hydration makes React discard the prerendered DOM
 * and show the fallback instead — so a fully prerendered page would blank to an
 * empty `.route-loading` div and then jump back to full height.
 *
 * Loading the matching chunk BEFORE hydrating avoids that entirely: the static
 * HTML stays on screen the whole time, and hydration attaches to it in one pass
 * with no suspension. Only the chunk for the current route is fetched, so code
 * splitting is preserved — a visitor landing on /about still never downloads
 * the in-browser ML demos.
 */
const SPLIT_ROUTES = [
  [/^\/resume/i, 'Resume', () => import('./Resume')],
  [/^\/art/i, 'ArtPage', () => import('./pages/ArtPage')],
  [/^\/atriveo/i, 'AtriveoPage', () => import('./pages/AtriveoPage')],
  [/^\/highlights\/.+/i, 'HighlightDetail', () => import('./HighlightDetail')],
];

/*
 * Routes served through the SPA fallback rather than through their own
 * prerendered HTML. Mounting them fresh avoids hydrating homepage markup into a
 * different route when Cloudflare serves the root index.html as the fallback.
 */
const NON_PRERENDERED_PATTERNS = [
  /^\/admin(?:\/.*)?$/i,
  /^\/workspace(?:\/.*)?$/i,
  /^\/highlights\/.+/i,
];

async function preloadCurrentRoute() {
  const match = SPLIT_ROUTES.find(([re]) => re.test(window.location.pathname));
  if (!match) return undefined;
  const [, name, load] = match;
  try {
    return { [name]: (await load()).default };
  } catch {
    // Fall back to the lazy path rather than blocking the whole app on one chunk.
    return undefined;
  }
}

const shouldMountFresh =
  NON_PRERENDERED_PATTERNS.some((re) => re.test(window.location.pathname));

if (container.dataset.prerendered === 'true' && !shouldMountFresh) {
  preloadCurrentRoute().then((overrides) => {
    hydrateRoot(container, <App overrides={overrides} />);
  });
} else {
  createRoot(container).render(<App />);
}
