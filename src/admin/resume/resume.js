import { api, ApiError, formatBytes, formatDate, h, nav, shortSha, time } from "../common.js";

// One-screen résumé admin: a strip saying what the public URL serves, a side column (upload,
// versions, activity) and a workspace for the selected item (PDF preview beside its report, with
// publishing at the top). The full PDF check runs here in the browser; the Pages Function only
// screens the file, to stay within the Workers Free plan's CPU limit.

const $ = id => document.getElementById(id);
const notice = $("notice");
const LIVE = "live";

// pdf.js is large, so it loads on the first upload or re-check.
let checker = null;
const loadChecker = () => (checker ??= import("../../resume-core/report.js"));
let context = null;
const loadContext = async () => (context ??= await api("/api/admin/resume/context"));

let state = null;
let selected = null;
let tab = "Findings";

const ACTION_LABELS = {
  upload: "Uploaded",
  upload_duplicate: "Re-uploaded",
  upload_rejected: "Rejected",
  publish: "Published",
  restore: "Restored",
  recheck: "Re-checked",
};
const GROUPS = [
  ["conflict", "Conflicts"],
  ["unverified", "Unverified"],
  ["info", "Info"],
];
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function say(message, tone = "error") {
  notice.hidden = !message;
  notice.textContent = message ?? "";
  notice.className = `notice rz-notice ${tone === "error" ? "" : tone}`.trim();
}

const counts = (summary, { compact = false } = {}) =>
  summary
    ? h(
        "span",
        { class: "counts" },
        h("span", { class: `pill ${summary.conflict ? "conflict" : "good"}` }, plural(summary.conflict, "conflict")),
        summary.unverified ? h("span", { class: "pill unverified" }, `${summary.unverified} unverified`) : "",
        summary.info && !compact ? h("span", { class: "pill info" }, `${summary.info} info`) : "",
      )
    : h("span", { class: "muted" }, "—");

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

function liveHeadline() {
  if (state.serving.source === "published") return { tone: "good", title: `Published version ${state.active.id} is live`, detail: `Since ${formatDate(state.active.publishedAt)} · ${state.active.publishedBy}` };
  const conflicts = state.bundled?.report?.consistency?.summary?.conflict ?? 0;
  const fellBack = state.serving.reason !== "nothing-published";
  if (fellBack) return { tone: "bad", title: "Fallback: the public URL is serving the bundled PDF, not the published version", detail: `${FALLBACK_REASONS[state.serving.reason] ?? ""} Check the R2 bucket and binding, then republish.` };
  if (conflicts) return { tone: "bad", title: "An outdated résumé is live", detail: `The PDF bundled with the deploy contradicts the profile in ${plural(conflicts, "place")}. Upload and publish a current one.` };
  return { tone: "info", title: "The bundled résumé is live", detail: FALLBACK_REASONS["nothing-published"] };
}

// Fetch the public URL signed out, as a visitor would, and compare the bytes with what should be live.
async function liveCheck() {
  const box = $("live-check");
  if (!box) return;
  const expected = expectedLive();
  box.replaceChildren(h("span", { class: "muted mono" }, "Checking the public URL…"));
  try {
    const response = await fetch(state.publicPath, { cache: "no-store", credentials: "omit" });
    const digest = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
    const sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const label = state.active && sha256 === state.active.sha256 ? `published ${state.active.id}` : state.bundled && sha256 === state.bundled.sha256 ? `bundled ${state.bundled.id}` : `unknown file ${sha256.slice(0, 16)}`;
    const ok = response.ok && expected && sha256 === expected.sha256;
    box.replaceChildren(
      h("span", { class: `pill ${ok ? "good" : "bad"}` }, ok ? "live check passed" : "live check failed"),
      h("span", { class: "mono soft" }, ` ${response.status} · serving ${label}`),
      !ok && expected ? h("span", { class: "mono" }, ` · expected ${expected.source} ${expected.id}. A stale deploy or cache may be answering.`) : "",
    );
  } catch (error) {
    box.replaceChildren(h("span", { class: "pill bad" }, "live check failed"), h("span", { class: "mono soft" }, ` ${error.message}`));
  }
}

