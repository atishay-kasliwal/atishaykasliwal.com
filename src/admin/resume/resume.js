import { api, ApiError, formatBytes, h, nav, shortSha, time } from "../common.js";
import { showPdf } from "./paper.js";

// Résumé admin on one screen: a rail (what is live, versions, activity), the review of the
// selected version (summary, findings, publishing) and the résumé itself drawn as paper. The full
// PDF check runs here in the browser; the Pages Function only screens the file, to stay within
// the Workers Free plan's CPU limit.

const $ = id => document.getElementById(id);
const notice = $("notice");
const BUNDLED = "bundled";
const BUNDLED_URL = "/api/admin/resume/bundled";

// pdf.js is large, so the checker loads on the first upload or re-check.
let checker = null;
const loadChecker = () => (checker ??= import("../../resume-core/report.js"));
let context = null;
const loadContext = async () => (context ??= await api("/api/admin/resume/context"));

let state = null;
let selected = null;
let tab = "Findings";

const ACTION_LABELS = { upload: "Uploaded", upload_duplicate: "Re-uploaded", upload_rejected: "Rejected", publish: "Published", restore: "Restored", recheck: "Re-checked" };
const GROUPS = {
  conflict: ["Conflicts", "The résumé contradicts the profile. Fix the PDF, or acknowledge them when publishing."],
  unverified: ["To verify", "On the résumé, but nothing on the site backs it. These never block publishing."],
  info: ["Notes", "Worth knowing. Nothing to fix."],
};
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const arrow = (symbol = "↗") => h("span", { class: "arrow", "aria-hidden": "true" }, symbol);
const shortDate = iso => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

function say(message, tone = "error") {
  notice.hidden = !message;
  notice.textContent = message ?? "";
  notice.className = `notice rz-notice ${tone === "error" ? "" : tone}`.trim();
}

function tally(summary) {
  if (!summary) return h("span", { class: "rz-tally muted" }, "Not checked");
  return h(
    "span",
    { class: "rz-tally" },
    h("span", { class: summary.conflict ? "is-bad" : "is-good" }, plural(summary.conflict, "conflict")),
    summary.unverified ? h("span", { class: "is-warn" }, `${summary.unverified} to verify`) : "",
  );
}

// ---------- What is live ----------
const FALLBACK_REASONS = {
  "nothing-published": "Nothing has been published from the admin yet.",
  "storage-missing": "The R2 binding RESUMES is not configured, so the published version cannot be read.",
  "published-file-missing": "The published version's file is missing from R2.",
  "storage-error": "R2 could not be read.",
};

function expectedLive() {
  if (state.serving.source === "published") return { id: state.active.id, sha256: state.active.sha256, source: "published" };
  return state.bundled ? { id: state.bundled.id, sha256: state.bundled.sha256, source: "bundled" } : null;
}

// Fetch the public URL signed out, as a visitor would, and compare the bytes with what should be live.
async function liveCheck() {
  const box = $("live-check");
  if (!box) return;
  const expected = expectedLive();
  box.replaceChildren(h("span", { class: "muted" }, "Checking the public URL…"));
  try {
    const response = await fetch(state.publicPath, { cache: "no-store", credentials: "omit" });
    const digest = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
    const sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const ok = response.ok && expected && sha256 === expected.sha256;
    box.replaceChildren(
      ok
        ? h("span", { class: "good", title: `${response.status} · ${sha256}` }, "✓ Public URL verified")
        : h("span", { class: "bad" }, `✕ Public URL serves ${sha256.slice(0, 12)}, expected ${expected?.source ?? "?"} ${expected?.id ?? ""}. A stale deploy or cache may be answering.`),
    );
  } catch (error) {
    box.replaceChildren(h("span", { class: "bad" }, `✕ ${error.message}`));
  }
}

