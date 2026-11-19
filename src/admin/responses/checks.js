// Checks for the response inspector (/admin/responses). Pure functions with no DOM or Node
// dependencies, so the admin page runs them in the browser and tests/admin runs them in Node.
//
// "Canonical" is the profile built for the deployed commit (the static /api/profile.json in the
// asset store). A live /api/profile.json should equal it, except for the résumé reference, which
// must name the version currently published from /admin/resume.
import { validateSchema } from "../../profile/schema-check.js";
import { withActiveResume } from "../../resume-core/overlay.js";

const SITE = "https://atishaykasliwal.com";
const LIMIT = 300;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const typeOf = value => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);
const preview = value => {
  const text = typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value) ?? String(value);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};
const idOf = item => (item && typeof item === "object" && !Array.isArray(item) && (typeof item.id === "string" || typeof item.id === "number") ? String(item.id) : null);

// What the live JSON should be: the canonical profile with the published résumé swapped in.
export function expectedProfile(canonical, resume) {
  if (resume?.source !== "published") return canonical;
  return withActiveResume(canonical, { sha256: resume.sha256, published_at: resume.publishedAt });
}

export function diffJson(expected, live) {
  const missing = [];
  const unexpected = [];
  const inconsistent = [];
  const push = (list, item) => list.length < LIMIT && list.push(item);
  function walk(want, got, path) {
    if (typeOf(want) !== typeOf(got)) return push(inconsistent, { path, expected: preview(want), live: preview(got) });
    if (Array.isArray(want)) {
      const keyed = want.length > 0 && want.every(idOf) && got.every(idOf);
      if (keyed) {
        const liveById = new Map(got.map(item => [idOf(item), item]));
        const wantIds = new Set(want.map(idOf));
        for (const item of want) {
          const match = liveById.get(idOf(item));
          if (!match) push(missing, { path: `${path}[id=${idOf(item)}]` });
          else walk(item, match, `${path}[id=${idOf(item)}]`);
        }
        for (const item of got) if (!wantIds.has(idOf(item))) push(unexpected, { path: `${path}[id=${idOf(item)}]` });
        return;
      }
      if (want.length !== got.length) push(inconsistent, { path: `${path}.length`, expected: String(want.length), live: String(got.length) });
      for (let i = 0; i < Math.min(want.length, got.length); i += 1) walk(want[i], got[i], `${path}[${i}]`);
      return;
    }
    if (typeOf(want) === "object") {
      for (const key of Object.keys(want)) {
        if (!(key in got)) push(missing, { path: `${path}.${key}` });
        else walk(want[key], got[key], `${path}.${key}`);
      }
      for (const key of Object.keys(got)) if (!(key in want)) push(unexpected, { path: `${path}.${key}` });
      return;
    }
    if (want !== got) push(inconsistent, { path, expected: preview(want), live: preview(got) });
  }
  walk(expected, live, "$");
  return { missing, unexpected, inconsistent };
}

export function forbiddenPhrases(text, reviewItems = []) {
  const haystack = String(text).toLowerCase();
  const found = [];
  for (const item of reviewItems) {
    for (const phrase of item.mustNotAppear ?? []) {
      if (haystack.includes(phrase.toLowerCase())) found.push({ phrase, reviewItem: item.id, status: item.status });
    }
  }
  return found;
}

export function checkProfileJson(bodyText, { canonical, schema, reviewItems = [], resume = null }) {
  let live;
  try {
    live = JSON.parse(bodyText);
  } catch (error) {
    return { parseError: error.message, schemaErrors: [], missing: [], unexpected: [], inconsistent: [], forbidden: [], resume: null, version: null };
  }
  const schemaErrors = schema ? validateSchema(schema, live) : ["The schema could not be loaded."];
  const expected = expectedProfile(canonical, resume?.expected);
  const { missing, unexpected, inconsistent } = diffJson(expected, live);
  const liveVersion = live?.profile?.resume?.version ?? null;
  const want = resume?.expected ?? null;
  return {
    parseError: null,
    schemaErrors,
    missing,
    unexpected,
    inconsistent,
    forbidden: forbiddenPhrases(bodyText, reviewItems),
    version: {
      schemaVersion: live?.schemaVersion ?? null,
      lastUpdated: live?.lastUpdated ?? null,
      canonicalSchemaVersion: canonical?.schemaVersion ?? null,
      canonicalLastUpdated: canonical?.lastUpdated ?? null,
    },
    resume: {
      live: liveVersion,
      expected: want,
      matches: Boolean(liveVersion && want && liveVersion.sha256 === want.sha256),
    },
  };
}

// ---------- HTML ----------
const decodeEntities = text =>
  String(text)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const attr = (tag, name) => decodeEntities(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag)?.slice(2).find(v => v !== undefined) ?? "") || null;