function renderStrip() {
  const { tone, title, detail } = liveHeadline();
  $("published").replaceChildren(
    h(
      "div",
      { class: "rz-strip-main" },
      h("p", { class: "label" }, "Live at ", h("span", { class: "rz-path" }, state.publicPath)),
      h("p", { class: `rz-headline ${tone}` }, title),
      h("p", { class: "rz-detail soft" }, detail),
      h("p", { class: "live-check", id: "live-check" }),
    ),
    h(
      "div",
      { class: "rz-strip-actions" },
      state.serving.source === "bundled" ? h("button", { type: "button", onclick: () => select(LIVE) }, "Review live PDF") : h("button", { type: "button", onclick: () => select(state.active.id) }, "Review"),
      h("button", { type: "button", onclick: liveCheck }, "Check again"),
      h("a", { href: state.publicPath, target: "_blank", rel: "noopener" }, "Open ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗")),
      h("a", { href: "/admin/responses/" }, "Inspect ", h("span", { class: "arrow", "aria-hidden": "true" }, "→")),
    ),
  );
  liveCheck();
}

// ---------- Side column ----------
function statusPill(version) {
  if (version.active) return h("span", { class: "pill good" }, "Live");
  if (version.firstPublishedAt) return h("span", { class: "pill info" }, "Was live");
  return h("span", { class: "pill" }, "Draft");
}

function listItem({ id, title, status, meta, summary }) {
  const current = selected === id;
  return h(
    "li",
    {},
    h(
      "button",
      { type: "button", class: `rz-item${current ? " is-selected" : ""}`, "aria-pressed": String(current), onclick: () => select(id) },
      h("span", { class: "rz-item-top" }, h("span", { class: "rz-item-id" }, title), status),
      h("span", { class: "rz-item-meta" }, meta),
      counts(summary, { compact: true }),
    ),
  );
}

function renderVersions() {
  const list = $("versions");
  const items = state.versions.map(version =>
    listItem({
      id: version.id,
      title: version.id,
      status: statusPill(version),
      meta: `${version.filename} · ${formatBytes(version.sizeBytes)} · ${formatDate(version.uploadedAt)}`,
      summary: version.report?.summary,
    }),
  );
  if (state.bundled) {
    items.push(
      listItem({
        id: LIVE,
        title: "Bundled PDF",
        status: state.serving.source === "bundled" ? h("span", { class: `pill ${state.bundled.report?.consistency?.summary?.conflict ? "bad" : "good"}` }, "Live") : h("span", { class: "pill info" }, "Fallback"),
        meta: `${state.bundled.id} · ${formatBytes(state.bundled.sizeBytes)} · ships with each deploy`,
        summary: state.bundled.report?.consistency?.summary,
      }),
    );
  }
  list.replaceChildren(...items);
  if (!state.versions.length) list.prepend(h("li", { class: "empty rz-empty" }, "No uploads yet"));
}

function historyDetail(entry) {
  const d = entry.detail ?? {};
  if (entry.action === "upload_rejected") return d.errors?.join(" ") ?? d.reason ?? "";
  if (entry.action === "publish" || entry.action === "restore") return [d.previousVersionId ? `replaced ${d.previousVersionId}` : "replaced the bundled PDF", d.reason ? `“${d.reason}”` : null].filter(Boolean).join(" · ");
  const c = d.consistency;
  return [d.filename, c ? `${plural(c.conflict, "conflict")}, ${c.unverified} unverified` : null].filter(Boolean).join(" · ");
}

function renderHistory() {
  $("history-count").textContent = state.audit.length ? `· ${state.audit.length}` : "";
  $("history").replaceChildren(
    ...(state.audit.length
      ? state.audit.map(entry =>
          h(
            "li",
            {},
            h("span", { class: "rz-log-head" }, h("span", { class: `pill ${entry.action === "upload_rejected" ? "bad" : entry.action === "publish" || entry.action === "restore" ? "good" : ""}` }, ACTION_LABELS[entry.action] ?? entry.action), h("span", { class: "mono soft", title: entry.sha256 ?? "" }, entry.versionId ?? (entry.sha256 ? shortSha(entry.sha256) : ""))),
            h("span", { class: "rz-log-detail" }, historyDetail(entry)),
            h("span", { class: "rz-log-when mono muted" }, time(entry.at), ` · ${entry.actor}`),
          ),
        )
      : [h("li", { class: "empty rz-empty" }, "No activity yet")]),
  );
}

// ---------- Report ----------
function checksList(validation) {
  return h(
    "ul",
    { class: "checks" },
    validation.checks.map(item =>
      h("li", {}, h("span", { class: `mark ${item.ok ? "ok" : "fail"}`, "aria-label": item.ok ? "passed" : "failed" }, item.ok ? "✓" : "✕"), h("span", {}, item.label), h("span", { class: "soft" }, item.detail)),
    ),
  );
}

