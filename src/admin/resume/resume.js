import { api, ApiError, formatBytes, h, nav, shortSha, time } from "../common.js";

const $ = id => document.getElementById(id);

// The full PDF check runs here in the browser (the Pages Function only screens the file, to stay
// within the Workers Free plan's CPU limit). pdf.js is large, so it loads on the first upload.
let checker = null;
const loadChecker = () => (checker ??= import("../../resume-core/report.js"));
let context = null;
const loadContext = async () => (context ??= await api("/api/admin/resume/context"));
const notice = $("notice");
let state = null;

const ACTION_LABELS = {
  upload: "Uploaded",
  upload_duplicate: "Re-uploaded (already stored)",
  upload_rejected: "Upload rejected",
  publish: "Published",
  restore: "Restored",
  recheck: "Re-checked against the profile",
};
const SEVERITY_LABELS = { conflict: "Conflict", unverified: "Unverified", info: "Info" };

function say(message, tone = "error") {
  notice.hidden = !message;
  notice.textContent = message ?? "";
  notice.className = `notice ${tone === "error" ? "" : tone}`.trim();
}

const counts = summary =>
  summary
    ? h(
        "span",
        { class: "counts" },
        h("span", { class: `pill ${summary.conflict ? "conflict" : "good"}` }, `${summary.conflict} conflict${summary.conflict === 1 ? "" : "s"}`),
        h("span", { class: "pill unverified" }, `${summary.unverified} unverified`),
        h("span", { class: "pill info" }, `${summary.info} info`),
      )
    : h("span", { class: "muted" }, "—");

// ---------- Published ----------
const FALLBACK_REASONS = {
  "nothing-published": "Nothing has been published from the admin yet.",
  "storage-missing": "The R2 binding RESUMES is not configured, so the published version cannot be read.",
  "published-file-missing": "The published version's file is missing from R2.",
  "storage-error": "R2 could not be read.",
};

// What the public URL should be serving, and whether that is the bundled fallback.
function expectedLive() {
  if (state.serving.source === "published") return { id: state.active.id, sha256: state.active.sha256, source: "published" };
  return state.bundled ? { id: state.bundled.id, sha256: state.bundled.sha256, source: "bundled" } : null;
}

function bundledBanner() {
  if (state.serving.source !== "bundled") return null;
  const report = state.bundled?.report;
  const conflicts = report?.consistency?.items.filter(item => item.severity === "conflict") ?? [];
  const outdated = conflicts.length > 0 || Boolean(report?.errors);
  const reason = FALLBACK_REASONS[state.serving.reason] ?? "";
  const fellBack = state.serving.reason !== "nothing-published";
  return h(
    "div",
    { class: `banner ${outdated || fellBack ? "bad" : "info"}`, role: outdated || fellBack ? "alert" : "status" },
    h(
      "p",
      { class: "banner-title" },
      fellBack ? "Fallback: the public URL is serving the bundled PDF, not the published version" : outdated ? "An outdated résumé is live" : "The bundled résumé is live",
    ),
    h(
      "p",
      {},
      `${reason} ${state.publicPath} is serving the PDF bundled with the deploy (version ${state.bundled?.id ?? "unknown"}).`,
      outdated && conflicts.length ? ` It contradicts the canonical profile in ${conflicts.length} place${conflicts.length === 1 ? "" : "s"}:` : "",
      report?.errors ? ` It does not pass validation: ${report.errors.join(" ")}` : "",
    ),
    conflicts.length ? h("ul", { class: "banner-list" }, conflicts.map(item => h("li", {}, item.message))) : null,
    outdated ? h("p", { class: "soft" }, fellBack ? "Check the R2 bucket and binding, then republish or restore a version below." : "Upload and publish a current résumé below.") : null,
  );
}

