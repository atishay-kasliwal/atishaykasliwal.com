import { api, copyText, download, formatBytes, h, nav, shortSha, time } from "../common.js";
import { checkHtml, checkProfileJson, diffJson } from "./checks.js";

const $ = id => document.getElementById(id);
const TARGETS = [
  { key: "profile-json", path: "/api/profile.json", label: "/api/profile.json", kind: "json" },
  { key: "home", path: "/", label: "/", kind: "html" },
  { key: "profile", path: "/profile/", label: "/profile/", kind: "html" },
  { key: "profile-schema", path: "/api/profile.schema.json", label: "/api/profile.schema.json", kind: "json" },
  { key: "llms-txt", path: "/llms.txt", label: "/llms.txt", kind: "text" },
  { key: "robots", path: "/robots.txt", label: "/robots.txt", kind: "text" },
  { key: "resume", path: "/Atishay-Kasliwal-Resume.pdf", label: "résumé PDF", kind: "pdf" },
];
const TEXT_TYPES = /^(text\/|application\/(json|schema\+json|xml|javascript|ld\+json))/;
const AGENT_NAMES = { chrome: "Chrome", gptbot: "GPTBot", claudebot: "ClaudeBot", perplexitybot: "PerplexityBot", googlebot: "Googlebot" };

let context = null;
let current = null;
let target = TARGETS[0];
let tab = null;