const collapse = text => text.replace(/[‐-―]/g, "-").replace(/\s+/g, " ").trim();

// What a crawler that does not run JavaScript reads from a page.
export function extractHtml(html) {
  const source = String(html);
  const tags = name => [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(match => match[0]);
  const meta = name => tags("meta").find(tag => (attr(tag, "name") ?? attr(tag, "property"))?.toLowerCase() === name);
  const jsonLd = [];
  const jsonLdErrors = [];
  for (const match of source.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(match[1]));
    } catch (error) {
      jsonLdErrors.push(error.message);
    }
  }
  const visible = collapse(
    decodeEntities(
      source
        .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  );
  const canonicalTag = tags("link").find(tag => attr(tag, "rel")?.toLowerCase() === "canonical");
  return {
    title: collapse(decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(source)?.[1] ?? "")) || null,
    description: meta("description") ? attr(meta("description"), "content") : null,
    robots: meta("robots") ? attr(meta("robots"), "content") : null,
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    h1: [...source.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => collapse(decodeEntities(match[1].replace(/<[^>]+>/g, " ")))),
    links: [...new Set(tags("a").map(tag => attr(tag, "href")).filter(Boolean))],
    jsonLd,
    jsonLdErrors,
    text: visible,
    textLength: visible.length,
  };
}

const graphNodes = blocks => blocks.flatMap(block => (Array.isArray(block) ? block : block?.["@graph"] ?? [block]));
const formats = ym => {
  if (!ym) return ["Present"];
  if (/^\d{4}$/.test(ym)) return [ym];
  const [year, month] = ym.split("-").map(Number);
  return [`${MONTHS[month - 1]} ${year}`, `${LONG[month - 1]} ${year}`];
};

export function checkHtml(html, page, { canonical, reviewItems = [], resumePath = "/Atishay-Kasliwal-Resume.pdf" }) {
  const extracted = extractHtml(html);
  const issues = [];
  const issue = (severity, message) => issues.push({ severity, message });
  const expectedCanonical = page === "home" ? `${SITE}/` : `${SITE}/profile/`;
  if (!extracted.title) issue("error", "No <title>.");
  if (!extracted.description) issue("error", "No meta description.");
  if (extracted.canonical !== expectedCanonical) issue("error", `Canonical link is ${extracted.canonical ?? "missing"}; expected ${expectedCanonical}.`);
  if (/noindex/i.test(extracted.robots ?? "")) issue("error", `robots meta says "${extracted.robots}".`);
  if (extracted.jsonLdErrors.length) issue("error", `JSON-LD does not parse: ${extracted.jsonLdErrors.join("; ")}`);

  const profile = canonical?.profile;
  const person = graphNodes(extracted.jsonLd).find(node => [].concat(node?.["@type"]).includes("Person"));
  if (!person) issue("error", "No Person in the structured data.");
  else if (profile) {
    if (person.name !== profile.name) issue("error", `Person.name is "${person.name}"; canonical is "${profile.name}".`);
    if (person.jobTitle !== profile.headline) issue("error", `Person.jobTitle is "${person.jobTitle}"; canonical is "${profile.headline}".`);
    const sameAs = new Set([].concat(person.sameAs ?? []));
    for (const link of profile.profiles ?? []) if (!sameAs.has(link.url)) issue("warning", `Person.sameAs is missing ${link.url}.`);
  }

  const links = new Set(extracted.links.map(href => href.replace(SITE, "")));
  if (!links.has(resumePath)) issue("error", `No link to the résumé at ${resumePath}.`);
  if (page === "home" && !links.has("/profile/")) issue("error", "No link to /profile/.");
  if (page === "profile" && !links.has("/api/profile.json")) issue("error", "No link to /api/profile.json.");

  if (page === "profile" && canonical) {
    const text = extracted.text.toLowerCase();
    for (const role of [...(canonical.experience ?? []), ...(canonical.education ?? [])]) {
      const name = role.organization?.name ?? role.institution?.name;
      if (name && !text.includes(name.toLowerCase())) issue("error", `${name} does not appear on the page.`);
      const ranges = formats(role.startDate).flatMap(start => formats(role.endDate).map(end => `${start} - ${end}`.toLowerCase()));
      if (!ranges.some(range => text.includes(range))) issue("error", `${name}: the dates ${formats(role.startDate)[0]} – ${formats(role.endDate)[0]} do not appear on the page.`);
    }
    for (const found of forbiddenPhrases(extracted.text, reviewItems)) issue("error", `"${found.phrase}" appears; review item ${found.reviewItem} keeps it out of the profile.`);
  }
  return { extracted, issues };
}
