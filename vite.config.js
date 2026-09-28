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
        name: "case-studies",
        // Rebuild the pages when their data changes during development.
        configureServer(server) {
          const data = [
            path.resolve("src/case-studies/data.js"),
            path.resolve("src/photography.js"),
            path.resolve("src/experience-pages.js"),
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