// Fetch the public URL signed out, as a visitor would, and compare the bytes with what should be live.
async function liveCheck() {
  const box = $("live-check");
  const expected = expectedLive();
  box.replaceChildren(h("span", { class: "muted mono" }, "Checking the public URL…"));
  try {
    const response = await fetch(state.publicPath, { cache: "no-store", credentials: "omit" });
    const buffer = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const servedBundled = state.bundled && sha256 === state.bundled.sha256;
    const servedActive = state.active && sha256 === state.active.sha256;
    const label = servedActive ? `published version ${state.active.id}` : servedBundled ? `bundled PDF ${state.bundled.id}` : `an unknown file ${sha256.slice(0, 16)}`;
    const ok = response.ok && expected && sha256 === expected.sha256;
    box.replaceChildren(
      h("span", { class: `pill ${ok ? "good" : "bad"}` }, ok ? "live check passed" : "live check failed"),
      h("span", { class: "mono soft" }, ` ${response.status} · serving the ${label}`),
      !ok && expected ? h("span", { class: "mono" }, ` · expected ${expected.source} ${expected.id}. A stale deploy or cache may be answering.`) : "",
    );
  } catch (error) {
    box.replaceChildren(h("span", { class: "pill bad" }, "live check failed"), h("span", { class: "mono soft" }, ` ${error.message}`));
  }
}

function renderPublished() {
  const box = $("published");
  box.replaceChildren();
  $("public-path").textContent = state.publicPath;
  const active = state.active;
  const banner = bundledBanner();
  if (banner) box.append(banner);
  if (state.serving.source === "bundled") {
    box.append(
      h(
        "dl",
        { class: "card-grid" },
        h("div", {}, h("dt", {}, "Serving"), h("dd", {}, "Bundled with deploy")),
        h("div", {}, h("dt", {}, "Version"), h("dd", {}, state.bundled?.id ?? "—")),
        h("div", {}, h("dt", {}, "SHA-256"), h("dd", { title: state.bundled?.sha256 ?? "" }, shortSha(state.bundled?.sha256))),
        h("div", {}, h("dt", {}, "Size"), h("dd", {}, state.bundled ? formatBytes(state.bundled.sizeBytes) : "—")),
        h("div", {}, h("dt", {}, "Against the profile"), h("dd", {}, counts(state.bundled?.report?.consistency?.summary))),
        active ? h("div", {}, h("dt", {}, "Published (not served)"), h("dd", {}, `${active.id} · `, time(active.publishedAt))) : null,
      ),
    );
  } else {
    box.append(
      h(
        "dl",
        { class: "card-grid" },
        h("div", {}, h("dt", {}, "Serving"), h("dd", {}, "Published version")),
        h("div", {}, h("dt", {}, "Version"), h("dd", {}, active.id)),
        h("div", {}, h("dt", {}, "Published"), h("dd", {}, time(active.publishedAt))),
        h("div", {}, h("dt", {}, "By"), h("dd", {}, active.publishedBy)),
        h("div", {}, h("dt", {}, "SHA-256"), h("dd", { title: active.sha256 }, shortSha(active.sha256))),
        h("div", {}, h("dt", {}, "File"), h("dd", {}, `${active.filename} · ${formatBytes(active.sizeBytes)} · ${active.pages} p`)),
        h("div", {}, h("dt", {}, "Against the profile"), h("dd", {}, counts(active.report?.summary))),
      ),
    );
  }
  box.append(
    h("p", { class: "live-check", id: "live-check" }),
    h(
      "div",
      { class: "card-actions" },
      h("a", { href: state.publicPath, target: "_blank", rel: "noopener" }, "Open the public URL ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗")),
      active ? h("button", { type: "button", onclick: () => openReview(active.id) }, "Review") : null,
      h("button", { type: "button", onclick: liveCheck }, "Check again"),
      h("a", { href: "/admin/responses/" }, "Inspect live responses ", h("span", { class: "arrow", "aria-hidden": "true" }, "→")),
    ),
  );
  liveCheck();
}

// ---------- Versions ----------
function statusOf(version) {
  if (version.active) return h("span", { class: "pill good" }, "Published");
  if (version.firstPublishedAt) return h("span", { class: "pill info" }, "Previously published");
  return h("span", { class: "pill" }, "Not published");
}

