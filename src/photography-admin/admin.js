import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { processPhoto } from "./process.js";

const queue = document.querySelector("#queue");
const queueSection = document.querySelector("#queue-section");
const library = document.querySelector("#library");
const empty = document.querySelector("#empty");
const count = document.querySelector("#admin-count");
const notice = document.querySelector("#notice");
const drop = document.querySelector("#drop");
const fileInput = document.querySelector("#file");
let photos = [];
let filter = "all";
const rotating = new Set();

const label = {
  uploading: "Uploading",
  processing: "Processing",
  waiting: "Uploaded · waiting for tagging",
  failed: "Failed",
};

function say(message) {
  notice.hidden = !message;
  notice.textContent = message ?? "";
}

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  if (response.status === 401 || response.status === 403) {
    say("Your sign-in has expired. Reload the page to sign in again.");
    throw new Error("unauthorised");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json();
}

function row({ thumb, title, meta, status, actions = [], tone = "" }) {
  const item = document.createElement("li");
  item.className = `row ${tone}`;
  item.innerHTML = `
    <div class="thumb">${thumb ? `<img src="${thumb}" alt="" loading="lazy" decoding="async" />` : ""}</div>
    <div class="row-body">
      <p class="row-title"></p>
      <p class="row-meta"></p>
    </div>
    <p class="row-status"></p>
    <div class="row-actions"></div>`;
  item.querySelector(".row-title").textContent = title;
  item.querySelector(".row-meta").textContent = meta ?? "";
  item.querySelector(".row-status").textContent = status ?? "";
  const holder = item.querySelector(".row-actions");
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.disabled = Boolean(action.disabled);
    if (action.title) button.setAttribute("aria-label", action.title);
    button.addEventListener("click", action.run);
    holder.append(button);
  }
  return item;
}

function renderLibrary() {
  library.replaceChildren();
  const visible = photos.filter(photo => filter === "all" || (filter === "hidden") === photo.hidden);
  empty.hidden = visible.length > 0;
  for (const photo of visible) {
    const statusText = photo.status === "ready" ? (photo.hidden ? "Hidden" : "Visible") : photo.status === "pending" ? "Waiting for tagging" : "Failed";
    const tags = photo.tags?.length ? photo.tags.join(", ") : "no tags yet";
    const busy = rotating.has(photo.id);
    const actions = [
      { label: "↺ Rotate left", title: "Rotate photo 90 degrees anticlockwise", disabled: busy || photo.origin !== "r2", run: () => rotatePhoto(photo, -1) },
      { label: busy ? "Rotating…" : "Rotate right ↻", title: "Rotate photo 90 degrees clockwise", disabled: busy || photo.origin !== "r2", run: () => rotatePhoto(photo, 1) },
      {
        label: photo.hidden ? "Show" : "Hide",
        disabled: busy,
        run: () => toggleHidden(photo),
      },
      { label: "Delete", disabled: busy, run: () => confirmDelete(photo) },
    ];
    library.append(row({ thumb: photo.src, title: photo.id.slice(0, 8), meta: tags, status: statusText, actions, tone: photo.hidden ? "is-hidden" : "" }));
  }
  count.textContent = `${photos.filter(photo => photo.status === "ready" && !photo.hidden).length} visible · ${photos.filter(photo => photo.status === "pending").length} waiting`;
}

async function refresh() {
  const body = await api("/api/photography/admin/photos");
  photos = body.photos;
  renderLibrary();
}

