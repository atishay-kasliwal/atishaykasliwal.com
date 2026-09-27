import path from "node:path";
import { defineConfig } from "vite";
import { buildCaseStudies } from "./scripts/build-case-studies.mjs";

// The homepage plus one prerendered page per case study (projects/<slug>/index.html).
export default defineConfig(async () => {
  const pages = await buildCaseStudies();
  return {
    build: {
      rollupOptions: {
        input: { main: path.resolve("index.html"), ...pages },
      },
    },
    plugins: [
      {
        name: "case-studies",
        // Rebuild the pages when their data changes during development.
        configureServer(server) {
          const data = path.resolve("src/case-studies/data.js");
          server.watcher.add(data);
          server.watcher.on("change", async file => {
            if (file !== data) return;
            await buildCaseStudies();
            server.ws.send({ type: "full-reload" });
          });
        },
      },
    ],
  };
});
