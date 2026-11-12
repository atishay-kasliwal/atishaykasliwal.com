// Builds the SEO dashboard's data after `vite build`: one record per HTML page in dist/ with
// its tags and a pass/warn/fail verdict for each check, plus site-wide checks (robots.txt,
// llms.txt, sitemap, résumé PDF). Writes dist/photography/admin/seo/report.json and copies the
// dashboard page beside it. The folder sits under the Cloudflare Access-protected admin path.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { XMLParser } from "fast-xml-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const SITE = "https://atishaykasliwal.com";
const outDir = path.join(dist, "photography", "admin", "seo");

// --- small HTML helpers -------------------------------------------------------------------
const walk = node => [node, ...(node.childNodes ?? []).flatMap(walk), ...(node.content ? walk(node.content) : [])];
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const text = node => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join("");
const visibleText = node => {
  if (["script", "style", "noscript", "template", "svg"].includes(node.nodeName)) return "";
  if (node.nodeName === "#text") return node.value + " ";
  return (node.childNodes ?? []).map(visibleText).join("");
};

const listFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? listFiles(full) : [full];
});
const urlForFile = file => {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  if (rel === "index.html") return `${SITE}/`;
  if (rel.endsWith("/index.html")) return `${SITE}/${rel.slice(0, -"index.html".length)}`;
  return `${SITE}/${rel}`;
};
const fileForPath = pathname => {
  const clean = decodeURIComponent(pathname.split("#")[0].split("?")[0]);
  const candidates = clean.endsWith("/") ? [`${clean}index.html`] : [clean, `${clean}/index.html`, `${clean}.html`];
  return candidates.map(c => path.join(dist, c.replace(/^\//, ""))).find(c => fs.existsSync(c) && fs.statSync(c).isFile());
};

// --- sitemap ------------------------------------------------------------------------------
const sitemapXml = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const sitemapEntries = [].concat(new XMLParser().parse(sitemapXml).urlset.url ?? []);
const sitemap = new Map(sitemapEntries.map(e => [e.loc, { lastmod: e.lastmod ?? null, images: [].concat(e["image:image"] ?? []).length }]));

// --- per-page checks ----------------------------------------------------------------------
const check = (id, label, status, detail) => ({ id, label, status, detail });

function inspect(file) {
  const html = fs.readFileSync(file, "utf8");
  const doc = parse(html);
  const nodes = walk(doc);
  const url = urlForFile(file);
  const meta = name => attr(nodes.find(n => n.nodeName === "meta" && (attr(n, "name") === name || attr(n, "property") === name)) ?? {}, "content") ?? null;
  const title = text(nodes.find(n => n.nodeName === "title") ?? { childNodes: [] }).trim() || null;
  const description = meta("description");
  const robots = meta("robots") ?? "";
  const canonical = attr(nodes.find(n => n.nodeName === "link" && attr(n, "rel") === "canonical") ?? {}, "href") ?? null;
  const lang = attr(nodes.find(n => n.nodeName === "html") ?? {}, "lang") ?? null;
  const h1s = nodes.filter(n => n.nodeName === "h1").map(n => text(n).replace(/\s+/g, " ").trim());
  const og = Object.fromEntries(["og:title", "og:description", "og:image", "og:url", "og:type"].map(k => [k, meta(k)]));
  const twitter = Object.fromEntries(["twitter:card", "twitter:title", "twitter:image"].map(k => [k, meta(k)]));

  const schemaTypes = [];
  let schemaErrors = 0;
  for (const node of nodes.filter(n => n.nodeName === "script" && attr(n, "type") === "application/ld+json")) {
    try {
      const data = JSON.parse(text(node));
      const items = [].concat(data["@graph"] ?? data);
      for (const item of items) schemaTypes.push(...[].concat(item["@type"] ?? []));
    } catch { schemaErrors++; }
  }

  const images = nodes.filter(n => n.nodeName === "img");
  const missingAlt = images.filter(n => attr(n, "alt") === undefined).map(n => attr(n, "src") ?? "(inline)");

  const internal = new Set();
  const broken = [];
  for (const a of nodes.filter(n => n.nodeName === "a" && attr(n, "href"))) {
    const href = attr(a, "href");
    if (/^(mailto:|tel:|javascript:|#)/.test(href)) continue;
    let target;
    try { target = new URL(href, url); } catch { continue; }
    if (target.origin !== SITE) continue;
    internal.add(target.pathname);
    if (!fileForPath(target.pathname)) broken.push(target.pathname);
  }

  const words = visibleText(doc).split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).length;
  const isPrivate = /noindex/i.test(robots);
  const isNotFound = path.basename(file) === "404.html";
  const inSitemap = sitemap.get(url) ?? null;

  const checks = [];
  if (!isPrivate) {
    const t = title?.length ?? 0;
    checks.push(check("title", "Title", !title ? "fail" : t > 65 ? "warn" : t < 25 ? "warn" : "pass",
      !title ? "Missing <title>." : t > 65 ? `${t} characters. Google shows about 60, so the end may be cut.` : t < 25 ? `${t} characters. Short titles waste space in results.` : `${t} characters.`));
    const d = description?.length ?? 0;
    checks.push(check("description", "Meta description", !description ? "fail" : d > 165 ? "warn" : d < 70 ? "warn" : "pass",
      !description ? "Missing meta description. Google will pick text from the page." : d > 165 ? `${d} characters. Google cuts at about 160.` : d < 70 ? `${d} characters. Aim for 120 to 160.` : `${d} characters.`));
    checks.push(check("canonical", "Canonical", !canonical ? "fail" : canonical === url ? "pass" : "fail",
      !canonical ? "Missing canonical link." : canonical === url ? "Points to this page." : `Points to ${canonical}, not ${url}.`));
    checks.push(check("h1", "H1 heading", h1s.length === 1 ? "pass" : h1s.length === 0 ? "warn" : "warn",
      h1s.length === 1 ? `"${h1s[0].slice(0, 80)}"` : h1s.length === 0 ? "No H1 on the page." : `${h1s.length} H1 headings. One is clearer.`));
    const ogMissing = ["og:title", "og:description", "og:image"].filter(k => !og[k]);
    checks.push(check("og", "Open Graph", ogMissing.length ? "warn" : "pass",
      ogMissing.length ? `Missing ${ogMissing.join(", ")}. Links shared on LinkedIn and Slack look plain.` : "Title, description and image set."));
    checks.push(check("twitter", "Twitter card", twitter["twitter:card"] ? "pass" : "warn",
      twitter["twitter:card"] ? twitter["twitter:card"] : "No twitter:card. X falls back to a plain link."));
    checks.push(check("schema", "Structured data", schemaErrors ? "fail" : schemaTypes.length ? "pass" : "warn",
      schemaErrors ? `${schemaErrors} JSON-LD block(s) failed to parse.` : schemaTypes.length ? [...new Set(schemaTypes)].join(", ") : "No JSON-LD. Rich results are unlikely."));
    checks.push(check("alt", "Image alt text", missingAlt.length ? "warn" : "pass",
      missingAlt.length ? `${missingAlt.length} of ${images.length} images have no alt attribute.` : `${images.length} images, all with alt attributes.`));
    checks.push(check("links", "Internal links", broken.length ? "fail" : "pass",
      broken.length ? `Broken: ${[...new Set(broken)].join(", ")}` : `${internal.size} internal links, none broken.`));
    if (!isNotFound) {
      checks.push(check("sitemap", "In sitemap", inSitemap ? "pass" : "fail",
        inSitemap ? `Listed${inSitemap.lastmod ? `, last modified ${inSitemap.lastmod}` : ""}${inSitemap.images ? `, ${inSitemap.images} images` : ""}.` : "Not in sitemap.xml, so Google may find it late."));
      checks.push(check("content", "Content length", words < 150 ? "warn" : "pass",
        words < 150 ? `${words} words. Thin pages rank poorly.` : `${words} words.`));
    }
    checks.push(check("lang", "Language", lang ? "pass" : "warn", lang ? `lang="${lang}"` : "No lang attribute on <html>."));
  }

  const counted = checks.filter(c => c.status !== "info");
  const score = counted.length ? Math.round(100 * counted.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0) / counted.length) : null;
  const rel = path.relative(dist, file).split(path.sep).join("/");
  return {
    url, path: new URL(url).pathname, file: rel,
    kind: isNotFound ? "404" : isPrivate ? "private" : rel === "index.html" ? "home" : rel.split("/")[0],
    indexable: !isPrivate && !isNotFound,
    title, description, canonical, robots: robots || null, lang, h1: h1s, og, twitter,
    schemaTypes: [...new Set(schemaTypes)], images: images.length, missingAlt, internalLinks: internal.size, brokenLinks: [...new Set(broken)],
    words, bytes: Buffer.byteLength(html), sitemap: inSitemap, checks, score,
  };
}

const pages = listFiles(dist).filter(f => f.endsWith(".html")).map(inspect)
  .sort((a, b) => (a.kind === "home" ? -1 : b.kind === "home" ? 1 : a.path.localeCompare(b.path)));

// --- site-wide checks ---------------------------------------------------------------------
const site = [];
const read = rel => (fs.existsSync(path.join(dist, rel)) ? fs.readFileSync(path.join(dist, rel), "utf8") : null);

const robotsTxt = read("robots.txt");
const robotsBlocks = robotsTxt ? [...robotsTxt.matchAll(/^Disallow:\s*\/\s*$/gim)].length : 0;
site.push(check("robots", "robots.txt", !robotsTxt ? "fail" : robotsBlocks ? "warn" : "pass",
  !robotsTxt ? "Missing." : `${/Sitemap:/i.test(robotsTxt) ? "Lists the sitemap. " : "No Sitemap line. "}${robotsBlocks ? `${robotsBlocks} crawler(s) fully blocked.` : "Every crawler allowed, including AI assistants."} Cloudflare can prepend its own managed rules at the edge, so check the live file too.`));

const llms = read("llms.txt");
site.push(check("llms", "llms.txt", llms ? "pass" : "warn",
  llms ? `${llms.split(/\s+/).length} words, ${(llms.match(/^## /gm) ?? []).length} sections.` : "No /llms.txt for AI assistants."));

const indexable = pages.filter(p => p.indexable);
const missingFromSitemap = indexable.filter(p => !p.sitemap).map(p => p.path);
const sitemapOrphans = [...sitemap.keys()].filter(loc => !fileForPath(new URL(loc).pathname));
const privateInSitemap = pages.filter(p => !p.indexable && p.sitemap).map(p => p.path);
site.push(check("sitemap", "sitemap.xml", missingFromSitemap.length || sitemapOrphans.length || privateInSitemap.length ? "fail" : "pass",
  `${sitemap.size} URLs, ${[...sitemap.values()].filter(v => v.lastmod).length} with lastmod.${missingFromSitemap.length ? ` Missing: ${missingFromSitemap.join(", ")}.` : ""}${sitemapOrphans.length ? ` No file for: ${sitemapOrphans.join(", ")}.` : ""}${privateInSitemap.length ? ` Private pages listed: ${privateInSitemap.join(", ")}.` : ""}`));

const resume = path.join(dist, "Atishay-Kasliwal-Resume.pdf");
if (fs.existsSync(resume)) {
  // PDF literal strings escape some characters as \ddd octal codes (a hyphen is \055).
  const pdfTitle = (fs.readFileSync(resume, "latin1").match(/\/Title\s*\(([^)]*)\)/)?.[1] ?? "")
    .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))).replace(/\\(.)/g, "$1");
  site.push(check("resume", "Résumé PDF title", pdfTitle ? "pass" : "warn",
    pdfTitle ? `"${pdfTitle}"` : "No title in the PDF, so search results show the file name."));
}

