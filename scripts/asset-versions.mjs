// Fingerprints the project card and screen images so their URLs change whenever the file does.
// /projects/cards/* is cached for a day with a week of stale-while-revalidate (public/_headers), so
// replacing an image under the same name left browsers and Cloudflare's edge showing the old one.
// src/projects.js appends ?v=<hash> from src/asset-versions.json. Runs before every build.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versions = {};
for (const dir of ["cards", "screens"]) {
  const full = path.join(root, "public", "projects", dir);
  if (!fs.existsSync(full)) continue;
  for (const name of fs.readdirSync(full).sort()) {
    if (!/\.(webp|png|jpe?g|avif)$/.test(name)) continue;
    versions[`${dir}/${name}`] = crypto.createHash("sha256").update(fs.readFileSync(path.join(full, name))).digest("hex").slice(0, 8);
  }
}
const out = path.join(root, "src", "asset-versions.json");
const next = `${JSON.stringify(versions, null, 2)}\n`;
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== next) fs.writeFileSync(out, next);
console.log(`Asset versions: ${Object.keys(versions).length} images fingerprinted.`);
