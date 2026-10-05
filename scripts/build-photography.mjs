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
  <meta name="twitter:title" content="${escape(page.title)}" />
  <meta name="twitter:description" content="${escape(page.description)}" />
  <meta name="twitter:image" content="${social}" />
  <!-- photography:metadata -->
  <link rel="stylesheet" href="/src/style.css" />
  <link rel="stylesheet" href="/src/photography-page.css" />
</head>
<body>
  <main class="portfolio photography-portfolio">
    <header class="photography-header">
      <div class="photography-header-left">
        <a href="/" class="home-link">← Back</a>
        <time class="photography-clock" data-photography-clock aria-label="Current time in New York" title="New York time"></time>
      </div>
      <nav class="photography-socials" aria-label="Social links">
        <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer">GitHub ↗︎</a>
        <a href="https://www.linkedin.com/in/atishay-kasliwal" target="_blank" rel="noopener noreferrer">LinkedIn ↗︎</a>
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
  <script type="module" src="/src/photography-page.js"></script>
</body>
</html>\n`;
  const file = path.join(root, "photography/index.html");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const existing = await fs.readFile(file, "utf8").catch(() => "");
  if (existing !== html) await fs.writeFile(file, html);
  return { photography: file };
}
