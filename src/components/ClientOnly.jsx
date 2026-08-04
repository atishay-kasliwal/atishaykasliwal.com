import { useEffect, useState } from 'react';

/**
 * Renders children only in the browser.
 *
 * Prerendering (scripts/prerender.mjs) runs the app through
 * react-dom/server in Node, where there is no window, no canvas, no
 * WebGL, and no IndexedDB. Anything touching those — the in-browser LLM,
 * TensorFlow.js viewers, the Cal.com embed — goes inside this.
 *
 * `fallback` is what the crawler and the first paint actually see, so it should
 * be real, meaningful markup (a heading, a description, a link), not a spinner.
 * A spinner in the prerendered HTML is a blank page as far as Google is
 * concerned, and it causes a visible layout shift when the real thing mounts.
 * Give the fallback the same dimensions as the component it stands in for.
 */
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return typeof children === 'function' ? children() : children;
}

/** True during prerender / SSR. */
export const isServer = typeof window === 'undefined';