function renderLive() {
  const published = state.serving.source === "published";
  const conflicts = state.bundled?.report?.consistency?.summary?.conflict ?? 0;
  const fellBack = !published && state.serving.reason !== "nothing-published";
  const tone = published ? "good" : fellBack || conflicts ? "bad" : "good";
  const title = published
    ? shortDate(state.active.publishedAt)
    : fellBack
      ? "Fallback: the public URL is serving the bundled PDF, not the published version"
      : conflicts
        ? "An outdated résumé is live"
        : "The bundled résumé is live";
  const detail = published
    ? `${state.active.filename} · published by ${state.active.publishedBy}`
    : fellBack
      ? `${FALLBACK_REASONS[state.serving.reason] ?? ""} Check the R2 bucket and binding, then republish.`
      : conflicts
        ? `The PDF bundled with the deploy contradicts the profile in ${plural(conflicts, "place")}.`
        : "The PDF bundled with the deploy. Publish a version to replace it.";
  $("published").replaceChildren(
    h("p", { class: `label rz-live-label ${tone}` }, h("i", { "aria-hidden": "true" }), "Live now"),
    h("button", { type: "button", class: "rz-live-title", onclick: () => select(published ? state.active.id : BUNDLED) }, title),
    h("p", { class: "rz-live-detail" }, detail),
    h("p", { class: "rz-live-check", id: "live-check" }),
    h(
      "p",
      { class: "rz-live-links" },
      h("a", { href: state.publicPath, target: "_blank", rel: "noopener" }, "Open ", arrow()),
      h("button", { type: "button", class: "link", onclick: liveCheck }, "Check again"),
      h("a", { href: "/admin/responses/" }, "Inspect ", arrow("→")),
    ),
  );
  liveCheck();
}

// ---------- Versions ----------
function statusOf(version) {
  if (version === BUNDLED) return state.serving.source === "bundled" ? ["live", "Live"] : ["fallback", "Fallback"];
  if (version.active) return ["live", "Live"];
  if (version.firstPublishedAt) return ["past", "Was live"];
  return ["draft", "Draft"];
}

function versionItem({ id, title, sub, status: [kind, label], summary }) {
  const current = selected === id;
  return h(
    "li",
    {},
    h(
      "button",
      { type: "button", class: `rz-item${current ? " is-selected" : ""}`, "aria-pressed": String(current), onclick: () => select(id) },
      h("span", { class: "rz-item-top" }, h("span", { class: "rz-item-title" }, title), h("span", { class: `rz-status ${kind}` }, label)),
      h("span", { class: "rz-item-sub" }, sub),
      tally(summary),
    ),
  );
}

function renderVersions() {
  const items = state.versions.map(version =>
    versionItem({ id: version.id, title: shortDate(version.uploadedAt), sub: version.filename, status: statusOf(version), summary: version.report?.summary }),
  );
  if (!items.length) items.push(h("li", { class: "rz-empty" }, "No uploads yet. Drop a PDF anywhere on this page."));
  if (state.bundled) items.push(versionItem({ id: BUNDLED, title: "Bundled PDF", sub: "Ships with every deploy", status: statusOf(BUNDLED), summary: state.bundled.report?.consistency?.summary }));
  $("versions").replaceChildren(...items);
}

function historyDetail(entry) {
  const d = entry.detail ?? {};
  if (entry.action === "upload_rejected") return d.errors?.join(" ") ?? d.reason ?? "";
  if (entry.action === "publish" || entry.action === "restore") return [d.previousVersionId ? `replaced ${d.previousVersionId}` : "replaced the bundled PDF", d.reason ? `“${d.reason}”` : null].filter(Boolean).join(" · ");
  const c = d.consistency;
  return [d.filename, c ? `${plural(c.conflict, "conflict")}, ${c.unverified} to verify` : null].filter(Boolean).join(" · ");
}

function renderHistory() {
  $("history-count").textContent = state.audit.length ? `· ${state.audit.length}` : "";
  $("history").replaceChildren(
    ...(state.audit.length
      ? state.audit.map(entry =>
          h(
            "li",
            {},
            h("span", { class: "rz-log-head" }, h("span", { class: `rz-log-action ${entry.action}` }, ACTION_LABELS[entry.action] ?? entry.action), h("span", { class: "muted", title: entry.sha256 ?? "" }, entry.versionId ?? (entry.sha256 ? shortSha(entry.sha256) : ""))),
            historyDetail(entry) ? h("span", { class: "rz-log-detail" }, historyDetail(entry)) : "",
            h("span", { class: "rz-log-when" }, time(entry.at), ` · ${entry.actor}`),
          ),
        )
      : [h("li", { class: "rz-empty" }, "No activity yet.")]),
  );
}

// ---------- Findings ----------
// Wrap each of `terms` inside `text` in a highlight.
function highlight(text, terms) {
  const unique = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return [text];
  const nodes = [];
  let rest = String(text);
  for (;;) {
    let at = -1;
    let term = null;
    for (const candidate of unique) {
      const index = rest.indexOf(candidate);
      if (index !== -1 && (at === -1 || index < at)) [at, term] = [index, candidate];
    }
    if (at === -1) break;
    nodes.push(rest.slice(0, at), h("strong", { class: "rz-hl" }, term));
    rest = rest.slice(at + term.length);
  }
  nodes.push(rest);
  return nodes;
}