const notFound = pages.find(p => p.kind === "404");
site.push(check("404", "404 page", notFound && /noindex/i.test(notFound.robots ?? "") ? "pass" : "warn",
  notFound ? `Exists${/noindex/i.test(notFound.robots ?? "") ? " and is noindex" : ", but is not noindex"}.` : "No 404.html."));

const headersFile = read("_headers");
site.push(check("headers", "Security and cache headers", headersFile ? "pass" : "warn",
  headersFile ? `${(headersFile.match(/^\/\S*/gm) ?? []).length} header rules (HSTS, nosniff, long cache for hashed assets).` : "No _headers file."));

// --- suggestions: what is costing visibility, ranked, each with a concrete fix ---------------
// impact: high (costs visibility now) · medium (worth fixing soon) · low (polish).
// effort: "Quick fix" · "About an hour" · "Your action" (a dashboard or account outside this repo).
const suggestions = [];
const suggest = s => suggestions.push({ pages: [], steps: [], ...s });
const pathsOf = list => list.map(p => p.path);

// Live checks against the public site: Cloudflare can add rules this repo never sees.
const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "OAI-SearchBot", "CCBot", "meta-externalagent"];
try {
  const liveRobots = await fetch(`${SITE}/robots.txt`, { signal: AbortSignal.timeout(8000) }).then(r => r.text());
  const blockedAgents = liveRobots.split(/\n\s*\n/).flatMap(group => {
    const agents = [...group.matchAll(/^User-agent:\s*(\S+)/gim)].map(m => m[1]);
    return /^Disallow:\s*\/\s*$/im.test(group) ? agents : [];
  });
  const blockedAi = AI_BOTS.filter(bot => blockedAgents.some(a => a.toLowerCase() === bot.toLowerCase()));
  const edge = {};
  for (const bot of ["GPTBot", "ClaudeBot"]) {
    edge[bot] = await fetch(`${SITE}/`, { headers: { "User-Agent": `Mozilla/5.0 (compatible; ${bot}/1.0)` }, signal: AbortSignal.timeout(8000) }).then(r => r.status).catch(() => null);
  }
  const edgeBlocked = Object.entries(edge).filter(([, status]) => status === 403).map(([bot]) => bot);
  const noTraining = /Content-Signal:[^\n]*ai-train=no/i.test(liveRobots);
  if (blockedAi.length || edgeBlocked.length || noTraining) {
    suggest({
      id: "ai-blocked", impact: "high", area: "AI assistants", effort: "Your action",
      title: "AI assistants are blocked from reading your site",
      why: `The live robots.txt fully blocks ${blockedAi.length ? blockedAi.join(", ") : "AI crawlers"}${edgeBlocked.length ? `, and Cloudflare answers ${edgeBlocked.join(" and ")} with 403 before they reach the site` : ""}${noTraining ? ". It also signals ai-train=no" : ""}. When a recruiter asks ChatGPT or Claude about you, those assistants have nothing first-hand to go on. Your own robots.txt allows them; Cloudflare's managed rules override it.`,
      steps: [
        "Cloudflare dashboard → atishaykasliwal.com → AI Crawl Control.",
        "Crawlers tab: set AI crawlers to Allow.",
        "Turn off the managed robots.txt so your own file is served as written.",
        "Security → Bots: turn off Bot Fight Mode if it is on.",
        "Redeploy or wait for the daily build; this suggestion disappears once the live checks pass.",
      ],
      where: "Cloudflare dashboard",
    });
  }
} catch {
  suggest({ id: "live-unreachable", impact: "low", area: "AI assistants", effort: "Quick fix", title: "Could not check the live robots.txt",
    why: "The build had no network access, so Cloudflare's edge rules were not checked this time.", steps: ["Run the build with network access, or check https://atishaykasliwal.com/robots.txt by hand."] });
}

