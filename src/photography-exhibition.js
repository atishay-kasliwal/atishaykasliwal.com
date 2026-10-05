import { layoutFor } from "./photography-core/layout.js";

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

  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    cache.set(url, body);
    return body;
  }

  function render(photos, layout, { animate }) {
    stage.hidden = false;
    stage.classList.add("is-live");
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
    photos.forEach((photo, index) => {
      const place = layout.find(entry => entry.id === photo.id);
      let node = existing.get(photo.id);
      if (!node) {
        node = document.createElement("figure");
        node.className = "exhibit";
        node.dataset.id = photo.id;
        node.innerHTML = `<img src="${photo.src}" alt="${escapeAttribute(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" />`;
        stage.append(node);
      }
      const before = node.getBoundingClientRect();
      node.style.left = `${place.x}%`;
      node.style.top = `${place.y}%`;
      node.style.width = `${place.width}%`;
      node.style.zIndex = String(10 + place.depth);
      node.style.transform = `rotate(${place.rotation}deg)`;
      if (animate && !reducedMotion.matches) {
        const after = node.getBoundingClientRect();
        node.animate(
          [
            { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) rotate(${place.rotation}deg) scale(0.96)` },
            { transform: `rotate(${place.rotation}deg)` },
          ],
          { duration: DURATION, delay: index * 14, easing: "cubic-bezier(.22,.75,.22,1)", fill: "backwards" },
        );
      }
    });
  }

  async function showExhibition({ animate = true } = {}) {
    if (!exhibition) exhibition = await load(`/api/photography/exhibition?mobile=${mobile ? 1 : 0}`);
    currentMode = "exhibition";
    status.textContent = "";
    render(exhibition.photos, exhibition.layout, { animate });
  }

  async function search(query) {
    const body = await load(`/api/photography/search?q=${encodeURIComponent(query)}`);
    currentMode = "search";
    const photos = body.results.map(result => result.photo);
    const layout = photos.map((photo, slot) => ({ id: photo.id, ...placement(photo, slot, query, mobile) }));
    status.textContent = photos.length ? `${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}` : "Nothing matched that search.";
    render(photos, layout, { animate: true });
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

  showExhibition({ animate: false }).then(() => root.classList.add("exhibition-live")).catch(() => {});
}

// Search placements reuse the layout function keyed by the query, so the same query always
// arranges the same way, and the arrangement differs from the daily exhibition.
function placement(photo, slot, query, mobile) {
  return layoutFor(photo, { key: `search:${query.toLowerCase()}`, slot, mobile });
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}