const metricTerms = item => [...new Set((/^(.*?) (?:does|do) not appear anywhere/.exec(item.message)?.[1] ?? "").split(", "))];
const quotedTerm = item => /^"([^"]+)"/.exec(item.message)?.[1];

function findingRow(item) {
  if (item.severity === "unverified" && item.category === "accomplishments" && item.resume) {
    const terms = metricTerms(item);
    return h("li", { class: "rz-f" }, h("p", { class: "rz-f-quote" }, highlight(item.resume, terms)), h("p", { class: "rz-f-note" }, `${terms.join(", ")} ${terms.length === 1 ? "isn't" : "aren't"} on the site`));
  }
  const compare = item.severity === "conflict" && (item.resume || item.canonical);
  return h(
    "li",
    { class: "rz-f" },
    h("p", { class: "rz-f-msg" }, item.message),
    compare
      ? h(
          "dl",
          { class: "rz-f-compare" },
          item.resume ? [h("dt", {}, "Résumé"), h("dd", {}, highlight(item.resume, [quotedTerm(item)]))] : "",
          item.canonical ? [h("dt", {}, "Profile"), h("dd", {}, item.canonical)] : "",
        )
      : "",
    item.reviewItem ? h("p", { class: "rz-f-note", title: item.reviewItem.resolution ?? "" }, `Review item ${item.reviewItem.id} · ${item.reviewItem.status}`) : "",
  );
}

function findings(consistency) {
  if (!consistency?.items?.length) return h("p", { class: "rz-clear" }, "✓ Everything on the résumé matches the profile.");
  return h(
    "div",
    { class: "rz-groups" },
    Object.entries(GROUPS).map(([severity, [label, explain]]) => {
      const items = consistency.items.filter(item => item.severity === severity);
      if (!items.length) return "";
      const skills = severity === "unverified" ? items.filter(item => item.category === "skills") : [];
      const rest = items.filter(item => !skills.includes(item));
      return h(
        "section",
        { class: `rz-group ${severity}` },
        h("h3", { class: "rz-group-head" }, h("span", {}, label), h("span", { class: "rz-group-count" }, items.length)),
        h("p", { class: "rz-group-explain" }, explain),
        h(
          "ul",
          { class: "rz-fs" },
          skills.length ? h("li", { class: "rz-f" }, h("p", { class: "rz-f-msg" }, `${plural(skills.length, "skill")} with no evidence on the site`), h("p", { class: "rz-chips" }, skills.map(item => h("span", { class: "rz-chip" }, item.resume)))) : "",
          rest.map(findingRow),
        ),
      );
    }),
  );
}

function checksList(validation) {
  return h(
    "ul",
    { class: "checks" },
    validation.checks.map(item =>
      h("li", {}, h("span", { class: `mark ${item.ok ? "ok" : "fail"}`, "aria-label": item.ok ? "passed" : "failed" }, item.ok ? "✓" : "✕"), h("span", {}, item.label), h("span", { class: "soft" }, item.detail)),
    ),
  );
}