// GitHub: each repo's Website field is a link back to the site from a page recruiters read.
try {
  const token = process.env.GITHUB_TOKEN || (() => { try { return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } })();
  const repos = await fetch("https://api.github.com/users/atishay-kasliwal/repos?per_page=100&type=owner", {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "atishaykasliwal.com-seo-report", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(8000),
  }).then(r => (r.ok ? r.json() : []));
  const { projects } = await import(path.join(root, "src", "projects.js"));
  const pageForRepo = new Map(projects.filter(p => p.url?.startsWith("https://github.com/")).map(p => [p.url.toLowerCase().replace(/\/$/, ""), `${SITE}${p.caseStudy}`]));
  const own = repos.filter(r => !r.fork && !r.archived);
  const missing = own.filter(r => !(r.homepage ?? "").includes("atishaykasliwal.com"));
  if (own.length && missing.length) {
    suggest({
      id: "github-backlinks", impact: "medium", area: "Traffic", effort: "Quick fix",
      title: `${missing.length} of ${own.length} GitHub repos do not link to the site`,
      why: "Recruiters land on your repos first. A repo's Website field is the one link on that page pointing back to your portfolio, and it tells search engines the repo and the site belong to the same person.",
      steps: missing.slice(0, 30).map(r => `${r.name}: set Website to ${pageForRepo.get(r.html_url.toLowerCase()) ?? `${SITE}/`}${r.homepage ? ` (now ${r.homepage})` : ""}`),
      where: "GitHub repo settings, or ask Claude to set them with the GitHub CLI",
    });
  }
} catch {}