function say(message) {
  $("notice").hidden = !message;
  $("notice").textContent = message ?? "";
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

// The browser mode fetches with no cookies, so the response is what a signed-out visitor gets.
async function fetchFromBrowser(item) {
  const fetchedAt = new Date().toISOString();
  const started = performance.now();
  const response = await fetch(item.path, { cache: "no-store", credentials: "omit", redirect: "follow" });
  const headersMs = Math.round(performance.now() - started);
  const buffer = await response.arrayBuffer();
  const totalMs = Math.round(performance.now() - started);
  const contentType = response.headers.get("Content-Type") ?? "";
  return {
    mode: "browser",
    userAgent: navigator.userAgent,
    url: response.url,
    fetchedAt,
    redirects: response.redirected ? [{ status: null, from: new URL(item.path, location.origin).href, to: response.url }] : [],
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
    contentType,
    sizeBytes: buffer.byteLength,
    timing: { headersMs, totalMs },
    sha256: await sha256Hex(buffer),
    body: TEXT_TYPES.test(contentType) ? new TextDecoder().decode(buffer) : null,
    bodyTruncated: false,
  };
}

async function inspect() {
  const agent = $("agent").value;
  $("refresh").disabled = true;
  $("fetched").textContent = "Fetching…";
  say(null);
  try {
    const [ctx, result] = await Promise.all([
      api("/api/admin/responses/context"),
      agent === "browser" ? fetchFromBrowser(target) : api(`/api/admin/responses/fetch?target=${encodeURIComponent(target.key)}&agent=${encodeURIComponent(agent)}`),
    ]);
    context = ctx;
    current = { ...result, target };
    render();
  } catch (error) {
    say(error.message);
  } finally {
    $("refresh").disabled = false;
  }
}

// ---------- Rendering ----------
const pill = (ok, good, bad) => h("span", { class: `pill ${ok ? "good" : "bad"}` }, ok ? good : bad);

function renderVersion(validation) {
  const box = $("version");
  const canonical = context.canonical;
  const expected = context.resume.expected;
  const live = validation?.resume?.live ?? null;
  box.replaceChildren(
    h(
      "dl",
      { class: "card-grid" },
      h("div", {}, h("dt", {}, "Profile schema"), h("dd", {}, canonical.schemaVersion)),
      h("div", {}, h("dt", {}, "Profile last updated"), h("dd", {}, canonical.lastUpdated)),
      h("div", {}, h("dt", {}, "Résumé expected"), h("dd", { title: expected?.sha256 ?? "" }, expected ? `${expected.id} · ${expected.source}` : "—")),
      h("div", {}, h("dt", {}, "Résumé published"), h("dd", {}, expected?.publishedAt ? time(expected.publishedAt) : "bundled with deploy")),
      validation?.resume
        ? h("div", {}, h("dt", {}, "Live JSON names"), h("dd", { class: "match" }, live ? `${live.id} · ${live.source}` : "no version", " ", pill(validation.resume.matches, "match", "mismatch")))
        : null,
      h("div", {}, h("dt", {}, "Checked"), h("dd", {}, time(context.checkedAt))),
    ),
  );
}

function renderSummary() {
  const r = current;
  const header = name => r.headers.find(([key]) => key.toLowerCase() === name)?.[1] ?? "—";
  $("summary").replaceChildren(
    h(
      "dl",
      { class: "card-grid" },
      h("div", {}, h("dt", {}, "Status"), h("dd", {}, pill(r.status >= 200 && r.status < 300, `${r.status} ${r.statusText || ""}`.trim(), `${r.status} ${r.statusText || ""}`.trim()))),
      h("div", {}, h("dt", {}, "Content type"), h("dd", {}, r.contentType || "—")),
      h("div", {}, h("dt", {}, "Size"), h("dd", {}, `${formatBytes(r.sizeBytes)}${r.bodyTruncated ? " (body truncated)" : ""}`)),
      h("div", {}, h("dt", {}, "Time"), h("dd", {}, `${r.timing.headersMs} ms to headers · ${r.timing.totalMs} ms total`)),
      h("div", {}, h("dt", {}, "Cache-Control"), h("dd", {}, header("cache-control"))),
      h("div", {}, h("dt", {}, "Edge cache"), h("dd", {}, header("cf-cache-status"))),
      h("div", {}, h("dt", {}, "SHA-256"), h("dd", { title: r.sha256 }, shortSha(r.sha256))),
      h("div", {}, h("dt", {}, "Fetched"), h("dd", {}, time(r.fetchedAt))),
      h("div", {}, h("dt", {}, "Request"), h("dd", {}, r.mode === "browser" ? "Your browser, signed out" : h("span", { class: "pill warning", title: "Only the User-Agent header is the crawler's. The request comes from this site's server, not the provider." }, `Simulated ${AGENT_NAMES[r.agent] ?? r.agent}`))),
    ),
    h("p", { class: "muted mono" }, r.url),
    ...r.redirects.map(hop => h("p", { class: "muted mono" }, `${hop.status ?? "redirect"} ${hop.from} → ${hop.to}`)),
    h("p", { class: "muted mono" }, `User-Agent: ${r.userAgent}`),
    r.mode === "browser" ? null : h("p", { class: "soft" }, "Simulated request: the crawler's User-Agent sent from this site's server. Not a verified request from the provider."),
  );
  $("fetched").textContent = `Fetched ${new Date(r.fetchedAt).toLocaleTimeString()}`;
}

function issueGroup(title, severity, items, render) {
  return h(
    "div",
    { class: "issue-group" },
    h("h3", { class: "label" }, title, h("span", { class: `pill ${items.length ? severity : "good"}` }, String(items.length))),
    items.length ? h("ul", {}, items.map(render)) : null,
  );
}

function validate() {
  const r = current;
  if (r.target.key === "profile-json") {
    if (r.body === null) return { groups: [issueGroup("Body", "error", ["The response has no JSON body."], text => h("li", {}, text))] };
    const result = checkProfileJson(r.body, context);
    if (result.parseError) return { result, groups: [issueGroup("JSON", "error", [result.parseError], text => h("li", {}, text))] };
    const path = item => h("li", {}, h("span", { class: "mono" }, item.path));
    const change = item => h("li", {}, h("span", { class: "mono" }, item.path), h("span", { class: "soft mono" }, `expected ${item.expected}`), h("span", { class: "mono" }, `live ${item.live}`));
    return {
      result,
      groups: [
        issueGroup("Schema errors", "error", result.schemaErrors, text => h("li", { class: "mono" }, text)),
        issueGroup("Missing fields", "error", result.missing, path),
        issueGroup("Inconsistencies with the canonical profile", "error", result.inconsistent, change),
        issueGroup("Fields not in the canonical profile", "warning", result.unexpected, path),
        issueGroup("Phrases a review item keeps out", "error", result.forbidden, item => h("li", {}, `“${item.phrase}” · review ${item.reviewItem} (${item.status})`)),
        issueGroup("Résumé reference", "error", result.resume.matches ? [] : [result.resume], () => h("li", {}, `The live JSON names ${result.resume.live?.id ?? "no version"}; the public URL should serve ${result.resume.expected?.id ?? "—"}. A cached or older deploy may be answering.`)),
      ],
    };
  }
  if (r.target.kind === "html") {
    if (r.body === null) return { groups: [issueGroup("Body", "error", ["The response has no HTML body."], text => h("li", {}, text))] };
    const result = checkHtml(r.body, r.target.key, { canonical: context.canonical, reviewItems: context.reviewItems });
    return {
      result,
      groups: [
        issueGroup("Errors", "error", result.issues.filter(i => i.severity === "error"), i => h("li", {}, i.message)),
        issueGroup("Warnings", "warning", result.issues.filter(i => i.severity !== "error"), i => h("li", {}, i.message)),
      ],
    };
  }
  if (r.target.key === "profile-schema" && r.body !== null) {
    let live = null;
    try {
      live = JSON.parse(r.body);
    } catch (error) {
      return { groups: [issueGroup("JSON", "error", [error.message], text => h("li", {}, text))] };
    }
    const diff = diffJson(context.schema, live);
    const all = [...diff.missing, ...diff.inconsistent, ...diff.unexpected];
    return { groups: [issueGroup("Differences from the deployed schema", "error", all, item => h("li", { class: "mono" }, item.path))] };
  }
  if (r.target.key === "resume") {
    const expected = context.resume.expected;
    const ok = expected && r.sha256 === expected.sha256;
    const problems = [];
    if (!r.contentType.startsWith("application/pdf")) problems.push(`Content-Type is ${r.contentType || "missing"}.`);
    if (!ok) problems.push(`Served ${shortSha(r.sha256)}; expected ${expected ? `${expected.id} (${expected.source})` : "—"}.`);
    return { groups: [issueGroup("Résumé", "error", problems, text => h("li", {}, text))] };
  }
  return { groups: [h("p", { class: "muted" }, "No canonical checks for this response.")] };
}

// ---------- Body views ----------
function jsonTree(value, key = null, depth = 0) {
  const label = key === null ? null : h("span", { class: "key" }, `${JSON.stringify(key)}: `);
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value) ? value.map((item, i) => [i, item]) : Object.entries(value);
    const open = Array.isArray(value) ? "[" : "{";
    const close = Array.isArray(value) ? "]" : "}";
    const details = h(
      "details",
      { open: depth < 2 },
      h("summary", {}, label, open, h("span", { class: "count" }, ` ${entries.length} ${Array.isArray(value) ? "items" : "keys"} `), close),
    );
    details.addEventListener("toggle", () => {
      if (!details.open || details.dataset.filled) return;
      details.dataset.filled = "1";
      details.append(...entries.map(([k, v]) => jsonTree(v, Array.isArray(value) ? null : k, depth + 1)));
    });
    if (details.open) {
      details.dataset.filled = "1";
      details.append(...entries.map(([k, v]) => jsonTree(v, Array.isArray(value) ? null : k, depth + 1)));
    }
    return details;
  }
  const kind = value === null ? "null" : typeof value;
  return h("div", { class: "leaf" }, label, h("span", { class: kind }, JSON.stringify(value)));
}

