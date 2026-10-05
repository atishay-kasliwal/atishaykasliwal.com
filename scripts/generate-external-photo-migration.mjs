// Writes migrations/0002_external_photos.sql from the existing photography list, so the current
// public gallery is preserved in D1 with its alt text. Photos keep their existing URLs
// (Pinterest or this site) and are marked origin = 'external' so they remain distinguishable
// from originals stored in R2. Run once: node scripts/generate-external-photo-migration.mjs
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { photographs } from "../src/photography.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "migrations/0002_external_photos.sql");
const quote = value => `'${String(value).replace(/'/g, "''")}'`;
const stamp = "2026-09-28T00:00:00.000Z";

const rows = photographs.map(photo => {
  const id = createHash("sha256").update(photo.src).digest("hex").slice(0, 24);
  const orientation = photo.width === photo.height ? "square" : photo.width > photo.height ? "landscape" : "portrait";
  return `INSERT OR IGNORE INTO photos (id, origin, status, hidden, alt, src, width, height, orientation, colors_json, uploaded_at, updated_at) VALUES (${[
    quote(id), quote("external"), quote("ready"), 0, quote(photo.alt), quote(photo.src), photo.width, photo.height, quote(orientation), quote("[]"), quote(stamp), quote(stamp),
  ].join(", ")});`;
});

fs.writeFileSync(file, [
  "-- Existing public gallery, imported once. origin = 'external' means the file is not in R2.",
  ...rows,
  "",
].join("\n"));
console.log(`wrote ${rows.length} rows to ${path.relative(root, file)}`);