const pageChecks = id => indexable.filter(p => p.checks.some(c => c.id === id && c.status !== "pass"));
const detailOf = (p, id) => p.checks.find(c => c.id === id)?.detail ?? "";

const brokenPages = pageChecks("links");
if (brokenPages.length) suggest({ id: "broken-links", impact: "high", area: "Crawling", effort: "Quick fix", title: "Broken internal links",
  why: "Links to missing pages waste crawl budget and dead-end visitors.", pages: pathsOf(brokenPages), steps: brokenPages.map(p => `${p.path}: ${detailOf(p, "links")}`) });
const canonicalPages = pageChecks("canonical");
if (canonicalPages.length) suggest({ id: "canonical", impact: "high", area: "Indexing", effort: "Quick fix", title: "Canonical tags point to the wrong page",
  why: "Google may index a different URL than the one you meant, or drop the page.", pages: pathsOf(canonicalPages), steps: canonicalPages.map(p => `${p.path}: ${detailOf(p, "canonical")}`) });
if (missingFromSitemap.length) suggest({ id: "sitemap-missing", impact: "high", area: "Indexing", effort: "Quick fix", title: "Pages missing from the sitemap",
  why: "Google finds unlisted pages late, or never.", pages: missingFromSitemap, steps: ["Add them in scripts/build-case-studies.mjs, where sitemap.xml is generated."] });