function findingRow(item) {
  return h(
    "li",
    {},
    h("span", { class: "rz-finding-cat" }, item.category),
    h(
      "div",
      { class: "rz-finding-body" },
      h("p", { class: "rz-finding-msg" }, item.message),
      item.resume && item.resume !== item.message ? h("p", { class: "rz-finding-quote", title: item.resume }, item.resume) : "",
      item.reviewItem ? h("p", { class: "rz-finding-review mono muted", title: item.reviewItem.resolution ?? "" }, `review item ${item.reviewItem.id} · ${item.reviewItem.status}`) : "",
    ),
  );
}

// Findings grouped by severity. Skills with no evidence collapse into one row of names.
function findings(consistency) {
  if (!consistency?.items?.length) return h("p", { class: "rz-clear" }, "No discrepancies with the canonical profile.");
  const first = GROUPS.find(([severity]) => consistency.items.some(item => item.severity === severity))?.[0];
  return h(
    "div",
    { class: "rz-groups" },
    GROUPS.map(([severity, label]) => {
      const items = consistency.items.filter(item => item.severity === severity);
      if (!items.length) return "";
      const skills = items.filter(item => item.category === "skills" && severity === "unverified");
      const rest = items.filter(item => !skills.includes(item));
      return h(
        "details",
        { class: `rz-group ${severity}`, open: severity === first || severity === "conflict" || items.length <= 4 },
        h("summary", {}, h("span", { class: `pill ${severity}` }, label), h("span", { class: "rz-group-count" }, items.length)),
        h(
          "ul",
          { class: "rz-findings" },
          skills.length
            ? h(
                "li",
                {},
                h("span", { class: "rz-finding-cat" }, "skills"),
                h("div", { class: "rz-finding-body" }, h("p", { class: "rz-finding-msg" }, `${plural(skills.length, "skill")} with no evidence on the site`), h("p", { class: "rz-chips" }, skills.map(item => h("span", { class: "rz-chip" }, item.resume)))),
              )
            : "",
          rest.map(findingRow),
        ),
      );
    }),
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
    say(`${result.action === "restore" ? "Restored" : "Published"} ${version.id}. ${state.publicPath} and /api/profile.json now serve it.`, "ok");
    await load();
  } catch (error) {
    say(error.message);
    button.disabled = false;
  }
}

function publishBar(version) {
  if (version.active) return h("p", { class: "rz-published" }, "This version is published.");
  const conflicts = version.report?.consistency?.summary?.conflict ?? 0;
  const verb = version.firstPublishedAt ? "Restore" : "Publish";
  const acknowledge = h("input", { type: "checkbox", id: "acknowledge" });
  const reason = h("input", { type: "text", id: "reason", maxlength: "300", placeholder: "Note for the history (optional)", "aria-label": "Note for the history" });
  const button = h("button", { type: "button", class: "primary", id: "publish-button", disabled: conflicts > 0 }, `${verb} this version`);
  acknowledge.addEventListener("change", () => {
    button.disabled = conflicts > 0 && !acknowledge.checked;
  });
  button.addEventListener("click", () => {
    if (!window.confirm(`${verb} ${version.id} at ${state.publicPath}? Visitors get it on their next request.`)) return;
    publish(version, { acknowledge: acknowledge.checked, reason: reason.value, button });
  });
  return h(
    "div",
    { class: "rz-publish" },
    conflicts > 0 ? h("label", { for: "acknowledge", class: "rz-ack" }, acknowledge, h("span", {}, `Publish despite ${plural(conflicts, "conflict")}. The profile does not change.`)) : "",
    reason,
    button,
  );
}

// ---------- Workspace ----------
function tabs(names, render) {
  const panel = h("div", { class: "rz-panel", role: "tabpanel" });
  if (!names.includes(tab)) tab = names[0];
  const bar = h(
    "div",
    { class: "rz-tabs", role: "tablist" },
    names.map(name => {
      const button = h("button", { type: "button", role: "tab", "aria-selected": String(name === tab) }, name);
      button.addEventListener("click", () => {
        tab = name;
        bar.querySelectorAll("[role=tab]").forEach(node => node.setAttribute("aria-selected", String(node === button)));
        panel.replaceChildren(render(name));
      });
      return button;
    }),
  );
  panel.replaceChildren(render(tab));
  return [bar, panel];
}

