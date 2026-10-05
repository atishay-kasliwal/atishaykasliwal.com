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
  let shown = { photos: [], layout: [] };

  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const body = await response.json();
    cache.set(url, body);
    return body;
  }

  // Positions are stored as fractions of the stage, so a resize keeps the composition intact.
  // Each photo's box is clamped so nothing can extend past the stage's bottom or right edge.
  function place(photo, entry, index, width, height) {
    const ratio = photo.width / photo.height;
    if (index === 0) {
      const size = Math.min(width * 0.36, height * 0.66 * ratio);
      const h = size / ratio;
      return { left: (width - size) / 2, top: (height - h) / 2 - 10, width: size };
    }
    const size = Math.min(Math.max(width * entry.width / 100, 64), width * 0.4);
    const h = size / ratio;
    const left = Math.min(Math.max((entry.x / 100) * width, 0), width - size);
    const top = Math.min(Math.max((entry.y / 100) * height, 0), Math.max(0, height - h - 6));
    return { left, top, width: size };
  }

  function draw(photos, layout, { animate }) {
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
    photos.forEach((photo, index) => {
      const entry = layout.find(item => item.id === photo.id) ?? { x: 50, y: 50, width: 24, depth: 0, rotation: 0 };
      let node = existing.get(photo.id);
      if (!node) {
        node = document.createElement("figure");
        node.className = "exhibit";
        node.dataset.id = photo.id;
        node.innerHTML = `<img src="${photo.src}" alt="${escapeAttribute(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" /><figcaption>${escapeAttribute(photo.tags?.join(" · ") ?? "")}</figcaption>`;
        stage.append(node);
      }
      const box = place(photo, entry, index, width, height);
      node.classList.toggle("is-featured", index === 0);
      node.style.left = `${box.left}px`;
      node.style.top = `${box.top}px`;
      node.style.width = `${box.width}px`;
      node.style.zIndex = index === 0 ? "30" : String(10 + entry.depth);
      node.style.transform = index === 0 ? "none" : `rotate(${entry.rotation}deg)`;
      if (animate && !reducedMotion.matches) {
        node.animate(
          [{ opacity: 0, transform: `scale(0.94) rotate(${entry.rotation}deg)` }, { opacity: 1, transform: index === 0 ? "none" : `rotate(${entry.rotation}deg)` }],
          { duration: DURATION, delay: index * 16, easing: "cubic-bezier(.22,.75,.22,1)", fill: "backwards" },
        );
      }
    });
    shown = { photos, layout };
  }

  async function showExhibition({ animate = true } = {}) {
    if (!exhibition) exhibition = await load(`/api/photography/exhibition?mobile=${mobile ? 1 : 0}`);
    currentMode = "exhibition";
    status.textContent = "";
    draw(exhibition.photos, exhibition.layout, { animate });
  }

  async function search(query) {
    const body = await load(`/api/photography/search?q=${encodeURIComponent(query)}`);
    currentMode = "search";
    const photos = body.results.map(result => result.photo);
    const layout = photos.map((photo, slot) => ({ id: photo.id, ...placement(photo, slot, query, mobile) }));
    status.textContent = photos.length ? `${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}` : "Nothing matched that search.";
    draw(photos, layout, { animate: true });
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
    if (shown.photos.length) draw(shown.photos, shown.layout, { animate: false });
  }).observe(stage);

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
