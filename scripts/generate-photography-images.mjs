import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { photographs, photoVariants, photographyPage } from "../src/photography.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function createIfStale(source, destination, render) {
  const original = await fs.stat(source);
  const output = await fs.stat(destination).catch(() => null);
  if (output && output.mtimeMs >= original.mtimeMs) return;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await render(sharp(source)).toFile(destination);
}
export async function generatePhotographyImages(photos = photographs, page = photographyPage) {
  for (const photo of photos) {
    // No network access: only the declared local originals are opened.
    if (!photo.src.startsWith("/photography/")) continue;
    const source = path.join(root, "public", photo.src);
    for (const variant of photoVariants(photo)) {
      await createIfStale(source, path.join(root, "public", variant.src), image =>
        image.resize({ width: variant.width, withoutEnlargement: true }).webp({ quality: 82 }),
      );
    }
  }
  const skyline = photos.find(photo => photo.src === "/photography/manhattan-skyline-at-dusk.jpg");
  await createIfStale(path.join(root, "public", skyline.src), path.join(root, "public", page.socialImage), image =>
    image.resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }),
  );
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generatePhotographyImages();
  console.log("Photography derivatives ready; originals and external URLs unchanged.");
}
