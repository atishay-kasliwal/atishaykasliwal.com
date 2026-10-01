import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vite";
import fs from "node:fs";
import { buildCaseStudies } from "./scripts/build-case-studies.mjs";
import { buildPhotography } from "./scripts/build-photography.mjs";
import { renderPhotographySeo } from "./scripts/photography-seo.mjs";
import { buildExperiencePages } from "./scripts/build-experience-pages.mjs";

// Appends the experience/education pages' <url> entries to the sitemap that
// buildCaseStudies() already wrote, rather than each script owning its own file.
function mergeExperienceSitemap(entries) {
  const file = path.resolve("public/sitemap.xml");
  const xml = fs.readFileSync(file, "utf8");
  if (!xml.includes("</urlset>")) return;
  fs.writeFileSync(file, `${xml.replace("</urlset>", `${entries}\n</urlset>`).trimEnd()}\n`);
}

// Each indexable document has its own emitted HTML file.
export default defineConfig(async () => {
  const pages = await buildCaseStudies();
  const photography = await buildPhotography();
  const experience = await buildExperiencePages();
  mergeExperienceSitemap(experience.sitemap);
  return {
    build: {
      rollupOptions: {
        input: { main: path.resolve("index.html"), ...pages, ...photography, ...experience.inputs },
      },
    },
    plugins: [
      {
        name: "photography-seo",
        transformIndexHtml: {
          order: "pre",
          async handler(html) {
            if (!html.includes("<!-- photography:metadata -->")) return html;
            const data = pathToFileURL(path.resolve("src/photography.js")).href;
            const { photographs, photographyPage } = await import(`${data}?t=${Date.now()}`);
            return renderPhotographySeo(html, photographs, photographyPage);
          },
        },
      },
      {
        // Prerender the work and experience carousels so their cards, and the links to
        // every project and experience page, are in the homepage HTML before JavaScript.
        name: "prerender-carousels",
        transformIndexHtml: {
          order: "pre",
          async handler(html) {
            const stamp = Date.now();
            const load = file => import(`${pathToFileURL(path.resolve(file)).href}?t=${stamp}`);
            const [{ renderCarouselTrack }, { projects }, { experience }] = await Promise.all([
              load("src/carousel-cards.js"),
              load("src/projects.js"),
              load("src/experience.js"),
            ]);
            const fill = (source, id, items, options) => {
              const empty = `<div class="carousel-track" id="${id}"></div>`;
              return source.replace(
                empty,
                `<div class="carousel-track" id="${id}" data-prerendered="true">${renderCarouselTrack(items, options)}</div>`,
              );
            };
            return fill(
              fill(html, "carousel-track", projects, { eagerFirst: true }),
              "experience-carousel-track",
              experience,
            );
          },
        },
      },
      {
        name: "case-studies",
        // Rebuild the pages when their data changes during development.
        configureServer(server) {
          const data = [
            path.resolve("src/case-studies/data.js"),
            path.resolve("src/photography.js"),
            path.resolve("src/experience-pages.js"),
            path.resolve("src/carousel-cards.js"),
            path.resolve("src/projects.js"),
            path.resolve("src/experience.js"),
            path.resolve("index.html"),
          ];
          server.watcher.add(data);
          server.watcher.on("change", async file => {
            if (!data.includes(file)) return;
            await buildCaseStudies();
            await buildPhotography();
            const experience = await buildExperiencePages();
            mergeExperienceSitemap(experience.sitemap);
            server.ws.send({ type: "full-reload" });
          });
        },
      },
    ],
  };
});
