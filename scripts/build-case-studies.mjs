import { profileLinks } from "../src/profile-links.js";
// Renders every project page to projects/<slug>/index.html as prerendered HTML. Also writes
// public/sitemap.xml and the share-card sources in scripts/og/.
// Runs from vite.config.js on every dev start and build; the generated files are not committed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://atishaykasliwal.com";
const PERSON = `${SITE}/#person`;
// The full Person entity, kept in sync with the one in index.html by hand. Most project pages
// only need the minimal stub below; the ProfilePage (Beyond the Resume) gets this full version
// so Google finds the complete entity on that page too, not only the homepage.
const PERSON_ENTITY = {
  "@type": "Person",
  "@id": PERSON,
  name: "Atishay Kasliwal",
  url: `${SITE}/`,
  image: [`${SITE}/atishay-kasliwal-1x1.jpg`, `${SITE}/atishay-kasliwal-4x3.jpg`, `${SITE}/atishay-kasliwal-16x9.jpg`],
  jobTitle: "Software & AI Engineer",
  description:
    "Full-stack and AI engineer with 5+ years in production, building distributed systems, LLM products and the interfaces on top of them.",
  sameAs: profileLinks,
};

const escape = (value = "") =>
  String(value).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = n => String(n).padStart(2, "0");
const pageUrl = slug => `${SITE}/projects/${slug}/`;
const exists = publicPath => fs.existsSync(path.join(ROOT, "public", publicPath));
const TEXT_ARROW = "↗︎";

function structuredData(study, image) {
  const url = pageUrl(study.slug);
  const project = {
    "@id": `${url}#project`,
    name: study.name,
    description: study.seo.description,
    image: `${SITE}${study.media.items[0].src}`,
    author: { "@id": PERSON },
    creator: { "@id": PERSON },
    ...(study.started ? { dateCreated: study.started } : {}),
    mainEntityOfPage: { "@id": `${url}#webpage` },
  };
  if (study.live) {
    Object.assign(project, {
      "@type": "SoftwareApplication",
      url: study.links[0].href,
      applicationCategory: study.seo.category,
      operatingSystem: study.seo.platforms,
      sameAs: study.links.filter(l => l.href.includes("github.com")).map(l => l.href),
    });
  } else {
    Object.assign(project, {
      "@type": study.schemaType ?? "SoftwareSourceCode",
      url: study.links[0].href,
    });
    if (project["@type"] === "SoftwareSourceCode") {
      project.codeRepository = study.links[0].href;
      if (study.seo.language) project.programmingLanguage = study.seo.language;
    }
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        // A page built around one project stays a WebPage whose mainEntity is that project;
        // a page built around the person themselves (currently just Beyond the Resume) is
        // typed ProfilePage instead, with mainEntity pointing at the Person, per Google's
        // ProfilePage guidance.
        "@type": study.isProfilePage ? "ProfilePage" : "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: study.seo.title,
        description: study.seo.description,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${url}#project` },
        mainEntity: { "@id": study.isProfilePage ? PERSON : `${url}#project` },
        primaryImageOfPage: { "@type": "ImageObject", url: image },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        author: { "@id": PERSON },
        ...(study.lastModified ? { dateModified: study.lastModified } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Atishay Kasliwal", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: study.name, item: url },
        ],
      },
      project,
      study.isProfilePage ? PERSON_ENTITY : { "@type": "Person", "@id": PERSON, name: "Atishay Kasliwal", url: `${SITE}/`, sameAs: profileLinks },
    ],
  };
}

