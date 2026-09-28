import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const variants = [
  ...["clip-a", "clip-b"].map(name => ({ source: `public/projects/media/atriveo-reel/${name}.webp`, widths: [480, 960] })),
  ...["bio", "cortex", "fedtalk", "insurance", "jobs", "tracker"].map(name => ({ source: `public/projects/cards/${name}.webp`, widths: [640] })),
  { source: "public/projects/media/bayesian-mmm/actual_vs_predicted.webp", widths: [480, 960] },
  { source: "public/atishay-kasliwal.jpg", widths: [256, 512] },
];

for (const { source: relativeSource, widths } of variants) {
  const source = path.join(root, relativeSource);
  const extension = path.extname(source);
  const base = source.slice(0, -extension.length);
  for (const width of widths) {
    const output = `${base}-${width}.webp`;
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(output);
    console.log(`${path.relative(root, output)}: ${fs.statSync(output).size} bytes`);
  }
}