// ---------- Publishing ----------
async function publish(version, { acknowledge, reason, button }) {
  button.disabled = true;
  say(null);
  try {
    const result = await api(`/api/admin/resume/versions/${version.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha256: version.sha256, acknowledgeConflicts: acknowledge, reason }),
    });
    say(`${result.action === "restore" ? "Restored" : "Published"}. ${state.publicPath} and /api/profile.json now serve it.`, "ok");
    await load();
  } catch (error) {
    say(error.message);
    button.disabled = false;
  }
}

function publishPanel(version) {
  if (version.active) return h("div", { class: "rz-action is-live" }, h("p", { class: "rz-action-title" }, "This version is published."), h("p", { class: "rz-action-sub" }, `Visitors get it at ${state.publicPath}.`));
  const conflicts = version.report?.consistency?.summary?.conflict ?? 0;
  const verb = version.firstPublishedAt ? "Restore" : "Publish";
  const acknowledge = h("input", { type: "checkbox", id: "acknowledge" });
  const reason = h("input", { type: "text", id: "reason", maxlength: "300", placeholder: "Note for the history (optional)", "aria-label": "Note for the history" });
  const button = h("button", { type: "button", class: "primary", id: "publish-button", disabled: conflicts > 0 }, `${verb} this version`);
  acknowledge.addEventListener("change", () => {
    button.disabled = conflicts > 0 && !acknowledge.checked;
  });
  button.addEventListener("click", () => {
    if (!window.confirm(`${verb} this version at ${state.publicPath}? Visitors get it on their next request.`)) return;
    publish(version, { acknowledge: acknowledge.checked, reason: reason.value, button });
  });
  return h(
    "div",
    { class: `rz-action ${conflicts ? "has-conflicts" : "is-ready"}` },
    h("p", { class: "rz-action-title" }, conflicts ? `${plural(conflicts, "conflict")} to review` : version.firstPublishedAt ? "Ready to restore" : "Ready to publish"),
    conflicts ? h("label", { for: "acknowledge", class: "rz-ack" }, acknowledge, h("span", {}, "Publish anyway. The profile does not change.")) : "",
    h("div", { class: "rz-action-row" }, reason, button),
  );
}

// ---------- The selected version ----------
function tabs(names, render) {
  const panel = h("div", { class: "rz-panel", role: "tabpanel" });
  if (!names.some(name => name.startsWith(tab))) tab = names[0];
  const bar = h(
    "div",
    { class: "rz-tabs", role: "tablist" },
    names.map(name => {
      const button = h("button", { type: "button", role: "tab", "aria-selected": String(name.startsWith(tab)) }, name);
      button.addEventListener("click", () => {
        tab = name.split(" ")[0];
        bar.querySelectorAll("[role=tab]").forEach(node => node.setAttribute("aria-selected", String(node === button)));
        panel.replaceChildren(render(name));
      });
      return button;
    }),
  );
  panel.replaceChildren(render(names.find(name => name.startsWith(tab))));
  return [bar, panel];
}

function stats(summary) {
  const stat = (key, value, label) => h("div", { class: `rz-stat ${key}${value ? " has" : ""}`, "data-stat": key }, h("span", { class: "rz-stat-n" }, value ?? "—"), h("span", { class: "rz-stat-l" }, label));
  return h("div", { class: "rz-stats" }, stat("conflict", summary?.conflict, "Conflicts"), stat("unverified", summary?.unverified, "To verify"), stat("info", summary?.info, "Notes"));
}

function renderSelection({ title, status, filename, meta, action, report, pdfUrl, recheck }) {
  const checks = report?.validation?.checks ?? [];
  const names = ["Findings", ...(checks.length ? [`Checks ${checks.filter(item => item.ok).length}/${checks.length}`] : []), ...(report?.text?.length ? ["Text"] : [])];
  const [bar, panel] = tabs(names, name =>
    name === "Findings"
      ? h("div", {}, ...(report?.validation?.warnings ?? []).map(warning => h("p", { class: "notice info" }, warning)), findings(report?.consistency))
      : name === "Text"
        ? h("pre", { class: "text rz-text" }, report.text.join("\n"))
        : checksList(report.validation),
  );
  $("review").replaceChildren(
    h("header", { class: "rz-sel-head" }, h("p", { class: "label" }, "Reviewing"), h("h2", { class: "rz-sel-title" }, title, h("span", { class: `rz-status ${status[0]}` }, status[1])), h("p", { class: "rz-sel-meta" }, meta)),
    action,
    stats(report?.consistency?.summary),
    bar,
    panel,
    h("footer", { class: "rz-sel-foot" }, recheck ?? "", report?.checkedAt ? h("span", { class: "muted" }, "Checked ", time(report.checkedAt)) : ""),
  );
  const sheet = h("div", { class: "rz-paper" });
  $("doc").replaceChildren(h("div", { class: "rz-doc-bar" }, h("span", { class: "rz-doc-name" }, filename), h("a", { href: pdfUrl, target: "_blank", rel: "noopener" }, "Open PDF ", arrow())), sheet);
  showPdf(sheet, pdfUrl);
}

async function renderSelected() {
  if (selected === BUNDLED) {
    const bundled = state.bundled;
    renderSelection({
      title: "Bundled PDF",
      status: statusOf(BUNDLED),
      filename: "Atishay-Kasliwal-Resume.pdf",
      meta: `In the repository · ${formatBytes(bundled.sizeBytes)} · ${bundled.id}`,
      action: h("div", { class: "rz-action" }, h("p", { class: "rz-action-sub" }, "Ships with every deploy and is served whenever nothing published can be read. To change it, replace public/Atishay-Kasliwal-Resume.pdf in the repository.")),
      report: bundled.report,
      pdfUrl: BUNDLED_URL,
    });
    return;
  }
  $("review").replaceChildren(h("p", { class: "muted rz-loading" }, "Loading…"));
  try {
    const { version } = await api(`/api/admin/resume/versions/${selected}`);
    const report = version.report ?? {};
    const recheck = h("button", { type: "button", class: "link", title: "Compare this version's text with the current profile" }, "Re-check");
    recheck.addEventListener("click", async () => {
      recheck.disabled = true;
      try {
        const [{ recheckText }, { profile, reviewItems }] = await Promise.all([loadChecker(), loadContext()]);
        const consistency = recheckText(report.text ?? [], { profile, reviewItems });
        await api(`/api/admin/resume/versions/${version.id}/recheck`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consistency }) });
        await load();
      } catch (error) {
        say(error.message);
        recheck.disabled = false;
      }
    });
    renderSelection({
      title: shortDate(version.uploadedAt),
      status: statusOf(version),
      filename: version.filename,
      meta: `${version.pages ? `${plural(version.pages, "page")} · ` : ""}${formatBytes(version.sizeBytes)} · ${version.id}`,
      action: publishPanel(version),
      report,
      pdfUrl: `/api/admin/resume/versions/${version.id}/file`,
      recheck,
    });
  } catch (error) {
    $("review").replaceChildren(h("p", { class: "notice" }, error.message));
  }
}

function select(id) {
  selected = id;
  renderVersions();
  renderSelected();
}

// What to show first: the newest draft if it is newer than what is live, else what is live.
function defaultSelection() {
  if (selected === BUNDLED || state.versions.some(version => version.id === selected)) return selected;
  const newest = state.versions[0];
  if (newest && !newest.active) return newest.id;
  return state.active?.id ?? (state.bundled ? BUNDLED : null);
}

// ---------- Upload ----------
async function upload(file) {
  say(null);
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return say("Only PDF files can be uploaded.");
  if (file.size > state.limits.maxBytes) return say(`That file is ${formatBytes(file.size)}; the limit is ${formatBytes(state.limits.maxBytes)}.`);
  say(`Checking ${file.name}…`, "info");
  try {
    const [{ checkResume }, { profile, reviewItems }] = await Promise.all([loadChecker(), loadContext()]);
    const report = await checkResume(new Uint8Array(await file.arrayBuffer()), { filename: file.name, contentType: file.type, profile, reviewItems });
    if (!report.ok) throw new ApiError("Rejected", 422, { validation: report.validation });
    say(`Uploading ${file.name}…`, "info");
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("report", JSON.stringify(report));
    const result = await api("/api/admin/resume/versions", { method: "POST", body: form });
    say(result.duplicate ? "This exact file is already stored; it is selected." : "Uploaded as a draft. Review it, then publish.", "ok");
    selected = result.version.id;
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.body?.validation) {
      say(`Rejected: ${error.body.validation.errors.join(" ")}`);
      $("review").replaceChildren(h("div", { class: "rz-rejected" }, h("h2", { class: "label" }, `Validation of ${file.name}`), checksList(error.body.validation)));
    } else say(error.message);
  }
}

function wireUpload() {
  const overlay = $("drop");
  const input = $("file");
  $("choose").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    upload(input.files[0]);
    input.value = "";
  });
  // Drop a PDF anywhere on the page.
  let depth = 0;
  const hasFiles = event => [...(event.dataTransfer?.types ?? [])].includes("Files");
  window.addEventListener("dragenter", event => {
    if (!hasFiles(event)) return;
    depth += 1;
    overlay.hidden = false;
  });
  window.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth) overlay.hidden = true;
  });
  window.addEventListener("dragover", event => hasFiles(event) && event.preventDefault());
  window.addEventListener("drop", event => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth = 0;
    overlay.hidden = true;
    if (event.dataTransfer.files.length > 1) return say("Upload one PDF at a time.");
    upload(event.dataTransfer.files[0]);
  });
}

async function load() {
  state = await api("/api/admin/resume");
  $("limit").textContent = formatBytes(state.limits.maxBytes);
  if (!state.storageReady) say("Résumé storage is not configured: bind the private R2 bucket as RESUMES (see docs/resume-admin.md).");
  selected = defaultSelection();
  renderLive();
  renderVersions();
  renderHistory();
  await renderSelected();
}

$("nav").append(nav("resume"));
wireUpload();
load().catch(error => {
  $("published").replaceChildren(h("p", { class: "notice" }, error.message));
});