async function toggleHidden(photo) {
  const next = !photo.hidden;
  photo.hidden = next;
  renderLibrary();
  try {
    await api(`/api/photography/admin/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: next }),
    });
  } catch (error) {
    photo.hidden = !next;
    renderLibrary();
    say(error.message);
  }
}

async function rotatePhoto(photo, direction) {
  if (rotating.has(photo.id)) return;
  rotating.add(photo.id);
  say(null);
  renderLibrary();
  let bitmap;
  try {
    const path = `/api/photography/admin/photos/${photo.id}/rotate`;
    const response = await fetch(path, { credentials: 'same-origin' });
    if (!response.ok) throw new Error((await response.json()).error || 'Could not load photo.');
    const etag = response.headers.get('ETag');
    bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(bitmap.height, bitmap.width);
    const context = canvas.getContext('2d');
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(direction * Math.PI / 2);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    const display = await canvas.convertToBlob({ type: 'image/jpeg', quality: .95 });
    const saved = await api(path, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'If-Match': etag }, body: display });
    photo.src = saved.src;
  } catch (error) {
    say(error.message);
  } finally {
    bitmap?.close();
    rotating.delete(photo.id);
    renderLibrary();
  }
}

// Delete asks inline, in place of the row's buttons, so a stray click cannot remove a photo.
function confirmDelete(photo) {
  const node = [...library.children].find(item => item.querySelector(".row-title")?.textContent === photo.id.slice(0, 8));
  if (!node) return;
  const holder = node.querySelector(".row-actions");
  holder.replaceChildren();
  const question = document.createElement("span");
  question.className = "confirm";
  question.textContent = "Delete permanently?";
  const yes = document.createElement("button");
  yes.type = "button";
  yes.textContent = "Yes, delete";
  yes.className = "danger";
  yes.addEventListener("click", () => removePhoto(photo));
  const no = document.createElement("button");
  no.type = "button";
  no.textContent = "Keep";
  no.addEventListener("click", renderLibrary);
  holder.append(question, yes, no);
  no.focus();
}

async function removePhoto(photo) {
  try {
    await api(`/api/photography/admin/photos/${photo.id}`, { method: "DELETE" });
    photos = photos.filter(item => item.id !== photo.id);
    renderLibrary();
  } catch (error) {
    say(error.message);
    renderLibrary();
  }
}

function queueRow(file) {
  const item = row({ title: file.name, meta: `${Math.round(file.size / 1024)} KB`, status: label.uploading, tone: "is-working" });
  queue.prepend(item);
  queueSection.hidden = false;
  return item;
}

function setStatus(item, text, tone = "is-working") {
  item.className = `row ${tone}`;
  item.querySelector(".row-status").textContent = text;
}

async function uploadFile(file) {
  const item = queueRow(file);
  try {
    if (file.size > 40 * 1024 * 1024) throw new Error("Larger than 40 MB");
    const processed = await processPhoto(file);
    setStatus(item, label.processing);
    const form = new FormData();
    form.append("original", file, file.name);
    form.append("display", processed.displayBlob, "display.jpg");
    form.append("colors", JSON.stringify(processed.colors));
    const result = await api("/api/photography/admin/upload", { method: "POST", body: form });
    setStatus(item, result.duplicate ? "Already in library" : label.waiting, "is-done");
    return result;
  } catch (error) {
    setStatus(item, `${label.failed}: ${error.message}`, "is-failed");
    return null;
  }
}

async function uploadAll(files) {
  const images = [...files].filter(file => /^image\/(jpeg|png|webp|heic|heif)(-sequence)?$/i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name));
  if (!images.length) return say("Choose JPEG, PNG, WebP or iPhone HEIC/HEIF photographs.");
  say(null);
  // One at a time keeps memory bounded on large originals and keeps the queue readable.
  for (const file of images) await uploadFile(file);
  await refresh();
}

drop.addEventListener("dragover", event => {
  event.preventDefault();
  drop.classList.add("is-over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
drop.addEventListener("drop", event => {
  event.preventDefault();
  drop.classList.remove("is-over");
  uploadAll(event.dataTransfer.files);
});
document.querySelector("#choose").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  uploadAll(fileInput.files);
  fileInput.value = "";
});
document.addEventListener("keydown", event => {
  if (event.target.matches("input, textarea")) return;
  if (event.key === "u" || event.key === "U") fileInput.click();
});

document.querySelector(".filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  for (const other of document.querySelectorAll("[data-filter]")) {
    other.setAttribute("aria-pressed", String(other === button));
  }
  renderLibrary();
});

refresh().catch(() => {});