function render(study, { number, total, next }) {
  const url = pageUrl(study.slug);
  const og = exists(`projects/media/${study.slug}/og.jpg`) ? `${SITE}/projects/media/${study.slug}/og.jpg` : `${SITE}/og.jpg`;
  const [first] = study.media.items;
  const primary = study.links[0];
  const hasVideo = Boolean(study.media.video);

  const thumbs = study.media.items
    .map(
      (item, i) => `
          <button class="thumb" type="button" aria-pressed="${i === 0}" data-src="${escape(item.src)}" data-alt="${escape(item.alt)}"${item.video ? " data-video" : ""}>
            <span>${pad(i + 1)} / ${escape(item.label)}</span>
            <img src="${escape(item.thumb)}" alt="" width="360" height="222" loading="lazy" decoding="async" />
          </button>`,
    )
    .join("");

  const nodes = (study.engineering?.nodes ?? [])
    .map((row, r) => {
      const cells = row.map(n => `<div class="node">${escape(n.name)}<small>${escape(n.detail)}</small></div>`);
      return r === 0
        ? cells.join('<span class="to" aria-hidden="true">→</span>')
        : `<div class="under">${cells.join("")}</div>`;
    })
    .join("\n            ");

  const insight = study.note
    ? `<section class="insight">
          <h2 class="eyebrow">${escape(study.note.label ?? "Engineering note")}</h2>
          <p class="note">${escape(study.note.strong)} <span class="soft">${escape(study.note.soft)}</span></p>
          <p>${escape(study.note.body)}</p>
        </section>`
    : "";

  const tiles = study.sections
    ? `<section class="tiles" aria-label="${escape(study.name)} project details">
${study.sections
  .map(
    (section, i) => `          <article class="tile">
            <h2 class="eyebrow">${pad(i + 1)} · ${escape(section.title)}</h2>
            <p>${escape(section.body)}</p>
          </article>`,
  )
  .join("\n")}
        </section>

        ${insight}`
    : `<section class="tiles" aria-label="Case study">
          <article class="tile">
            <h2 class="eyebrow">01 · Problem</h2>
            <p class="tile-title">${escape(study.problem.title)}</p>
            <p>${escape(study.problem.body)}</p>
          </article>
          <article class="tile">
            <h2 class="eyebrow">02 · Solution</h2>
            <p class="tile-title">${escape(study.solution.title)}</p>
            <p>${escape(study.solution.body)}</p>
          </article>
          <article class="tile">
            <h2 class="eyebrow">03 · Engineering</h2>
            <div class="diagram" role="img" aria-label="${escape(
              study.engineering.nodes.map(row => row.map(n => `${n.name} (${n.detail})`).join(", ")).join("; "),
            )}">
            ${nodes}
            </div>
            <p>${escape(study.engineering.note)}</p>
          </article>
          <article class="tile">
            <h2 class="eyebrow">04 · Key decisions</h2>
            <ul class="checks">
${study.decisions.map(d => `              <li><span>${d}</span></li>`).join("\n")}
            </ul>
          </article>
        </section>

        ${insight}`;

  const nextLink = next
    ? `<a href="/projects/${next.slug}/">Next: ${escape(next.name)} <b aria-hidden="true">→</b></a>`
    : `<a href="/">All work <b aria-hidden="true">→</b></a>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111111" />
    <title>${escape(study.seo.title)}</title>
    <meta name="description" content="${escape(study.seo.description)}" />
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
    <meta property="og:title" content="${escape(study.seo.title)}" />
    <meta property="og:description" content="${escape(study.seo.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${og}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escape(`${study.name}: ${study.headline}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@AtishayKasliwal" />
    <meta name="twitter:creator" content="@AtishayKasliwal" />
    <meta name="twitter:title" content="${escape(study.seo.title)}" />
    <meta name="twitter:description" content="${escape(study.seo.description)}" />
    <meta name="twitter:image" content="${og}" />
    <script type="application/ld+json">
${JSON.stringify(structuredData(study, og), null, 2)}
    </script>
    <script type="module" src="/src/case-study.js"></script>
  </head>
  <body>
    <div class="wrap">
      <nav class="topbar" aria-label="Project navigation">
        <a href="/"><span aria-hidden="true">←</span> All work</a>
        <span><span class="m-hide">${escape(study.kicker ?? "Project")} </span>${pad(number)} / ${pad(total)}</span>
        ${nextLink}
      </nav>

      <main class="content">
        <section class="hero">
          <div class="story">
            <h1>
              <span class="eyebrow">${escape(study.name)}</span>
              ${escape(study.headline)} <span class="soft">${escape(study.headlineSoft)}</span>
            </h1>
            <p class="lede">${escape(study.lede)}</p>
            <dl class="spec">
${study.spec.map(row => `              <div><dt>${escape(row.label)}</dt><dd>${row.html}</dd></div>`).join("\n")}
            </dl>
            ${study.stats.length
              ? `<ul class="stats">
${study.stats.map(s => `              <li><b>${escape(s.value)}</b><span>${escape(s.label)}</span></li>`).join("\n")}
            </ul>`
              : ""}
          </div>

          <div class="media-col">
            <figure class="window">
              <div class="window-bar">
                <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
                <p class="window-title">${escape(study.name)}</p>
                <div class="window-end"><span>${escape(study.windowStack)}</span><a class="pill" href="${escape(primary.href)}">${escape(primary.label)} <b aria-hidden="true">${TEXT_ARROW}</b></a></div>
              </div>
              <div class="screen" id="screen"${hasVideo ? ' tabindex="0" role="button" aria-label="Play the screen recording"' : ""}${first.video ? "" : ' data-no-video'}>
                <img id="screen-img" src="${escape(first.src)}" alt="${escape(first.alt)}" width="1080" height="664" fetchpriority="high" />
                ${hasVideo ? `<video id="screen-video" data-src="${escape(study.media.video)}" muted loop playsinline preload="none" aria-hidden="true"></video>
                <span class="hint" aria-hidden="true">Hover to play</span>` : ""}
              </div>
            </figure>
            <div class="thumbs" role="group" aria-label="Screens">${thumbs}${
              study.media.note ? `\n            <p class="thumbs-note">${escape(study.media.note)}</p>` : ""
            }
            </div>
          </div>
        </section>

        ${tiles}
      </main>

      <nav class="thumb-bar" aria-label="${escape(study.name)} links">
${study.links
  .map((l, i) => `        <a class="thumb-button${i === 0 ? " primary" : ""}" href="${escape(l.href)}">${escape(l.label)} ${TEXT_ARROW}</a>`)
  .join("\n")}
        <a class="thumb-button go-next" href="${next ? `/projects/${next.slug}/` : "/"}" aria-label="${next ? `Next project: ${escape(next.name)}` : "All work"}">→</a>
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

function sitemap(studies, staticPageLastModified, photographs, photographyPage) {
  const entry = (loc, images = [], lastModified) =>
    `  <url>\n    <loc>${loc}</loc>\n${lastModified ? `    <lastmod>${lastModified}</lastmod>\n` : ""}${images
      .map(src => `    <image:image>\n      <image:loc>${escape(new URL(src, SITE).href)}</image:loc>\n    </image:image>\n`)
      .join("")}  </url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[
  entry(
    `${SITE}/`,
    ["/atishay-kasliwal.jpg", "/atishay-kasliwal-1x1.jpg", "/atishay-kasliwal-4x3.jpg", "/atishay-kasliwal-16x9.jpg"],
    staticPageLastModified.homepage,
  ),
  entry(`${SITE}/Atishay-Kasliwal-Resume.pdf`, [], staticPageLastModified.resume),
  entry(photographyPage.url, photographs.map(photo => photo.src), photographyPage.lastModified),
  ...studies.map(s => entry(pageUrl(s.slug), s.media.items.map(i => i.src), s.lastModified)),
].join("\n")}
</urlset>
`;
}

// Share card source for scripts/render_og.py: name and headline beside the carousel card.
function ogSource(study) {
  const card = study.media.items[0].src;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${escape(study.name)} share card</title><style>
  @font-face { font-family: Geist; src: url("../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; }
  @font-face { font-family: "Geist Mono"; src: url("../../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; }
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #111; color: #efefec; font-family: Geist, sans-serif; -webkit-font-smoothing: antialiased; }
  .label { position: absolute; left: 64px; top: 58px; display: flex; align-items: center; gap: 12px; font: 17px "Geist Mono", monospace; letter-spacing: 0.08em; text-transform: uppercase; color: #848480; }
  .label::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #8554ff; }
  h1 { position: absolute; left: 64px; top: 118px; width: 470px; margin: 0; font-size: 50px; font-weight: 450; line-height: 1.1; letter-spacing: -0.04em; }
  h1 span { color: #969692; }
  .card { position: absolute; right: 56px; top: 118px; width: 560px; height: 344px; object-fit: cover; border-radius: 8px; box-shadow: 0 0 0 1px #3a3a36, 0 30px 80px #000c; }
  .foot { position: absolute; left: 64px; right: 64px; bottom: 44px; display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #2a2a27; font: 16px "Geist Mono", monospace; color: #848480; }
  .foot b { color: #8554ff; font-weight: 400; }
</style></head><body>
  <p class="label">${escape(study.kicker ?? "Case study")} · ${escape(study.name)}</p>
  <h1>${escape(study.headline)} <span>${escape(study.headlineSoft)}</span></h1>
  <img class="card" src="../../public${card}" alt="" />
  <div class="foot"><span>Atishay Kasliwal</span><span>atishaykasliwal.com/projects/${study.slug} <b>↗</b></span></div>
</body></html>
`;
}

export async function buildCaseStudies() {
  const stamp = Date.now();
  const { caseStudies, additionalProjectPages, staticPageLastModified } = await import(`${pathToFileURL(path.join(ROOT, "src/case-studies/data.js")).href}?t=${stamp}`);
  const { projects } = await import(`${pathToFileURL(path.join(ROOT, "src/projects.js")).href}?t=${stamp}`);
  const { photographs, photographyPage } = await import(`${pathToFileURL(path.join(ROOT, "src/photography.js")).href}?t=${stamp}`);
  const order = projects.map(p => p.name);
  const pageNames = new Set(caseStudies.map(study => study.name));
  const additionalStudies = additionalProjectPages.map(page => {
    const project = projects.find(item => item.name === page.name);
    if (!project?.url || !project.poster) {
      throw new Error(`Project page ${page.name} has no matching project URL or preview image.`);
    }
    pageNames.add(page.name);
    const isGitHub = new URL(project.url).hostname === "github.com";
    return {
      ...page,
      live: false,
      lede: project.description,
      spec: [
        { label: "Stack", html: `<b>${escape(project.stack)}</b>` },
        {
          label: "Source",
          html: `<b>Open source</b> · <a href="${escape(project.url)}">GitHub <span class="arrow">${TEXT_ARROW}</span></a>`,
        },
      ],
      stats: [],
      windowStack: project.stack,
      links: [{ label: isGitHub ? "View code" : "Open site", href: project.url }],
      media: {
        video: project.video,
        items: [
          {
            label: "Project preview",
            src: project.poster,
            thumb: project.poster,
            alt: page.alt,
            video: Boolean(project.video),
          },
        ],
      },
    };
  });
  const missingPages = order.filter(name => !pageNames.has(name));
  if (missingPages.length) {
    throw new Error(`Missing project pages for: ${missingPages.join(", ")}`);
  }
  if (pageNames.size !== caseStudies.length + additionalProjectPages.length) {
    throw new Error("Project page names must be unique.");
  }
  const studies = [...caseStudies, ...additionalStudies].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const outDir = path.join(ROOT, "projects");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(ROOT, "scripts/og"), { recursive: true });
  const inputs = {};
  const originalPages = studies.filter(study => caseStudies.some(original => original.name === study.name));
  const supplementalPages = studies.filter(study => !caseStudies.some(original => original.name === study.name));
  studies.forEach(study => {
    const group = caseStudies.some(original => original.name === study.name) ? originalPages : supplementalPages;
    const position = group.findIndex(item => item.name === study.name);
    const next = group.length > 1 ? group[(position + 1) % group.length] : null;
    const html = render(study, { number: order.indexOf(study.name) + 1, total: order.length, next });
    const file = path.join(outDir, study.slug, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    fs.writeFileSync(path.join(ROOT, "scripts/og", `${study.slug}.html`), ogSource(study));
    inputs[study.slug] = file;
  });
  fs.writeFileSync(path.join(ROOT, "public/sitemap.xml"), sitemap(studies, staticPageLastModified, photographs, photographyPage));
  return inputs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inputs = await buildCaseStudies();
  console.log(`Built ${Object.keys(inputs).length} case study page(s): ${Object.keys(inputs).join(", ")}`);
}
