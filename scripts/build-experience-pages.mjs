import { profileLinks } from "../src/profile-links.js";
// Renders every entry in src/experience-pages.js to experience/<slug>/index.html.
// Same visual system as scripts/build-case-studies.mjs (same case-study.css, same
// hero/tiles/thumbs markup), trimmed for a work/education entry: no stats-heavy
// engineering tiles, no problem/solution framing, and `links` is often empty.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://atishaykasliwal.com";
const PERSON = `${SITE}/#person`;

const escape = (value = "") =>
  String(value).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = n => String(n).padStart(2, "0");
const pageUrl = slug => `${SITE}/experience/${slug}/`;
const TEXT_ARROW = "↗︎";

function structuredData(entry) {
  const url = pageUrl(entry.slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: entry.seo.title,
        description: entry.seo.description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": PERSON },
        mainEntity: { "@id": PERSON },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        author: { "@id": PERSON },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Atishay Kasliwal", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: entry.name, item: url },
        ],
      },
      { "@type": "Person", "@id": PERSON, name: "Atishay Kasliwal", url: `${SITE}/`, sameAs: profileLinks },
    ],
  };
}

// The screen shows at most ~600px wide on desktop and the full content width on phones, so a
// 720px variant serves most visits; the original stays in the srcset for high-density screens.
const SCREEN_VARIANT_WIDTH = 720;
const SCREEN_SIZES = "(max-width: 700px) calc(100vw - 48px), 600px";

async function addScreenVariants(entry) {
  for (const item of entry.media.items) {
    if (!item.src.endsWith(".webp")) continue;
    const source = path.join(ROOT, "public", item.src);
    const { width } = await sharp(source).metadata();
    if (width <= SCREEN_VARIANT_WIDTH) continue;
    const variant = item.src.replace(/\.webp$/, `-${SCREEN_VARIANT_WIDTH}.webp`);
    const output = path.join(ROOT, "public", variant);
    const stale = !fs.existsSync(output) || fs.statSync(output).mtimeMs < fs.statSync(source).mtimeMs;
    if (stale) {
      await sharp(source).resize({ width: SCREEN_VARIANT_WIDTH }).webp({ quality: 82 }).toFile(output);
    }
    item.srcset = `${variant} ${SCREEN_VARIANT_WIDTH}w, ${item.src} ${width}w`;
  }
}

