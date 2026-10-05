import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseFragment } from "parse5";
import sharp from "sharp";
import { photographs, photographyPage, photoVariants } from "../src/photography.js";

const attribute = (node, name) => node?.attrs?.find(item => item.name === name)?.value;
function elementsIn(node) {
  return [node, ...(node.childNodes ?? []).flatMap(elementsIn)];
}

export async function validatePhotography({ home, page, entries, dist }) {
  const person = home.graph.find(node => node["@type"] === "Person");
  assert.equal(person?.["@id"], "https://atishaykasliwal.com/#person");
  assert.ok(page, "Photography must have its own emitted HTML document.");
  assert.equal(page.url.href, photographyPage.url);
  assert.equal(page.canonical, photographyPage.url);
  assert.equal(page.title, photographyPage.title);
  assert.equal(page.description, photographyPage.description);
  assert.equal(elementsIn(page.headings[0]).filter(node => node.nodeName === "#text").map(node => node.value).join(""), "Photography");
  const link = home.elements.find(node => attribute(node, "id") === "photography-toggle");
  assert.equal(link?.tagName, "a");
  assert.equal(attribute(link, "href"), "/photography/");
  assert.equal(attribute(link, "aria-expanded"), "false");
  assert.equal(new Set(photographs.map(photo => photo.src)).size, 16, "Expected 16 unique photographs.");
  const localDimensions = new Map();
  for (const record of [home, page]) {
    const container = record.elements.find(node => attribute(node, "id") === (record === home ? "photography-carousel-track" : "photo-deck"));
    assert.ok(container);
    const images = elementsIn(container).filter(node => node.tagName === "img");
    assert.equal(images.length, 16, "Initial HTML must contain all 16 photographs exactly once.");
    assert.deepEqual(images.map(image => attribute(image, "src")), photographs.map(photo => photo.src), "Photograph order or URL changed.");
    if (record === page) {
      assert.equal(attribute(container, "hidden"), undefined);
      for (const card of elementsIn(container).filter(node => attribute(node, "data-photo-index") !== undefined)) {
        assert.equal(attribute(card, "hidden"), undefined, "No-JS gallery cards must be visible.");
        assert.ok(attribute(card, "href"), "No-JS photograph requires a real link.");
      }
    }
    assert.ok(!record.elements.some(node => node.tagName === "link" && attribute(node, "rel") === "preload" && attribute(node, "as") === "image"), "Photography must not preload the gallery.");
    for (const [index, image] of images.entries()) {
      const photo = photographs[index];
      assert.equal(attribute(image, "alt"), photo.alt);
      assert.equal(Number(attribute(image, "width")), photo.width);
      assert.equal(Number(attribute(image, "height")), photo.height);
      assert.equal(attribute(image, "loading"), record === page && index === Math.floor(photographs.length / 2) ? "eager" : "lazy");
      if (photoVariants(photo).length) {
        assert.ok(attribute(image, "srcset"));
        assert.ok(attribute(image, "sizes"));
      } else {
        assert.equal(attribute(image, "srcset"), undefined, "External and small original photos must not acquire variants.");
      }
      if (photo.src.startsWith("/")) {
        const metadata = await sharp(path.join(dist, photo.src)).metadata();
        assert.equal(metadata.width, photo.width);
        assert.equal(metadata.height, photo.height);
      }
    }
    const objects = record.graph.filter(node => node["@type"] === "ImageObject");
    assert.equal(objects.length, 16);
    for (const [index, object] of objects.entries()) {
      const photo = photographs[index];
      assert.equal(object.contentUrl, new URL(photo.src, photographyPage.url).href);
      assert.equal(object.description, photo.alt);
      assert.equal(object.creator?.["@id"], person["@id"]);
      assert.equal(object.isPartOf?.["@id"], photographyPage.url);
      assert.equal(object.creditText, "Atishay Kasliwal");
      assert.equal(object.copyrightNotice, "Atishay Kasliwal");
      assert.equal(object.license, `${photographyPage.url}#rights`);
      assert.equal(object.acquireLicensePage, "mailto:katishay@gmail.com");
      for (const redundant of ["caption", "name"]) assert.equal(object[redundant], undefined);
    }
  }
  for (const photo of photographs) {
    // Check both small cards and larger previews; all descriptors must match real files.
    for (const markup of [photo.card, photo.art]) {
      const image = elementsIn(parseFragment(markup)).find(node => node.tagName === "img");
      for (const candidate of (attribute(image, "srcset") ?? "").split(",").filter(Boolean)) {
        const [src, descriptor] = candidate.trim().split(/\s+/);
        if (!localDimensions.has(src)) localDimensions.set(src, await sharp(path.join(dist, src)).metadata());
        const metadata = localDimensions.get(src);
        assert.equal(metadata.width, Number.parseInt(descriptor), `Invalid width descriptor for ${src}`);
        assert.ok(metadata.width < photo.width, "Derivatives must never upscale originals.");
        assert.ok(Math.abs(metadata.height / metadata.width - photo.height / photo.width) < 0.004, "Derivatives must preserve the photograph's aspect ratio.");
      }
    }
  }
  // The standalone page is validated in isolation by Google, so it needs its own minimal Person
  // stub for "creator" to resolve locally — the embedded homepage copy relies on the canonical
  // Person already declared in the homepage's own JSON-LD instead.
  const pagePersons = page.graph.filter(node => node["@type"] === "Person");
  assert.equal(pagePersons.length, 1, "Photography page must declare exactly one Person stub.");
  assert.equal(pagePersons[0]["@id"], person["@id"]);
  assert.equal(pagePersons[0].name, person.name);
  assert.equal(home.graph.filter(node => node["@type"] === "ImageGallery").length, 0, "The homepage fragment is not a separate gallery page.");
  const galleries = page.graph.filter(node => node["@type"] === "ImageGallery");
  assert.equal(galleries.length, 1);
  const gallery = galleries[0];
  assert.equal(gallery["@id"], photographyPage.url);
  assert.equal(gallery.url, photographyPage.url);
  assert.equal(gallery.creator?.["@id"], person["@id"]);
  assert.equal(gallery.dateModified, photographyPage.lastModified);
  assert.equal(gallery.image, undefined, "Do not repeat the full collection under image and hasPart.");
  assert.deepEqual(gallery.hasPart.map(item => item["@id"]), page.graph.filter(node => node["@type"] === "ImageObject").map(item => item["@id"]));
  const sitemapEntry = entries.find(entry => entry.loc === photographyPage.url);
  assert.ok(sitemapEntry);
  const imageUrls = [].concat(sitemapEntry["image:image"] ?? []).map(image => image["image:loc"]);
  const expected = photographs.map(photo => new URL(photo.src, photographyPage.url).href);
  assert.deepEqual(imageUrls, expected);
  assert.equal(new Set(imageUrls).size, 16);
  assert.equal(sitemapEntry.lastmod, photographyPage.lastModified);
  const homeUrls = [].concat(entries.find(entry => entry.loc === "https://atishaykasliwal.com/")["image:image"] ?? []).map(image => image["image:loc"]);
  assert.ok(!homeUrls.some(src => expected.includes(src)), "Photography belongs to its canonical page in the image sitemap.");
  const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
  assert.doesNotMatch(robots, /^Disallow:\s*\/(?:photography)?(?:\/|\s|$)/m, "robots.txt must not block Photography.");
  console.log("Photography validation passed: 16 initial images, responsive assets, canonical credits, gallery schema and image sitemap.");
}
