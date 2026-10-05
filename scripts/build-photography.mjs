import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePhotographyImages } from "./generate-photography-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const escape = value => String(value).replace(/[&<>"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[character]);

export async function buildPhotography() {
  const { photographs, photographyPage: page, photoMarkup, photographyDeckSizes } = await import(
    `${pathToFileURL(path.join(root, "src/photography.js")).href}?t=${Date.now()}`,
  );
  await generatePhotographyImages(photographs, page);
  const home = await fs.readFile(path.join(root, "index.html"), "utf8");
  // Share the portfolio chrome without maintaining another copy of profile/contact details.
  const extract = expression => {
    const match = home.match(expression);
    if (!match) throw new Error(`Missing shared portfolio markup: ${expression}`);
    return match[0];
  };
  const masthead = extract(/<header class="masthead">[\s\S]*?<\/header>/)
    .replace(/<h1 class="eyebrow">([\s\S]*?)<\/h1>/, '<a href="/" class="eyebrow home-link">$1</a>');
  const footer = extract(/<footer class="site-footer">[\s\S]*?<\/footer>/);
  const navigation = extract(/<nav class="thumb-bar"[\s\S]*?<\/nav>/);
  const sheet = extract(/<dialog id="info-sheet"[\s\S]*?<\/dialog>/);
  const icons = [...home.matchAll(/<link[^>]+(?:rel="icon"|rel="apple-touch-icon")[^>]*>/g)].map(match => match[0]).join("\n");
  const cards = photographs.map((photo, index) => {
    const offset = index <= photographs.length / 2 ? index : index - photographs.length;
    const distance = Math.abs(offset);
    return `<a class="photo-page-card" href="${escape(photo.src)}" data-photo-index="${index}" data-near="${distance <= 4}" style="--offset:${offset};--distance:${distance};--turn:${Math.sign(offset) * -24}deg;z-index:${20 - distance}" aria-label="Photograph ${index + 1}: ${escape(photo.alt)}">
      ${photoMarkup(photo, { lazy: index !== 0, sizes: photographyDeckSizes, preview: true })}
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
  <script>
    document.documentElement.classList.add("photography-enhancing");
    window.photographyFallback = setTimeout(() => document.documentElement.classList.remove("photography-enhancing"), 6000);
  </script>
</head>
<body>
  <main class="portfolio photography-portfolio">
    ${masthead}
    <section class="photography-content" aria-labelledby="photography-title">
      <div class="photography-heading">
        <h1 id="photography-title">Photography</h1>
        <p>Things that made me stop and take a picture.</p>
      </div>
      <form class="exhibition-search" data-exhibition-search role="search" aria-label="Search the archive">
        <label class="visually-hidden" for="exhibition-input">Search the archive</label>
        <input id="exhibition-input" data-exhibition-input type="search" autocomplete="off" placeholder="Search the archive..." enterkeyhint="search" />
        <p class="exhibition-status" data-exhibition-status role="status" aria-live="polite"></p>
      </form>
      <div class="exhibition-stage" data-exhibition-stage hidden></div>
      <div class="photo-deck" id="photo-deck" aria-label="Photographs">
        ${cards}
      </div>
      <div class="photo-deck-controls carousel-controls">
        <button data-photo-previous aria-label="Previous photograph">←</button>
        <p class="photo-page-counter" aria-live="polite" aria-atomic="true"><span data-photo-current>01</span><span class="counter-rule"></span><span class="muted">16</span></p>
        <button data-photo-next aria-label="Next photograph">→</button>
        <button data-photo-motion aria-label="Pause automatic photo changes" aria-pressed="false">Ⅱ</button>
      </div>
    </section>
    ${footer}
    ${navigation}
  </main>
  ${sheet}
  <script type="module" src="/src/photography-page.js"></script>
  <script type="module" src="/src/photography-exhibition-init.js"></script>
</body>
</html>\n`;
  const file = path.join(root, "photography/index.html");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const existing = await fs.readFile(file, "utf8").catch(() => "");
  if (existing !== html) await fs.writeFile(file, html);
  return { photography: file };
}
