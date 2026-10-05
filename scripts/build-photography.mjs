import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePhotographyImages } from "./generate-photography-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const escape = value => String(value).replace(/[&<>"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[character]);

export async function buildPhotography() {
  const { photographs, photographyPage: page, photoMarkup } = await import(
    `${pathToFileURL(path.join(root, "src/photography.js")).href}?t=${Date.now()}`,
  );
  await generatePhotographyImages(photographs, page);
  const home = await fs.readFile(path.join(root, "index.html"), "utf8");
  // Share the portfolio footer while keeping the gallery header minimal.
  const extract = expression => {
    const match = home.match(expression);
    if (!match) throw new Error(`Missing shared portfolio markup: ${expression}`);
    return match[0];
  };
  const footer = extract(/<footer class="site-footer">[\s\S]*?<\/footer>/);
  const icons = [...home.matchAll(/<link[^>]+(?:rel="icon"|rel="apple-touch-icon")[^>]*>/g)].map(match => match[0]).join("\n");
  const initial = Math.floor(photographs.length / 2);
  const cards = photographs.map((photo, index) => {
    const offset = index - initial;
    const side = Math.sign(offset);
    return `<a class="photo-page-card${index === initial ? ' is-selected' : ''}" href="${escape(photo.src)}" data-photo-index="${index}" style="--offset:${offset};--side:${side};--depth:${Math.abs(offset)};z-index:${index === initial ? 100 : 50 - index}" aria-label="${escape(photo.alt)}">
      ${photoMarkup(photo, { lazy: index !== initial, sizes: '(max-width: 700px) 72vw, (min-width: 1600px) 480px, 30vw', preview: true })}
    </a>`;
  }).join("\n");
  const social = new URL(page.socialImage, page.url).href;
  const html = `<!doctype html>
<html lang="en" data-photography-page>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#111111" />
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}" />
  <link rel="canonical" href="${page.url}" />
  ${icons}
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Atishay Kasliwal" />
  <meta property="og:title" content="${escape(page.title)}" />
  <meta property="og:description" content="${escape(page.description)}" />
  <meta property="og:url" content="${page.url}" />
  <meta property="og:image" content="${social}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="900" />
  <meta property="og:image:alt" content="${escape(photographs[1].alt)}" />
  <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@AtishayKasliwal" />
    <meta name="twitter:creator" content="@AtishayKasliwal" />
  <meta name="twitter:title" content="${escape(page.title)}" />
  <meta name="twitter:description" content="${escape(page.description)}" />
  <meta name="twitter:image" content="${social}" />
  <!-- photography:metadata -->
  <link rel="stylesheet" href="/src/style.css" />
  <link rel="stylesheet" href="/src/photography-page.css" />
</head>
<body>
  <div class="gallery-atmosphere" aria-hidden="true">
    <span class="gallery-light gallery-light-warm"></span>
    <span class="gallery-light gallery-light-cool"></span>
    <span class="gallery-grain"></span>
  </div>
  <main class="portfolio photography-portfolio">
    <header class="photography-header">
      <div class="photography-header-left">
        <a href="/" class="home-link">← Back</a>
        <time class="photography-clock" data-photography-clock aria-label="Current time in New York" title="New York time"></time>
      </div>
      <nav class="photography-socials social-logos" aria-label="Social links">
<a class="social-logo" href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg></a>
<a class="social-logo" href="https://www.linkedin.com/in/atishay-kasliwal" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg></a>
<a class="social-logo" href="https://www.instagram.com/atishay_kasliwal/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
<a class="social-logo" href="https://x.com/AtishayKasliwal" target="_blank" rel="noopener noreferrer" aria-label="X" title="X"><svg aria-hidden="true" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg></a>
<a class="social-logo" href="https://www.threads.net/@atishay_kasliwal" target="_blank" rel="noopener noreferrer" aria-label="Threads" title="Threads"><svg aria-hidden="true" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/></svg></a>
<a class="social-logo" href="https://www.facebook.com/atishay.kasliwal" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook"><svg aria-hidden="true" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></a>
      </nav>
    </header>
    <section class="photography-content" aria-labelledby="photography-title">
      <h1 id="photography-title" class="visually-hidden">Photography</h1>
      <div class="photo-canvas" id="photo-deck" data-photo-canvas aria-label="Photographs" tabindex="0" aria-describedby="stack-help">
        ${cards}
      </div>
      <div class="stack-navigation">
        <p id="stack-help">Scroll or drag to explore</p>
        <div class="stack-controls">
          <button data-stack-previous aria-label="Previous photograph">←</button>
          <p data-stack-counter aria-live="polite" aria-atomic="true">${String(initial + 1).padStart(2, '0')} / ${String(photographs.length).padStart(2, '0')}</p>
          <button data-stack-next aria-label="Next photograph">→</button>
        </div>
      </div>
    </section>
    ${footer}
  </main>
  <dialog class="photo-viewer" data-photo-viewer aria-label="Photograph viewer">
    <button class="viewer-close" data-close-viewer aria-label="Close photograph">Close ×</button>
    <button class="viewer-previous" data-previous-photo aria-label="Previous photograph">←</button>
    <div class="viewer-media" data-viewer-media></div>
    <button class="viewer-next" data-next-photo aria-label="Next photograph">→</button>
    <p data-viewer-caption class="visually-hidden" aria-live="polite"></p>
  </dialog>
  <details class="photo-categories" data-photo-categories hidden>
    <summary>Categories</summary>
    <nav data-photo-filters aria-label="Filter photographs by category"></nav>
  </details>
  <script type="module" src="/src/photography-page.js"></script>
</body>
</html>\n`;
  const file = path.join(root, "photography/index.html");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const existing = await fs.readFile(file, "utf8").catch(() => "");
  if (existing !== html) await fs.writeFile(file, html);
  return { photography: file };
}