function render(entry, { number, total, next }) {
  const url = pageUrl(entry.slug);
  const [first] = entry.media.items;
  const primary = entry.links[0];
  const og = `${SITE}/experience/media/${entry.slug}/og.jpg`;

  const thumbs = entry.media.items
    .map(
      (item, i) => `
          <button class="thumb" type="button" aria-pressed="${i === 0}" data-src="${escape(item.src)}"${item.srcset ? ` data-srcset="${escape(item.srcset)}"` : ""} data-alt="${escape(item.alt)}">
            <span>${pad(i + 1)} / ${escape(item.label)}</span>
            <img src="${escape(item.thumb)}" alt="" width="360" height="222" loading="lazy" decoding="async" />
          </button>`,
    )
    .join("");

  const tiles = `<section class="tiles" aria-label="${escape(entry.name)} details">
${entry.sections
  .map(
    (section, i) => `          <article class="tile">
            <h2 class="eyebrow">${pad(i + 1)} · ${escape(section.title)}</h2>
            <p>${escape(section.body)}</p>
          </article>`,
  )
  .join("\n")}
        </section>`;

  const nextLink = next
    ? `<a href="/experience/${next.slug}/">Next: ${escape(next.name)} <b aria-hidden="true">→</b></a>`
    : `<a href="/">All work <b aria-hidden="true">→</b></a>`;

  const linksNav = entry.links
    .map((l, i) => `        <a class="thumb-button${i === 0 ? " primary" : ""}" href="${escape(l.href)}" target="_blank" rel="noreferrer">${escape(l.label)} ${TEXT_ARROW}</a>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111111" />
    <title>${escape(entry.seo.title)}</title>
    <meta name="description" content="${escape(entry.seo.description)}" />
    <meta name="author" content="Atishay Kasliwal" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Atishay Kasliwal" />
    <meta property="og:title" content="${escape(entry.seo.title)}" />
    <meta property="og:description" content="${escape(entry.seo.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(entry.seo.title)}" />
    <meta name="twitter:description" content="${escape(entry.seo.description)}" />
    <meta name="twitter:image" content="${og}" />
    <script type="application/ld+json">
${JSON.stringify(structuredData(entry), null, 2)}
    </script>
    <script type="module" src="/src/case-study.js"></script>
    <link rel="stylesheet" href="/src/case-study.css" />
  </head>
  <body>
    <div class="wrap">
      <nav class="topbar" aria-label="Experience navigation">
        <a href="/"><span aria-hidden="true">←</span> All work</a>
        <span><span class="m-hide">${escape(entry.kicker)} </span>${pad(number)} / ${pad(total)}</span>
        ${nextLink}
      </nav>

      <main class="content">
        <section class="hero">
          <div class="story">
            <h1>
              <span class="eyebrow">${escape(entry.kicker)}</span>
              ${escape(entry.headline)} <span class="soft">${escape(entry.headlineSoft)}</span>
            </h1>
            <p class="lede">${escape(entry.lede)}</p>
            <dl class="spec">
${entry.spec.map(row => `              <div><dt>${escape(row.label)}</dt><dd>${row.html}</dd></div>`).join("\n")}
            </dl>
            ${entry.stats.length
              ? `<ul class="stats">
${entry.stats.map(s => `              <li><b>${escape(s.value)}</b><span>${escape(s.label)}</span></li>`).join("\n")}
            </ul>`
              : ""}
          </div>

          <div class="media-col">
            <figure class="window">
              <div class="window-bar">
                <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
                <p class="window-title">${escape(entry.name)}</p>
                ${primary ? `<div class="window-end"><a class="pill" href="${escape(primary.href)}" target="_blank" rel="noreferrer">${escape(primary.label)} <b aria-hidden="true">${TEXT_ARROW}</b></a></div>` : ""}
              </div>
              <div class="screen" id="screen" data-no-video>
                <img id="screen-img" src="${escape(first.src)}"${first.srcset ? ` srcset="${escape(first.srcset)}" sizes="${SCREEN_SIZES}"` : ""} alt="${escape(first.alt)}" width="1080" height="664" fetchpriority="high" />
              </div>
            </figure>
            <div class="thumbs" role="group" aria-label="Photos">${thumbs}
            </div>
          </div>
        </section>

        ${tiles}
      </main>

      <nav class="thumb-bar" aria-label="${escape(entry.name)} links">
${linksNav}
        <a class="thumb-button go-next" href="${next ? `/experience/${next.slug}/` : "/"}" aria-label="${next ? `Next: ${escape(next.name)}` : "All work"}">→</a>
      </nav>

      <footer class="site-footer">
        <span>© ${new Date().getFullYear()} Atishay Kasliwal</span>
        <a href="/">atishaykasliwal.com <b aria-hidden="true">${TEXT_ARROW}</b></a>
      </footer>
    </div>
  </body>
</html>
`;
}

function sitemapEntries(entries) {
  return entries
    .map(entry => {
      const images = entry.media.items
        .map(item => `    <image:image>\n      <image:loc>${escape(new URL(item.src, SITE).href)}</image:loc>\n    </image:image>\n`)
        .join("");
      return `  <url>\n    <loc>${pageUrl(entry.slug)}</loc>\n${images}  </url>`;
    })
    .join("\n");
}

export async function buildExperiencePages() {
  const stamp = Date.now();
  const { experiencePages } = await import(`${pathToFileURL(path.join(ROOT, "src/experience-pages.js")).href}?t=${stamp}`);
  const slugs = new Set(experiencePages.map(e => e.slug));
  if (slugs.size !== experiencePages.length) {
    throw new Error("Experience page slugs must be unique.");
  }
  const outDir = path.join(ROOT, "experience");
  fs.rmSync(outDir, { recursive: true, force: true });
  const inputs = {};
  for (const entry of experiencePages) await addScreenVariants(entry);
  experiencePages.forEach((entry, i) => {
    const next = experiencePages.length > 1 ? experiencePages[(i + 1) % experiencePages.length] : null;
    const html = render(entry, { number: i + 1, total: experiencePages.length, next });
    const file = path.join(outDir, entry.slug, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    inputs[`experience-${entry.slug}`] = file;
  });
  return { inputs, sitemap: sitemapEntries(experiencePages) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { inputs } = await buildExperiencePages();
  console.log(`Built ${Object.keys(inputs).length} experience page(s): ${Object.keys(inputs).join(", ")}`);
}
