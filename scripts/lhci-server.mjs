// Serves the production build for Lighthouse CI the way Cloudflare Pages does: clean URLs, the
// custom 404 page, and fixtures for the Pages Functions the public pages call. A plain static
// server answers those APIs with a 404, which Lighthouse reports as a console error.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { photographs } from "../src/photography.js";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT ?? 4318);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

// What /api/photography/exhibition?all=1 returns before any uploads: the published collection.
const exhibition = JSON.stringify({
  collection: "all",
  photos: photographs.map(({ src, alt, width, height }) => ({ src, alt, width, height, tags: [] })),
});

const githubActivity = path.resolve(dist, "../src/github-activity.json");

function resolve(pathname) {
  const file = path.join(dist, decodeURIComponent(pathname));
  if (!file.startsWith(dist)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  const index = path.join(file, "index.html");
  return fs.existsSync(index) ? index : null;
}

http
  .createServer((request, response) => {
    const { pathname } = new URL(request.url, "http://localhost");
    // The live GitHub activity: the snapshot the build rendered, so the page keeps it as it is.
    if (pathname === "/api/github-activity") {
      response.writeHead(200, { "content-type": "application/json" });
      fs.createReadStream(githubActivity).pipe(response);
      return;
    }
    if (pathname === "/api/photography/exhibition") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(exhibition);
      return;
    }
    const file = resolve(pathname) ?? path.join(dist, "404.html");
    response.writeHead(file.endsWith("404.html") ? 404 : 200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
    });
    fs.createReadStream(file).pipe(response);
  })
  .listen(port, "127.0.0.1", () => console.log(`Lighthouse server listening on http://127.0.0.1:${port}`));