function workspace({ heading, status, meta, actions, preview, report, recheck }) {
  const checks = report?.validation?.checks ?? [];
  const names = ["Findings", ...(checks.length ? [`Checks ${checks.filter(item => item.ok).length}/${checks.length}`] : []), ...(report?.text?.length ? ["Text"] : [])];
  const [bar, panel] = tabs(names, name =>
    name === "Findings"
      ? h("div", {}, ...(report?.validation?.warnings ?? []).map(warning => h("p", { class: "notice info" }, warning)), findings(report?.consistency))
      : name === "Text"
        ? h("pre", { class: "text rz-text" }, report.text.join("\n"))
        : checksList(report.validation),
  );
  return [
    h(
      "header",
      { class: "rz-work-head" },
      h("div", { class: "rz-work-title" }, h("h2", { class: "rz-work-id" }, heading), status, h("p", { class: "rz-work-meta mono muted" }, meta)),
      actions,
    ),
    h(
      "div",
      { class: "rz-work-body" },
      // Chrome's viewer: page fitted to the width, thumbnails sidebar closed.
      h("iframe", { class: "preview rz-preview", src: `${preview}#view=FitH&navpanes=0`, title: `Preview of ${heading}` }),
      h(
        "div",
        { class: "rz-report" },
        h("div", { class: "rz-report-head" }, counts(report?.consistency?.summary), bar),
        panel,
        h(
          "div",
          { class: "rz-report-foot" },
          recheck ?? "",
          report?.checkedAt ? h("span", { class: "muted mono" }, "checked ", time(report.checkedAt)) : "",
          h("a", { href: preview, target: "_blank", rel: "noopener" }, "Open PDF ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗")),
        ),
      ),
    ),
  ];
}

async function renderWork() {
  const box = $("review");
  if (selected === LIVE) {
    const bundled = state.bundled;
    box.replaceChildren(
      ...workspace({
        heading: "Bundled PDF",
        status: state.serving.source === "bundled" ? h("span", { class: "pill bad" }, "Live") : h("span", { class: "pill info" }, "Fallback"),
        meta: `${bundled.id} · ${formatBytes(bundled.sizeBytes)} · ships with each deploy and is served when nothing is published`,
        actions: h("p", { class: "rz-work-note soft" }, "To replace it, upload a current PDF and publish it."),
        preview: state.publicPath,
        report: bundled.report,
      }),
    );
    return;
  }
  box.replaceChildren(h("p", { class: "muted rz-loading" }, "Loading…"));
  try {
    const { version } = await api(`/api/admin/resume/versions/${selected}`);
    const report = version.report ?? {};
    const recheck = h("button", { type: "button" }, "Re-check");
    recheck.title = "Compare this version's text with the current profile";
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
    const pages = version.pages ? ` · ${version.pages} p` : "";
    box.replaceChildren(
      ...workspace({
        heading: version.id,
        status: statusPill(version),
        meta: `${version.filename} · ${formatBytes(version.sizeBytes)}${pages} · uploaded ${formatDate(version.uploadedAt)}`,
        actions: publishBar(version),
        preview: `/api/admin/resume/versions/${version.id}/file`,
        report,
        recheck,
      }),
    );
  } catch (error) {
    box.replaceChildren(h("p", { class: "notice" }, error.message));
  }
}

function select(id) {
  selected = id;
  renderVersions();
  renderWork();
}

// What to show first: the newest draft if it is newer than what is live, else what is live.
function defaultSelection() {
  if (selected === LIVE || state.versions.some(version => version.id === selected)) return selected;
  const newest = state.versions[0];
  if (newest && !newest.active) return newest.id;
  return state.active?.id ?? (state.bundled ? LIVE : null);
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
    say(result.duplicate ? `This exact file is already stored as ${result.version.id}.` : `Stored as ${result.version.id}. Review it, then publish when ready.`, "ok");
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
  const drop = $("drop");
  const input = $("file");
  $("choose").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    upload(input.files[0]);
    input.value = "";
  });
  drop.addEventListener("dragover", event => {
    event.preventDefault();
    drop.classList.add("is-over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
  drop.addEventListener("drop", event => {
    event.preventDefault();
    drop.classList.remove("is-over");
    if (event.dataTransfer.files.length > 1) return say("Upload one PDF at a time.");
    upload(event.dataTransfer.files[0]);
  });
}

async function load() {
  state = await api("/api/admin/resume");
  $("limit").textContent = formatBytes(state.limits.maxBytes);
  if (!state.storageReady) say("Résumé storage is not configured: bind the private R2 bucket as RESUMES (see docs/resume-admin.md).");
  selected = defaultSelection();
  renderStrip();
  renderVersions();
  renderHistory();
  await renderWork();
}

$("nav").append(nav("resume"));
wireUpload();
load().catch(error => {
  $("published").replaceChildren(h("p", { class: "notice" }, error.message));
});
