// Serves the production build for Lighthouse CI the way Cloudflare Pages does: clean URLs, the
// custom 404 page, Brotli or gzip for text (Cloudflare compresses it; uncompressed, the homepage
// HTML is about nine times larger than what visitors download), and fixtures for the Pages
// Functions the public pages call. A plain static
// server answers those APIs with a 404, which Lighthouse reports as a console error.
import http from "node:http";
import zlib from "node:zlib";
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

const compressible = new Set([".html", ".js", ".css", ".json", ".svg", ".xml", ".txt"]);

// Sends a body the way Cloudflare's edge does: Brotli when the client accepts it, else gzip.
function send(request, response, status, type, body) {
  const accepted = String(request.headers["accept-encoding"] ?? "");
  const headers = { "content-type": type, vary: "Accept-Encoding" };
  if (/\bbr\b/.test(accepted)) {
    body = zlib.brotliCompressSync(body);
    headers["content-encoding"] = "br";
  } else if (/\bgzip\b/.test(accepted)) {
    body = zlib.gzipSync(body);
    headers["content-encoding"] = "gzip";
  }
  response.writeHead(status, { ...headers, "content-length": body.length });
  response.end(body);
}

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
      send(request, response, 200, "application/json", fs.readFileSync(githubActivity));
      return;
    }
    if (pathname === "/api/photography/exhibition") {
      send(request, response, 200, "application/json", Buffer.from(exhibition));
      return;
    }
    const file = resolve(pathname) ?? path.join(dist, "404.html");
    const status = file.endsWith("404.html") ? 404 : 200;
    const type = types[path.extname(file)] ?? "application/octet-stream";
    if (compressible.has(path.extname(file))) {
      send(request, response, status, type, fs.readFileSync(file));
      return;
    }
    response.writeHead(status, { "content-type": type });
    fs.createReadStream(file).pipe(response);
  })
  .listen(port, "127.0.0.1", () => console.log(`Lighthouse server listening on http://127.0.0.1:${port}`));