const longDesc = indexable.filter(p => (p.description?.length ?? 0) > 160);
if (longDesc.length) suggest({ id: "description-long", impact: "medium", area: "Search results", effort: "Quick fix",
  title: `${longDesc.length} meta description${longDesc.length > 1 ? "s run" : " runs"} past Google's cut-off`,
  why: "Google shows about 155 to 160 characters. Past that, the end of your pitch is replaced by an ellipsis, and the snippet is the main thing deciding whether someone clicks.",
  pages: pathsOf(longDesc), steps: longDesc.map(p => `${p.path} (${p.description.length} chars): "${p.description}"`),
  where: "src/experience-pages.js for experience pages, src/case-studies/data.js for projects" });
const shortDesc = indexable.filter(p => p.description && p.description.length < 70);
if (shortDesc.length) suggest({ id: "description-short", impact: "medium", area: "Search results", effort: "Quick fix", title: "Meta descriptions that are too short",
  why: "Short snippets leave space Google fills with random page text.", pages: pathsOf(shortDesc), steps: shortDesc.map(p => `${p.path}: "${p.description}"`) });

const thin = indexable.filter(p => p.kind !== "home" && p.words < 150);
if (thin.length) suggest({ id: "thin", impact: "medium", area: "Content", effort: "About an hour",
  title: `${thin.length === 1 ? "A page has" : `${thin.length} pages have`} almost no text for Google to read`,
  why: "Google ranks pages on the words it can read in the HTML. Images alone don't tell it what the page is about, so these pages rarely appear for any search.",
  pages: pathsOf(thin), steps: thin.map(p => `${p.path}: ${p.words} words. Add a two or three sentence intro saying what the page is and who made it.`) });

const deadEnds = indexable.filter(p => p.kind !== "home" && p.internalLinks <= 2);
if (deadEnds.length) suggest({ id: "dead-ends", impact: "medium", area: "Linking", effort: "About an hour",
  title: `${deadEnds.length} pages are near dead ends (2 internal links or fewer)`,
  why: "Project and experience pages link back home and to the next page only. A recruiter who likes one project has no path to related work, and Google sees each page as isolated, which spreads less authority between them.",
  pages: pathsOf(deadEnds),
  steps: ["Add a short Related line to each page: projects built in that job, or the job a project came from (e.g. Accolite ↔ Insurance Platform, Stony Brook Research ↔ FedTalk, Wake Forest CAIR ↔ Atriaa and Medscan).",
    "This is a small visible addition at the bottom of the page; nothing else on the page changes."] });

