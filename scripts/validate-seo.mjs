import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { parse, parseFragment } from "parse5";
import sharp from "sharp";
import { additionalProjectPages, caseStudies, staticPageLastModified } from "../src/case-studies/data.js";
import { projects } from "../src/projects.js";
import { photographs } from "../src/photography.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const site = new URL("https://atishaykasliwal.com");
const resumePath = "/Atishay-Kasliwal-Resume.pdf";

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function visit(node, callback) {
  if (node.tagName) callback(node);
  for (const child of node.childNodes ?? []) visit(child, callback);
  if (node.content) visit(node.content, callback);
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value;
  return (node.childNodes ?? []).map(textContent).join("");
}

function attribute(node, name) {
  return node?.attrs?.find(item => item.name === name)?.value;
}

function urlForFile(file) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  return relative === "index.html" ? new URL("/", site) : new URL(`/${relative.replace(/index\.html$/, "")}`, site);
}

function outputFileForUrl(url) {
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  let candidate = path.join(dist, relative || "index.html");
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  } else if (!path.extname(candidate)) {
    candidate = path.join(candidate, "index.html");
  }
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : undefined;
}

function graphFor(document) {
  const scripts = [];
  visit(document, node => {
    if (node.tagName === "script" && attribute(node, "type") === "application/ld+json") {
      scripts.push(JSON.parse(textContent(node)));
    }
  });
  return scripts.flatMap(value => (Array.isArray(value["@graph"]) ? value["@graph"] : [value]));
}

assert.ok(fs.existsSync(path.join(dist, "index.html")), "Run npm run build before SEO validation.");

const htmlFiles = listFiles(dist).filter(file => file.endsWith(".html"));
const records = htmlFiles.map(file => {
  const source = fs.readFileSync(file, "utf8");
  const document = parse(source);
  const elements = [];
  visit(document, node => elements.push(node));
  const attrs = node => Object.fromEntries((node.attrs ?? []).map(item => [item.name, item.value]));
  const html = elements.find(node => node.tagName === "html");
  const head = elements.find(node => node.tagName === "head");
  const title = elements.find(node => node.tagName === "title");
  const isNotFound = path.relative(dist, file).split(path.sep).join("/") === "404.html";
  const canonical = elements.find(node => node.tagName === "link" && attribute(node, "rel") === "canonical");
  const meta = name => elements.find(node => node.tagName === "meta" && attribute(node, "name")?.toLowerCase() === name.toLowerCase());
  const property = name => elements.find(node => node.tagName === "meta" && attribute(node, "property")?.toLowerCase() === name.toLowerCase());
  const headings = elements.filter(node => node.tagName === "h1");
  const ids = new Set(elements.map(node => attribute(node, "id")).filter(Boolean));
  const record = {
    file,
    document,
    elements,
    ids,
    isNotFound,
    url: urlForFile(file),
    title: title ? textContent(title).trim() : "",
    description: attribute(meta("description"), "content") ?? "",
    canonical: attribute(canonical, "href"),
    robots: attribute(meta("robots"), "content") ?? "",
    headings,
    graph: graphFor(document),
    attr: attrs,
  };

  assert.ok(head, `${file}: missing <head>`);
  assert.ok(attribute(html, "lang"), `${file}: missing document language`);
  assert.ok(record.title, `${file}: missing title`);
  if (!isNotFound) {
    assert.ok(record.description, `${file}: missing meta description`);
    assert.equal(record.canonical, record.url.href, `${file}: canonical does not match the page URL`);
    assert.doesNotMatch(record.robots, /noindex/i, `${file}: indexable page has noindex`);
    assert.equal(headings.length, 1, `${file}: expected exactly one H1`);
    assert.ok(record.graph.length, `${file}: missing valid JSON-LD`);
    assert.ok(property("og:title"), `${file}: missing Open Graph title`);
    assert.ok(property("og:description"), `${file}: missing Open Graph description`);
    assert.ok(property("og:image"), `${file}: missing Open Graph image`);
    assert.equal(attribute(property("og:url"), "content"), record.url.href, `${file}: Open Graph URL differs from canonical`);
    assert.ok(meta("twitter:card"), `${file}: missing X/Twitter card metadata`);
    const ogImage = new URL(attribute(property("og:image"), "content"), record.url);
    assert.equal(ogImage.origin, site.origin, `${file}: Open Graph image must be hosted on this site`);
    assert.ok(fs.existsSync(path.join(dist, decodeURIComponent(ogImage.pathname.slice(1)))), `${file}: missing Open Graph image asset`);
    if (record.file.includes(`${path.sep}projects${path.sep}`)) {
      const slug = path.basename(path.dirname(record.file));
      assert.equal(ogImage.pathname, `/projects/media/${slug}/og.jpg`, `${file}: project must use its own social image`);
    }
    assert.equal(attribute(meta("twitter:image"), "content"), ogImage.href, `${file}: X/Twitter image differs from Open Graph image`);
    assert.equal(attribute(property("og:image:width"), "content"), "1200", `${file}: unexpected Open Graph image width`);
    assert.equal(attribute(property("og:image:height"), "content"), "630", `${file}: unexpected Open Graph image height`);
  } else {
    assert.match(record.robots, /noindex/i, "404 page must remain noindex");
    assert.equal(attribute(canonical, "href"), undefined, "404 page must not canonicalize to another URL");
    assert.equal(headings.length, 1, "404 page must have exactly one H1");
    assert.ok(record.description, "404 page must have a description");
    assert.ok(record.elements.some(node => node.tagName === "a" && attribute(node, "href") === "/"), "404 page must link back to the homepage");
    const styleText = elements.filter(node => node.tagName === "style").map(textContent).join("\n");
    const fontAssets = [...styleText.matchAll(/url\(["']?(\/assets\/[^)"']+\.woff2)["']?\)/g)].map(match => match[1]);
    assert.ok(fontAssets.length, "404 page should reuse the site's local font assets");
    for (const asset of fontAssets) {
      assert.ok(fs.existsSync(path.join(dist, asset.slice(1))), `404 page font asset is missing: ${asset}`);
    }
  }
  return record;
});