function renderVersions() {
  const table = $("versions");
  table.replaceChildren();
  $("versions-empty").hidden = state.versions.length > 0;
  if (!state.versions.length) return;
  table.append(
    h("thead", {}, h("tr", {}, ["Version", "File", "Uploaded", "Against the profile", "Status", ""].map(label => h("th", { scope: "col" }, label)))),
    h(
      "tbody",
      {},
      state.versions.map(version =>
        h(
          "tr",
          { class: version.active ? "is-active" : "" },
          h("td", { class: "mono", title: version.sha256 }, version.id),
          h("td", {}, version.filename, h("div", { class: "muted mono" }, `${formatBytes(version.sizeBytes)} · ${version.pages} p · ${version.textChars.toLocaleString("en-US")} chars`)),
          h("td", {}, time(version.uploadedAt), h("div", { class: "muted mono" }, version.uploadedBy)),
          h("td", {}, counts(version.report?.summary)),
          h("td", {}, statusOf(version), version.lastPublishedAt ? h("div", { class: "muted mono" }, "last ", time(version.lastPublishedAt)) : null),
          h(
            "td",
            {},
            h(
              "div",
              { class: "row-buttons" },
              h("button", { type: "button", onclick: () => openReview(version.id) }, "Review"),
              version.active ? null : h("button", { type: "button", onclick: () => openReview(version.id, { focusPublish: true }) }, version.firstPublishedAt ? "Restore…" : "Publish…"),
            ),
          ),
        ),
      ),
    ),
  );
}

// ---------- History ----------
function historyDetail(entry) {
  const d = entry.detail ?? {};
  if (entry.action === "upload_rejected") return d.errors?.join(" ") ?? d.reason ?? "";
  if (entry.action === "publish" || entry.action === "restore") {
    const parts = [d.previousVersionId ? `replaced ${d.previousVersionId}` : "replaced the bundled PDF"];
    if (d.reason) parts.push(`“${d.reason}”`);
    return parts.join(" · ");
  }
  if (entry.action === "upload" || entry.action === "recheck") {
    const c = d.consistency;
    return [d.filename, c ? `${c.conflict} conflicts, ${c.unverified} unverified` : null].filter(Boolean).join(" · ");
  }
  return d.filename ?? "";
}

function renderHistory() {
  const table = $("history");
  table.replaceChildren();
  $("history-empty").hidden = state.audit.length > 0;
  if (!state.audit.length) return;
  table.append(
    h("thead", {}, h("tr", {}, ["When", "Who", "Action", "Version", "Detail"].map(label => h("th", { scope: "col" }, label)))),
    h(
      "tbody",
      {},
      state.audit.map(entry =>
        h(
          "tr",
          {},
          h("td", {}, time(entry.at)),
          h("td", { class: "mono" }, entry.actor),
          h("td", {}, h("span", { class: `pill ${entry.action === "upload_rejected" ? "bad" : entry.action === "publish" || entry.action === "restore" ? "good" : ""}` }, ACTION_LABELS[entry.action] ?? entry.action)),
          h("td", { class: "mono", title: entry.sha256 ?? "" }, entry.versionId ?? (entry.sha256 ? shortSha(entry.sha256) : "—")),
          h("td", {}, historyDetail(entry)),
        ),
      ),
    ),
  );
}

// ---------- Review ----------
function checksList(validation) {
  return h(
    "ul",
    { class: "checks" },
    validation.checks.map(item =>
      h("li", {}, h("span", { class: `mark ${item.ok ? "ok" : "fail"}`, "aria-label": item.ok ? "passed" : "failed" }, item.ok ? "✓" : "✕"), h("span", {}, item.label), h("span", { class: "soft" }, item.detail)),
    ),
  );
}

function findingsList(consistency) {
  if (!consistency.items.length) return h("p", { class: "soft" }, "No discrepancies with the canonical profile.");
  return h(
    "ul",
    { class: "findings" },
    consistency.items.map(item =>
      h(
        "li",
        {},
        h(
          "div",
          { class: "finding-head" },
          h("span", { class: `pill ${item.severity}` }, SEVERITY_LABELS[item.severity]),
          h("span", { class: "pill" }, item.category),
          item.reviewItem ? h("span", { class: "muted mono", title: item.reviewItem.resolution ?? "" }, `review: ${item.reviewItem.id} (${item.reviewItem.status})`) : null,
        ),
        h("span", {}, item.message),
        item.resume ? h("p", { class: "finding-quote" }, "Résumé: ", item.resume) : null,
        item.canonical ? h("p", { class: "finding-quote" }, "Canonical: ", item.canonical) : null,
      ),
    ),
  );
}

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
    await openReview(version.id);
  } catch (error) {
    say(error.message);
    button.disabled = false;
  }
}