function setAll(open) {
  const root = $("body").querySelector(".json-tree");
  if (!root) return;
  // Opening fills children lazily, so repeat until nothing new appears.
  for (let pass = 0; pass < 12; pass += 1) {
    const closed = [...root.querySelectorAll("details")].filter(d => d.open !== open);
    if (!closed.length) break;
    for (const d of closed) d.open = open;
    if (!open) break;
  }
}

function tabsFor(r) {
  if (r.body === null) return [];
  if (r.target.kind === "json") return ["Formatted", "Raw"];
  if (r.target.kind === "html") return ["Raw HTML", "Rendered without JavaScript", "Extracted"];
  return ["Raw"];
}

function renderBody(validation) {
  const r = current;
  const box = $("body");
  const tabs = tabsFor(r);
  if (!tabs.includes(tab)) tab = tabs[0] ?? null;
  $("tabs").replaceChildren(
    ...tabs.map(name => {
      const button = h("button", { type: "button", role: "tab", "aria-selected": String(name === tab) }, name);
      button.addEventListener("click", () => {
        tab = name;
        renderBody(validation);
      });
      return button;
    }),
  );
  $("expand").hidden = $("collapse").hidden = tab !== "Formatted";
  if (r.body === null) {
    box.replaceChildren(
      h("pre", {}, r.target.kind === "pdf" ? `Binary PDF, ${formatBytes(r.sizeBytes)}, sha256 ${r.sha256}.` : "No text body."),
      r.target.kind === "pdf" ? h("div", { class: "card-actions pdf-actions" }, h("a", { href: r.target.path, target: "_blank", rel: "noopener" }, "Open the PDF ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗"))) : null,
    );
    return;
  }
  if (tab === "Formatted") {
    try {
      box.replaceChildren(h("div", { class: "json-tree" }, jsonTree(JSON.parse(r.body))));
    } catch (error) {
      box.replaceChildren(h("pre", {}, `Not valid JSON: ${error.message}\n\n${r.body}`));
    }
  } else if (tab === "Rendered without JavaScript") {
    // An empty sandbox: no scripts, no forms, no same-origin access. Shows what a crawler that
    // does not run JavaScript would render.
    box.replaceChildren(h("iframe", { sandbox: "", srcdoc: r.body, title: `${r.target.label} rendered without JavaScript`, referrerpolicy: "no-referrer" }));
  } else if (tab === "Extracted") {
    const x = validation.result?.extracted;
    box.replaceChildren(
      h(
        "div",
        { class: "extracted" },
        h("dl", { class: "card-grid" }, ...[["Title", x.title], ["Description", x.description], ["Canonical", x.canonical], ["Robots", x.robots ?? "—"], ["H1", x.h1.join(" | ") || "—"], ["Visible text", `${x.textLength.toLocaleString("en-US")} characters`], ["Links", String(x.links.length)]].map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v ?? "—")))),
        h("details", {}, h("summary", {}, `Structured data (${x.jsonLd.length} block${x.jsonLd.length === 1 ? "" : "s"})`), h("pre", {}, JSON.stringify(x.jsonLd, null, 2))),
        h("details", {}, h("summary", {}, "Links"), h("pre", {}, x.links.join("\n"))),
        h("details", {}, h("summary", {}, "Visible text"), h("pre", {}, x.text)),
      ),
    );
  } else {
    box.replaceChildren(h("pre", {}, r.body));
  }
}