const indexable = records.filter(record => !record.isNotFound);
const titles = indexable.map(record => record.title.toLocaleLowerCase());
assert.equal(new Set(titles).size, titles.length, "Page titles must be unique.");
assert.equal(indexable.length, projects.length + 1, "Expected the homepage and one page per project.");
assert.equal(caseStudies.length + additionalProjectPages.length, projects.length, "Every listed project needs a page record.");
const projectPagesByName = new Map([...caseStudies, ...additionalProjectPages].map(page => [page.name, page]));
assert.equal(projectPagesByName.size, projects.length, "Project page names must map one-to-one to carousel projects.");
for (const project of projects) {
  const page = projectPagesByName.get(project.name);
  assert.ok(page, `Missing project page data for ${project.name}`);
  assert.equal(project.caseStudy, `/projects/${page.slug}/`, `${project.name}: preview link must match its generated project route`);
  assert.ok(outputFileForUrl(new URL(project.caseStudy, site)), `${project.name}: project preview link target does not exist`);
}

for (const record of indexable) {
  const localIds = new Set(record.graph.map(node => node["@id"]).filter(Boolean));
  assert.equal(localIds.size, record.graph.filter(node => node["@id"]).length, `${record.file}: duplicate JSON-LD @id`);
  for (const image of record.elements.filter(node => node.tagName === "img")) {
    assert.notEqual(attribute(image, "alt"), undefined, `${record.file}: image is missing alt text`);
    assert.ok(attribute(image, "width") && attribute(image, "height"), `${record.file}: image is missing dimensions`);
    const src = attribute(image, "src");
    if (src?.startsWith("/")) {
      assert.ok(fs.existsSync(path.join(dist, decodeURIComponent(src.slice(1)))), `${record.file}: missing image ${src}`);
    }
  }
  for (const anchor of record.elements.filter(node => node.tagName === "a")) {
    const href = attribute(anchor, "href");
    if (!href) continue;
    const target = new URL(href, record.url);
    if (target.origin !== site.origin || !["http:", "https:"].includes(target.protocol)) continue;
    const targetFile = outputFileForUrl(target);
    assert.ok(targetFile, `${record.file}: broken internal link ${href}`);
    if (target.hash && targetFile.endsWith(".html")) {
      const targetRecord = records.find(item => item.file === targetFile);
      assert.ok(targetRecord?.ids.has(decodeURIComponent(target.hash.slice(1))), `${record.file}: missing fragment ${href}`);
    }
  }
}

