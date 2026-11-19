// Helpers shared by scripts/validate-profile.mjs, scripts/extraction-report.mjs and
// tests/profile/: a small JSON Schema checker (the subset src/profile/profile.schema.json uses, so
// no validator dependency is needed) and plain-HTML extraction the way a non-JavaScript crawler
// sees a page.
import fs from "node:fs";
import path from "node:path";
import { parse } from "parse5";

// ---------- JSON Schema (draft 2020-12 subset) ----------
// Lives in src/profile/schema-check.js so the private response inspector can run it in the browser.
export { validateSchema } from "../../src/profile/schema-check.js";

// ---------- HTML as a crawler without JavaScript sees it ----------
function visit(node, callback) {
  if (node.tagName) callback(node);
  for (const child of node.childNodes ?? []) visit(child, callback);
  if (node.content) visit(node.content, callback);
}
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;

export function readPage(file) {
  const source = fs.readFileSync(file, "utf8");
  const document = parse(source);
  const elements = [];
  visit(document, node => elements.push(node));
  const text = [];
  (function collect(node) {
    if (["script", "style", "noscript", "template"].includes(node.tagName)) return;
    if (node.nodeName === "#text") text.push(node.value);
    for (const child of node.childNodes ?? []) collect(child);
  })(document);
  const plain = text.join(" ").replace(/\s+/g, " ").trim();
  const nodeText = node => {
    const parts = [];
    (function walk(n) {
      if (n.nodeName === "#text") parts.push(n.value);
      for (const c of n.childNodes ?? []) walk(c);
    })(node);
    return parts.join("").replace(/\s+/g, " ").trim();
  };
  const links = elements
    .filter(node => node.tagName === "a" && attr(node, "href"))
    .map(node => ({ href: attr(node, "href"), text: nodeText(node), hidden: attr(node, "aria-hidden") === "true" }));
  const alternates = elements
    .filter(node => node.tagName === "link" && /alternate/.test(attr(node, "rel") ?? ""))
    .map(node => ({ href: attr(node, "href"), type: attr(node, "type") }));
  const headings = elements.filter(node => /^h[1-6]$/.test(node.tagName)).map(node => ({ level: Number(node.tagName[1]), text: nodeText(node) }));
  const jsonLd = elements
    .filter(node => node.tagName === "script" && attr(node, "type") === "application/ld+json")
    .map(node => JSON.parse(nodeText(node)));
  const graph = jsonLd.flatMap(value => (Array.isArray(value["@graph"]) ? value["@graph"] : [value]));
  const ids = new Set(elements.map(node => attr(node, "id")).filter(Boolean));
  return { file, source, text: plain, links, alternates, headings, graph, ids, elements, attr };
}

// Text match that ignores whitespace and typographic differences.
export const normalize = value => String(value).replace(/[‐-―]/g, "-").replace(/ /g, " ").replace(/\s+/g, " ").trim().toLowerCase();
export const contains = (haystack, needle) => normalize(haystack).includes(normalize(needle));

// ---------- Discovery: follow only ordinary links from the homepage ----------
// Starts at "/" and follows <a href> (and, if allowed, <link rel="alternate">) within the site,
// the way a basic agent would. Returns each discovered URL with the number of clicks to reach it.
export function discover(dist, { followAlternates = true, site = "https://atishaykasliwal.com" } = {}) {
  const fileFor = pathname => {
    let file = path.join(dist, decodeURIComponent(pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!path.extname(file)) file = path.join(file, "index.html");
    return fs.existsSync(file) ? file : null;
  };
  const depth = new Map([["/", 0]]);
  const external = new Map();
  const queue = ["/"];
  while (queue.length) {
    const current = queue.shift();
    const file = fileFor(current);
    if (!file || !file.endsWith(".html")) continue;
    const page = readPage(file);
    const targets = [...page.links.filter(link => !link.hidden), ...(followAlternates ? page.alternates : [])];
    for (const { href } of targets) {
      let url;
      try {
        url = new URL(href, `${site}${current}`);
      } catch {
        continue;
      }
      if (!["http:", "https:"].includes(url.protocol)) continue;
      if (url.origin !== site) {
        if (!external.has(url.href)) external.set(url.href, depth.get(current) + 1);
        continue;
      }
      const key = url.pathname;
      if (depth.has(key) || !fileFor(key)) continue;
      depth.set(key, depth.get(current) + 1);
      queue.push(key);
    }
  }
  return { internal: depth, external };
}