const lightContent = indexable.filter(p => p.kind === "experience" && p.words < 250);
if (lightContent.length) suggest({ id: "light", impact: "low", area: "Content", effort: "About an hour", title: "Experience pages are short",
  why: "Pages under about 250 words compete poorly for searches like the company name plus engineer. One paragraph on the problem, your part, and the outcome gives Google and recruiters more to match.",
  pages: pathsOf(lightContent), steps: lightContent.map(p => `${p.path}: ${p.words} words`) });

const longTitles = indexable.filter(p => (p.title?.length ?? 0) > 60);
if (longTitles.length) suggest({ id: "title-long", impact: "low", area: "Search results", effort: "Quick fix", title: "Titles close to Google's display limit",
  why: "Titles over about 60 characters can be cut. The cut usually lands on your name, which is the part that matters most.",
  pages: pathsOf(longTitles), steps: longTitles.map(p => `${p.path} (${p.title.length}): "${p.title}"`) });

const noLastmod = [...sitemap.entries()].filter(([, v]) => !v.lastmod).map(([loc]) => new URL(loc).pathname);
if (noLastmod.length) suggest({ id: "lastmod", impact: "low", area: "Indexing", effort: "About an hour", title: `${noLastmod.length} sitemap URLs have no last-modified date`,
  why: "An accurate lastmod tells Google which pages changed so it recrawls those first. Only add it where the real date is known; a wrong date is worse than none.",
  pages: noLastmod, steps: ["Set lastmod from each page's source data in scripts/build-case-studies.mjs."] });

const missingAltPages = pageChecks("alt");
if (missingAltPages.length) suggest({ id: "alt", impact: "low", area: "Images", effort: "Quick fix", title: "Images without alt text",
  why: "Alt text is how Google Images and screen readers understand an image.", pages: pathsOf(missingAltPages), steps: missingAltPages.map(p => `${p.path}: ${detailOf(p, "alt")}`) });

const ogPages = pageChecks("og");
if (ogPages.length) suggest({ id: "og", impact: "medium", area: "Sharing", effort: "Quick fix", title: "Pages without a full social preview",
  why: "Links shared on LinkedIn or Slack show as plain text without an image.", pages: pathsOf(ogPages), steps: ogPages.map(p => `${p.path}: ${detailOf(p, "og")}`) });

if (!llms) suggest({ id: "llms", impact: "medium", area: "AI assistants", effort: "Quick fix", title: "No llms.txt", why: "AI assistants look for /llms.txt as a summary of a site.", steps: ["Add public/llms.txt."] });

const ORDER = { high: 0, medium: 1, low: 2 };
suggestions.sort((a, b) => ORDER[a.impact] - ORDER[b.impact]);

let commit = process.env.GITHUB_SHA?.slice(0, 7) ?? null;
if (!commit) try { commit = execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim(); } catch {}

const report = {
  site: SITE, generatedAt: new Date().toISOString(), commit,
  summary: {
    pages: pages.length, indexable: indexable.length,
    averageScore: Math.round(indexable.reduce((s, p) => s + (p.score ?? 0), 0) / Math.max(1, indexable.length)),
    fails: indexable.reduce((s, p) => s + p.checks.filter(c => c.status === "fail").length, 0) + site.filter(c => c.status === "fail").length,
    warns: indexable.reduce((s, p) => s + p.checks.filter(c => c.status === "warn").length, 0) + site.filter(c => c.status === "warn").length,
  },
  siteChecks: site,
  suggestions,
  pages,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
fs.copyFileSync(path.join(root, "scripts", "seo-dashboard.html"), path.join(outDir, "index.html"));
console.log(`SEO report: ${indexable.length} indexable pages, average score ${report.summary.averageScore}, ${report.summary.fails} fails, ${report.summary.warns} warnings.`);