for (const markup of projects.flatMap(project => [project.card, project.art]).filter(value => typeof value === "string")) {
  const fragment = parseFragment(markup);
  const artworkImages = [];
  visit(fragment, node => {
    if (node.tagName === "img") artworkImages.push(node);
  });
  for (const image of artworkImages) {
    assert.notEqual(attribute(image, "alt"), undefined, "Carousel artwork image is missing alt text.");
    const src = attribute(image, "src");
    if (src?.startsWith("/")) {
      assert.ok(fs.existsSync(path.join(dist, decodeURIComponent(src.slice(1)))), `Carousel artwork source is missing: ${src}`);
    }
    for (const candidate of (attribute(image, "srcset") ?? "").split(",").map(item => item.trim()).filter(Boolean)) {
      const [source, descriptor] = candidate.split(/\s+/);
      if (!source.startsWith("/")) continue;
      const imagePath = path.join(dist, decodeURIComponent(source.slice(1)));
      assert.ok(fs.existsSync(imagePath), `Carousel srcset image is missing: ${source}`);
      const metadata = await sharp(imagePath).metadata();
      assert.equal(Number.parseInt(descriptor, 10), metadata.width, `Carousel srcset width does not match ${source}`);
    }
  }
}

const home = records.find(record => record.file === path.join(dist, "index.html"));
const projectList = home.graph.find(node => node["@id"] === `${site.href}#selected-work`);
assert.ok(projectList, "Homepage must expose its selected-work ItemList.");
const itemList = projectList.itemListElement ?? [];
assert.equal(itemList.length, projects.length, "Structured project list must cover every project.");
const listedProjectIds = new Set(itemList.map(item => item.item?.["@id"]));
const projectRecords = indexable.filter(record => record.file.includes(`${path.sep}projects${path.sep}`));
const projectInlinks = new Map(projectRecords.map(record => [record.url.pathname, 0]));
for (const record of projectRecords) {
  for (const anchor of record.elements.filter(node => node.tagName === "a")) {
    const href = attribute(anchor, "href");
    if (!href) continue;
    const target = new URL(href, record.url);
    if (target.origin === site.origin && projectInlinks.has(target.pathname)) {
      projectInlinks.set(target.pathname, projectInlinks.get(target.pathname) + 1);
    }
  }
}
for (const [pathname, inlinks] of projectInlinks) {
  assert.ok(inlinks > 0, `Project page has no HTML inlinks: ${pathname}`);
}
const generatedProjectIds = new Set(projectRecords.map(record => record.graph.find(node => node["@id"]?.endsWith("#project"))?.["@id"]));
assert.deepEqual(listedProjectIds, generatedProjectIds, "Homepage project entities must resolve to project pages.");
for (const record of projectRecords) {
  // A page built around the person themselves (Beyond the Resume) is a ProfilePage whose
  // mainEntity is the Person, not the project — everything else stays a plain WebPage.
  const pageEntity = record.graph.find(node => node["@type"] === "WebPage" || node["@type"] === "ProfilePage");
  const projectEntity = record.graph.find(node => node["@id"]?.endsWith("#project"));
  assert.ok(pageEntity && projectEntity, `${record.file}: missing page or project entity`);
  if (pageEntity["@type"] === "ProfilePage") {
    const personEntity = record.graph.find(node => node["@type"] === "Person");
    assert.ok(personEntity, `${record.file}: ProfilePage must include a Person entity`);
    assert.equal(pageEntity.mainEntity?.["@id"], personEntity["@id"], `${record.file}: ProfilePage mainEntity must be the Person`);
  } else {
    assert.equal(pageEntity.mainEntity?.["@id"], projectEntity["@id"], `${record.file}: page and project entities are not connected`);
  }
  assert.equal(projectEntity.mainEntityOfPage?.["@id"], pageEntity["@id"], `${record.file}: project does not point back to its page`);
}
const homepageEntity = home.graph.find(node => node["@type"] === "ProfilePage");
assert.equal(homepageEntity?.dateModified, staticPageLastModified.homepage, "Homepage schema dateModified must match the source-recorded date.");