function publishPanel(version) {
  if (version.active) return h("p", { class: "notice ok" }, "This version is published.");
  const conflicts = version.report?.consistency?.summary?.conflict ?? 0;
  const acknowledge = h("input", { type: "checkbox", id: "acknowledge" });
  const reason = h("input", { type: "text", id: "reason", maxlength: "300", placeholder: "Note for the history (optional)" });
  const verb = version.firstPublishedAt ? "Restore" : "Publish";
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
    { class: "publish" },
    h("h3", { class: "label" }, verb),
    conflicts > 0
      ? h(
          "label",
          { for: "acknowledge" },
          acknowledge,
          h("span", {}, `I've reviewed the ${conflicts} conflict${conflicts === 1 ? "" : "s"} above. Publishing serves this PDF as is; the canonical profile, /profile and the facts in /api/profile.json do not change.`),
        )
      : null,
    reason,
    h("div", { class: "card-actions" }, button),
  );
}

async function openReview(id, { focusPublish = false } = {}) {
  const section = $("review-section");
  const box = $("review");
  section.hidden = false;
  box.replaceChildren(h("p", { class: "muted" }, "Loading…"));
  try {
    const { version } = await api(`/api/admin/resume/versions/${id}`);
    const report = version.report ?? {};
    const fileUrl = `/api/admin/resume/versions/${version.id}/file`;
    const recheck = h("button", { type: "button" }, "Re-check against the current profile");
    recheck.addEventListener("click", async () => {
      recheck.disabled = true;
      try {
        const [{ recheckText }, { profile, reviewItems }] = await Promise.all([loadChecker(), loadContext()]);
        const consistency = recheckText(report.text ?? [], { profile, reviewItems });
        await api(`/api/admin/resume/versions/${version.id}/recheck`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consistency }),
        });
        await load();
        await openReview(version.id);
      } catch (error) {
        say(error.message);
        recheck.disabled = false;
      }
    });
    box.replaceChildren(
      h(
        "div",
        {},
        h("iframe", { class: "preview", src: fileUrl, title: `Preview of version ${version.id}` }),
        h(
          "div",
          { class: "card-actions" },
          h("a", { href: fileUrl, target: "_blank", rel: "noopener" }, "Open in a new tab ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗")),
          h("a", { href: `${fileUrl}?download=1` }, "Download"),
        ),
      ),
      h(
        "div",
        {},
        h("dl", { class: "card-grid" }, h("div", {}, h("dt", {}, "Version"), h("dd", {}, version.id)), h("div", {}, h("dt", {}, "Status"), h("dd", {}, statusOf(version))), h("div", {}, h("dt", {}, "SHA-256"), h("dd", { title: version.sha256 }, shortSha(version.sha256)))),
        h("h3", { class: "label section" }, "Validation"),
        report.validation ? checksList(report.validation) : h("p", { class: "muted" }, "No validation report."),
        ...(report.validation?.warnings ?? []).map(warning => h("p", { class: "notice info" }, warning)),
        h("h3", { class: "label" }, "Against the canonical profile"),
        h("p", { class: "lede" }, "Discrepancies are for review only. The canonical profile stays the source of truth and is never changed from a PDF."),
        report.consistency ? h("div", {}, counts(report.consistency.summary), findingsList(report.consistency)) : h("p", { class: "muted" }, "No consistency report."),
        h("div", { class: "card-actions" }, recheck, report.checkedAt ? h("span", { class: "muted mono" }, "checked ", time(report.checkedAt)) : null),
        report.text?.length ? h("details", { class: "section" }, h("summary", {}, "Extracted text (what crawlers and applicant tracking systems read)"), h("pre", { class: "text" }, report.text.join("\n"))) : null,
        publishPanel(version),
      ),
    );
    if (focusPublish) $("publish-button")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else section.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    box.replaceChildren(h("p", { class: "notice" }, error.message));
  }
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
    say(result.duplicate ? `This exact file is already stored as ${result.version.id}.` : `Stored as ${result.version.id}. Review it below, then publish when ready.`, "ok");
    await load();
    await openReview(result.version.id);
  } catch (error) {
    if (error instanceof ApiError && error.body?.validation) {
      say(`Rejected: ${error.body.validation.errors.join(" ")}`);
      $("review-section").hidden = false;
      $("review").replaceChildren(h("div", {}, h("h3", { class: "label" }, `Validation of ${file.name}`), checksList(error.body.validation)));
      await load();
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
  renderPublished();
  renderVersions();
  renderHistory();
}

$("nav").append(nav("resume"));
wireUpload();
load().catch(error => {
  $("published").replaceChildren(h("p", { class: "notice" }, error.message));
});