function renderHeaders() {
  $("headers").replaceChildren(
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Header"), h("th", { scope: "col" }, "Value"))),
    h("tbody", {}, current.headers.map(([name, value]) => h("tr", {}, h("td", { class: "mono" }, name), h("td", { class: "mono" }, value)))),
  );
}

function render() {
  const validation = validate();
  renderVersion(validation.result);
  renderSummary();
  $("validation").replaceChildren(h("div", { class: "issue-groups" }, validation.groups));
  renderBody(validation);
  renderHeaders();
}

function bodyForExport() {
  if (!current) return null;
  if (current.body === null) return null;
  if (current.target.kind === "json" && tab === "Formatted") {
    try {
      return JSON.stringify(JSON.parse(current.body), null, 2);
    } catch {
      return current.body;
    }
  }
  return current.body;
}

function wire() {
  $("nav").append(nav("responses"));
  const group = $("targets");
  for (const item of TARGETS) {
    const button = h("button", { type: "button", "aria-pressed": String(item === target) }, item.label);
    button.addEventListener("click", () => {
      target = item;
      for (const b of group.children) b.setAttribute("aria-pressed", String(b === button));
      inspect();
    });
    group.append(button);
  }
  $("agent").addEventListener("change", inspect);
  $("refresh").addEventListener("click", inspect);
  $("expand").addEventListener("click", () => setAll(true));
  $("collapse").addEventListener("click", () => setAll(false));
  $("copy").addEventListener("click", async () => {
    const text = bodyForExport();
    if (text === null) return say("This response has no text body to copy.");
    $("copy").textContent = (await copyText(text)) ? "Copied" : "Copy failed";
    setTimeout(() => ($("copy").textContent = "Copy"), 1500);
  });
  $("download").addEventListener("click", () => {
    const text = bodyForExport();
    if (text === null) return window.open(current?.target.path ?? "/", "_blank", "noopener");
    const stamp = current.fetchedAt.replace(/[:.]/g, "-");
    const extension = current.target.kind === "json" ? "json" : current.target.kind === "html" ? "html" : "txt";
    download(`${current.target.key}-${stamp}.${extension}`, text, current.contentType || "text/plain");
  });
}

wire();
inspect();