const galleryId = `${site.href}#photography`;
const personId = `${site.href}#person`;
const gallery = home.graph.find(node => node["@id"] === galleryId);
assert.equal(gallery?.["@type"], "ImageGallery", "Homepage must expose its Photography gallery.");
assert.equal(gallery.url, galleryId, "Photography gallery must use its section link.");
assert.equal(gallery.creator?.["@id"], personId, "Photography gallery must credit the photographer.");
assert.equal(gallery.isPartOf?.["@id"], homepageEntity["@id"], "Photography gallery must link to the homepage entity.");
assert.ok([].concat(homepageEntity.hasPart ?? []).some(item => item["@id"] === galleryId), "Homepage must link to its Photography gallery.");
const photographer = home.graph.find(node => node["@id"] === personId);
assert.equal(photographer?.name, "Atishay Kasliwal", "Photographer must resolve to the portfolio owner.");
const photoUrls = photographs.map(photo => new URL(photo.src, site).href);
assert.equal(new Set(photoUrls).size, photographs.length, "Photography collection must not repeat an image.");
const expectedImageIds = new Set(photoUrls.map(url => `${url}#image`));
for (const property of ["image", "hasPart"]) {
  const references = [].concat(gallery[property] ?? []);
  assert.equal(references.length, photographs.length, `Gallery ${property} must include every photograph once.`);
  assert.deepEqual(new Set(references.map(item => item["@id"])), expectedImageIds, `Gallery ${property} references must match its photographs.`);
}
const photoEntities = home.graph.filter(node => node["@type"] === "ImageObject" && node.isPartOf?.["@id"] === galleryId);
assert.equal(photoEntities.length, photographs.length, "Every photograph needs an ImageObject entity.");
const photoTrack = home.elements.find(node => attribute(node, "id") === "photography-carousel-track");
assert.ok(photoTrack, "Homepage is missing its Photography carousel.");
const staticPhotos = [];
visit(photoTrack, node => {
  if (node.tagName === "img") staticPhotos.push(node);
});
assert.equal(staticPhotos.length, photographs.length, "Every photograph must appear in the initial HTML without JavaScript.");
for (const [index, photo] of photographs.entries()) {
  const image = staticPhotos[index];
  const photoUrl = photoUrls[index];
  assert.equal(new URL(attribute(image, "src"), site).href, photoUrl, "Initial gallery must preserve the selected photo order.");
  assert.equal(attribute(image, "alt"), photo.alt, `${photoUrl}: missing descriptive gallery alt text`);
  assert.ok(photo.alt.trim(), `${photoUrl}: photo description is empty`);
  assert.equal(attribute(image, "width"), String(photo.width), `${photoUrl}: incorrect gallery image width`);
  assert.equal(attribute(image, "height"), String(photo.height), `${photoUrl}: incorrect gallery image height`);
  assert.equal(attribute(image, "loading"), "lazy", `${photoUrl}: gallery must defer image loading`);
  const entity = photoEntities.find(node => node.contentUrl === photoUrl);
  assert.ok(entity, `${photoUrl}: missing ImageObject`);
  assert.equal(entity["@id"], `${photoUrl}#image`, `${photoUrl}: incorrect image entity ID`);
  assert.equal(entity.description, photo.alt, `${photoUrl}: image description differs from the visible image`);
  assert.equal(entity.width, photo.width, `${photoUrl}: incorrect schema width`);
  assert.equal(entity.height, photo.height, `${photoUrl}: incorrect schema height`);
  assert.equal(entity.creator?.["@id"], personId, `${photoUrl}: missing photographer credit`);
  assert.equal(entity.copyrightHolder?.["@id"], personId, `${photoUrl}: missing copyright holder`);
  assert.equal(entity.creditText, photographer.name, `${photoUrl}: incorrect photographer credit`);
  assert.equal(entity.copyrightNotice, photographer.name, `${photoUrl}: incorrect copyright notice`);
  if (new URL(photoUrl).origin === site.origin) {
    const metadata = await sharp(path.join(dist, new URL(photoUrl).pathname.slice(1))).metadata();
    assert.equal(metadata.width, photo.width, `${photoUrl}: recorded photo width differs from the asset`);
    assert.equal(metadata.height, photo.height, `${photoUrl}: recorded photo height differs from the asset`);
  }
}

