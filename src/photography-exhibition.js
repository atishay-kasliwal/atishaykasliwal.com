import { packPhotos } from "./photography-core/pack.js";

// Enhances the prerendered photography page with the live exhibition and search. If the API
// is unavailable the static deck remains as it is, so search engines and no-JS visitors see
// the same meaningful content either way.
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const DURATION = 760;

export function setupExhibition(root) {
  const stage = root.querySelector("[data-exhibition-stage]");
  const form = root.querySelector("[data-exhibition-search]");
  const input = root.querySelector("[data-exhibition-input]");
  const status = root.querySelector("[data-exhibition-status]");
  if (!stage || !form || !input) return;

  const mobile = matchMedia("(max-width: 700px)").matches;
  const cache = new Map();
  let currentMode = "exhibition";
  let exhibition = null;
  let shown = [];

  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    cache.set(url, body);
    return body;
  }

  function draw(photos, { animate }) {
    stage.hidden = false;
    stage.classList.add("is-live");
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const existing = new Map([...stage.children].map(node => [node.dataset.id, node]));
    const wanted = new Set(photos.map(photo => photo.id));
    for (const [id, node] of existing) {
      if (wanted.has(id)) continue;
      if (animate && !reducedMotion.matches) {
        node.animate(
          [{ opacity: 1, transform: getComputedStyle(node).transform }, { opacity: 0, transform: "scale(0.88)" }],
          { duration: DURATION, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
        ).onfinish = () => node.remove();
      } else {
        node.remove();
      }
    }
    const boxes = new Map(packPhotos(photos, { width, height, mobile }).map(box => [box.id, box]));
    photos.forEach((photo, index) => {
      const box = boxes.get(photo.id);
      let node = existing.get(photo.id);
      if (!node) {
        node = document.createElement("figure");
        node.className = "exhibit";
        node.dataset.id = photo.id;
        node.innerHTML = `<img src="${photo.src}" alt="${escapeAttribute(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" /><figcaption>${escapeAttribute(photo.tags?.join(" · ") ?? "")}</figcaption>`;
        stage.append(node);
      }
      node.classList.toggle("is-featured", index === 0);
      node.style.left = `${box.left}px`;
      node.style.top = `${box.top}px`;
      node.style.width = `${box.width}px`;
      node.style.height = `${box.height}px`;
      node.style.zIndex = String(box.z);
      node.style.transform = "none";
      if (animate && !reducedMotion.matches) {
        node.animate(
          [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "none" }],
          { duration: DURATION, delay: index * 16, easing: "cubic-bezier(.22,.75,.22,1)", fill: "backwards" },
        );
      }
    });
    shown = photos;
  }

  async function showExhibition({ animate = true } = {}) {
    if (!exhibition) exhibition = await load(`/api/photography/exhibition?mobile=${mobile ? 1 : 0}`);
    currentMode = "exhibition";
    status.textContent = "";
    draw(exhibition.photos, { animate });
  }

  async function search(query) {
    const body = await load(`/api/photography/search?q=${encodeURIComponent(query)}`);
    currentMode = "search";
    const photos = body.results.map(result => result.photo);
    status.textContent = photos.length ? `${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}` : "Nothing matched that search.";
    draw(photos, { animate: true });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return showExhibition();
    try {
      await search(query);
    } catch {
      status.textContent = "Search is unavailable right now.";
    }
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape" && input.value) {
      input.value = "";
      showExhibition();
    }
  });

  input.addEventListener("input", () => {
    if (!input.value && currentMode === "search") showExhibition();
  });

  // Re-place photos when the viewport changes shape, using the same stored layout.
  new ResizeObserver(() => {
    if (shown.length) draw(shown, { animate: false });
  }).observe(stage);

  showExhibition({ animate: false }).then(() => root.classList.add("exhibition-live")).catch(() => {});
}


function escapeAttribute(value) {
  return String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}
