/**
 * Theme resolution.
 *
 * Must run before first paint, which is why it is called at the top of
 * index.jsx rather than from a component effect — setting the attribute after
 * React mounts produces a visible flash of the wrong theme.
 *
 * Precedence: explicit user choice → OS preference → dark.
 */

const KEY = 'ak-theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Safari private mode throws on localStorage access.
    return null;
  }
}

export function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme() {
  return getStoredTheme() || systemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0a0c0e');
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* non-fatal */
  }
  applyTheme(theme);
  return theme;
}

export function toggleTheme() {
  return setTheme(resolveTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  if (typeof document === 'undefined') return;
  applyTheme(resolveTheme());

  // Follow the OS only while the user has not made an explicit choice.
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: light)')
      .addEventListener('change', () => {
        if (!getStoredTheme()) applyTheme(systemTheme());
      });
  }
}