const xml = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const sitemap = new XMLParser({ ignoreAttributes: true, trimValues: true }).parse(xml).urlset;
assert.ok(sitemap, "Invalid sitemap XML.");
const entries = [].concat(sitemap.url ?? []);
const sitemapUrls = entries.map(entry => entry.loc);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap contains duplicate URLs.");
const expectedSitemap = new Set([...indexable.map(record => record.url.href), new URL(resumePath, site).href]);
assert.deepEqual(new Set(sitemapUrls), expectedSitemap, "Sitemap URLs must match canonical pages plus the résumé PDF.");
const expectedLastModified = new Map(indexable.map(record => {
  const pageEntity = record.graph.find(node => node["@type"] === "WebPage" || node["@type"] === "ProfilePage");
  return [record.url.href, pageEntity?.dateModified];
}));
expectedLastModified.set(new URL(resumePath, site).href, staticPageLastModified.resume);
for (const entry of entries) {
  const target = new URL(entry.loc);
  assert.equal(target.origin, site.origin, `Unexpected sitemap host: ${entry.loc}`);
  const targetFile = outputFileForUrl(target);
  assert.ok(targetFile, `Sitemap URL has no output file: ${entry.loc}`);
  assert.equal(entry.lastmod, expectedLastModified.get(entry.loc), `Sitemap lastmod must match source dates for ${entry.loc}`);
  const imageNodes = [].concat(entry["image:image"] ?? []);
  for (const imageNode of imageNodes) {
    const imageUrl = new URL(imageNode["image:loc"]);
    assert.equal(imageUrl.protocol, "https:", `Sitemap image must use HTTPS: ${imageUrl.href}`);
    if (imageUrl.origin === site.origin) {
      assert.ok(fs.existsSync(path.join(dist, decodeURIComponent(imageUrl.pathname.slice(1)))), `Sitemap image is missing: ${imageUrl.href}`);
    } else {
      assert.ok(photoUrls.includes(imageUrl.href), `Sitemap contains an undeclared external image: ${imageUrl.href}`);
    }
  }
}

const homeImages = [].concat(entries.find(entry => entry.loc === site.href)["image:image"] ?? []).map(image => image["image:loc"]);
assert.equal(new Set(homeImages).size, homeImages.length, "Homepage image sitemap must not contain duplicate photos.");
for (const photoUrl of photoUrls) {
  assert.ok(homeImages.includes(photoUrl), `Photography image is missing from the sitemap: ${photoUrl}`);
}

const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
assert.match(robots, /^User-agent:\s*\*/m, "robots.txt is missing its wildcard user agent.");
assert.match(robots, /^Allow:\s*\//m, "robots.txt must allow crawling.");
assert.match(robots, /Sitemap:\s*https:\/\/atishaykasliwal\.com\/sitemap\.xml/i, "robots.txt must declare the canonical sitemap.");
const headers = fs.readFileSync(path.join(dist, "_headers"), "utf8");
assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/i, "Cloudflare Pages HSTS header is missing.");

console.log(`SEO validation passed: ${indexable.length} indexable pages, ${projectRecords.length} project entities, ${photographs.length} photographs, ${sitemapUrls.length} sitemap URLs, metadata/schema/internal links/robots/headers valid.`);
