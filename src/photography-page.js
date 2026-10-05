import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { photoMarkup } from "./photography.js";

const clock = document.querySelector('[data-photography-clock]');
const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
function updateClock() {
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = clockFormat.format(now);
}
updateClock();
setInterval(updateClock, 1000);

const canvas = document.querySelector("[data-photo-canvas]");
const collection = canvas.parentElement;
const viewer = document.querySelector("[data-photo-viewer]");
const media = viewer.querySelector('[data-viewer-media]');
const caption = viewer.querySelector('[data-viewer-caption]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selected = Math.floor(canvas.children.length / 2);
const allCards = () => [...collection.querySelectorAll('.photo-page-card')];
const cards = () => allCards().filter(card => !card.hidden);
const categories = document.querySelector('[data-photo-categories]');
const filters = document.querySelector('[data-photo-filters]');
let activeCategory = 'all';
let photoTags = new Map();

function renderCategories() {
  const counts = new Map();
  allCards().forEach(card => {
    for (const tag of new Set(photoTags.get(card.href) ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  });
  filters.replaceChildren();
  const entries = [['all', allCards().length], ...[...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))];
  entries.forEach(([tag, count]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(activeCategory === tag));
    button.append(document.createTextNode(tag + ' '));
    const total = document.createElement('sup');
    total.textContent = count;
    button.append(total);
    button.addEventListener('click', () => filterPhotos(tag));
    filters.append(button);
  });
  categories.hidden = counts.size === 0;
}

function filterPhotos(tag) {
  if (closing) return;
  interacted();
  const current = cards()[selected];
  const wasOpen = viewer.open;
  flight?.cancel();
  restoreImage();
  activeCategory = tag;
  allCards().forEach(card => { card.hidden = tag !== 'all' && !(photoTags.get(card.href) ?? []).includes(tag); });
  const index = cards().indexOf(current);
  selectPhoto(index < 0 ? Math.floor(cards().length / 2) : index);
  if (wasOpen && cards().length) liftImage(selected);
  renderCategories();
  if (matchMedia('(max-width: 700px)').matches) categories.open = false;
}
categories.open = matchMedia('(min-width: 701px)').matches;
let lifted = null;
let flight = null;
let closing = false;
let hasInteracted = false;
function interacted() { hasInteracted = true; collection.classList.add('has-interacted'); }
function restoreImage() {
  if (!lifted) return;
  const { card, image, placeholder, sizes } = lifted;
  image.style.transform = '';
  if (sizes === null) image.removeAttribute('sizes');
  else image.sizes = sizes;
  placeholder.replaceWith(image);
  lifted = null;
}
function liftImage(index) {
  restoreImage();
  selectPhoto(index, { announce: false });
  const card = cards()[selected];
  const image = card.querySelector('img');
  const bounds = image.getBoundingClientRect();
  const width = image.offsetWidth;
  const height = image.offsetHeight;
  const placeholder = image.cloneNode(true);
  const sizes = image.getAttribute('sizes');
  image.replaceWith(placeholder);
  media.replaceChildren(image);
  viewer.style.setProperty('--viewer-ratio', Number(image.getAttribute('width')) / Number(image.getAttribute('height')));
  image.sizes = '(max-width: 700px) 90vw, 58vw';
  lifted = { card, image, placeholder, sizes };
  caption.textContent = `${selected + 1} of ${cards().length}: ${image.alt}`;
  return { bounds, width, height };
}
function projectedTransform(from, to) {
  // Preserve the camera's rotation while moving the SAME image between the
  // scene and modal. Its source box and viewer box set the translation/scale.
  const dx = from.bounds.x + from.bounds.width / 2 - to.x - to.width / 2;
  const dy = from.bounds.y + from.bounds.height / 2 - to.y - to.height / 2;
  return `perspective(1800px) translate3d(${dx}px, ${dy}px, 0) rotateY(-28deg) skewY(16deg) scale(${from.width / to.width}, ${from.height / to.height})`;
}
async function openPhoto({ initial = false } = {}) {
  if (viewer.open || closing || !cards().length) return;
  interacted();
  const from = liftImage(selected);
  viewer.show();
  const to = lifted.image.getBoundingClientRect();
  canvas.classList.add('is-viewing');
  viewer.querySelector('[data-close-viewer]').focus({ preventScroll: true });
  if (initial || reducedMotion.matches) return;
  const opening = lifted.image.animate([
    { transform: projectedTransform(from, to) }, { transform: 'none' },
  ], { duration: 720, easing: 'cubic-bezier(.22,1,.36,1)' });
  flight = opening;
  await opening.finished.catch(() => {});
  if (flight === opening) flight = null;
}
async function closePhoto() {
  if (!viewer.open || closing) return;
  closing = true;
  flight?.cancel();
  const image = lifted?.image;
  const from = image?.getBoundingClientRect();
  canvas.classList.remove('is-viewing');
  selectPhoto(selected, { announce: false });
  // Measure the exact resting plane without waiting for the surrounding
  // stacks to settle; the source placeholder preserves its image dimensions.
  const card = cards()[selected];
  const savedTransition = card.style.transition;
  card.style.transition = 'none';
  const target = card.querySelector('img');
  const destination = { bounds: target.getBoundingClientRect(), width: target.offsetWidth, height: target.offsetHeight };
  card.style.transition = savedTransition;
  // Keep the placeholder concealed until the travelling image arrives.
  card.style.opacity = '0';
  if (image && !reducedMotion.matches) {
    flight = image.animate([
      { transform: 'none' }, { transform: projectedTransform(destination, from) },
    ], { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    await flight.finished.catch(() => {});
  }
  flight?.cancel();
  flight = null;
  restoreImage();
  card.style.opacity = '';
  viewer.close();
  closing = false;
  cards()[selected]?.focus({ preventScroll: true });
}
function showPhoto(index) {
  if (closing || !viewer.open) return;
  flight?.cancel();
  liftImage(index);
  if (!reducedMotion.matches) {
    flight = lifted.image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
  }
}
const previous = document.querySelector('[data-stack-previous]');
const next = document.querySelector('[data-stack-next]');
const counter = document.querySelector('[data-stack-counter]');
function selectPhoto(index, { announce = true } = {}) {
  const photos = cards();
  if (!photos.length) {
    selected = 0;
    counter.textContent = '00 / 00';
    previous.disabled = next.disabled = true;
    return;
  }
  selected = ((index % photos.length) + photos.length) % photos.length;
  photos.forEach((card, position) => {
    // Arrange the archive as a ring so neighbours stay adjacent at the seam.
    const offset = ((position - selected + Math.floor(photos.length / 2) + photos.length) % photos.length) - Math.floor(photos.length / 2);
    card.style.setProperty('--offset', offset);
    card.style.setProperty('--side', Math.sign(offset));
    card.style.setProperty('--depth', Math.abs(offset));
    card.style.zIndex = String(position === selected ? 100 : 50 - Math.min(Math.abs(offset), 49));
    card.classList.toggle('is-selected', position === selected);
    card.tabIndex = position === selected ? 0 : -1;
    if (position === selected) card.setAttribute('aria-current', 'true');
    else card.removeAttribute('aria-current');
    // Load the visible run of planes so the stacks show real photo edges.
    const source = card.querySelector('img');
    if (Math.abs(offset) <= 8) source.loading = 'eager';
  });
  counter.setAttribute('aria-live', announce ? 'polite' : 'off');
  counter.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  previous.disabled = next.disabled = photos.length < 2;
}
previous.addEventListener('click', () => { interacted(); selectPhoto(selected - 1); });
next.addEventListener('click', () => { interacted(); selectPhoto(selected + 1); });
let suppressClick = false;
collection.addEventListener('click', event => {
  const card = event.target.closest('.photo-page-card');
  if (!card || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (suppressClick) { suppressClick = false; return; }
  const index = cards().indexOf(card);
  interacted();
  if (index !== selected) { selectPhoto(index); return; }
  openPhoto();
});
canvas.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  interacted();
  selectPhoto(event.key === 'Home' ? 0 : event.key === 'End' ? cards().length - 1
    : selected + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1));
  canvas.focus({ preventScroll: true });
});
let wheelTotal = 0;
let lastWheel = 0;
let wheelLatched = false;
canvas.addEventListener('wheel', event => {
  if (event.ctrlKey || viewer.open || cards().length < 2) return;
  const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY)
    * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
  if (!delta) return;
  const now = performance.now();
  // A trackpad burst, including its decaying momentum, advances once. A new
  // gesture starts after idle; reversing direction remains immediately usable.
  if (now - lastWheel > 180 || (wheelTotal && Math.sign(delta) !== Math.sign(wheelTotal))) {
    wheelTotal = 0;
    wheelLatched = false;
  }
  lastWheel = now;
  event.preventDefault();
  interacted();
  wheelTotal += delta;
  if (wheelLatched || Math.abs(wheelTotal) < 45) return;
  wheelLatched = true;
  selectPhoto(selected + Math.sign(wheelTotal));
}, { passive: false });
let drag;
let dragFrame;
function clearDrag() {
  cancelAnimationFrame(dragFrame);
  canvas.classList.remove('is-dragging');
  canvas.style.setProperty('--drag-x', '0px');
  canvas.style.setProperty('--drag-y', '0px');
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || viewer.open) return;
  drag = { x: event.clientX, y: event.clientY, dx: 0, pointerId: event.pointerId, active: false };
  suppressClick = false;
});
canvas.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.active && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy))) return;
  if (!drag.active) {
    drag.active = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
    interacted();
  }
  drag.dx = dx;
  cancelAnimationFrame(dragFrame);
  dragFrame = requestAnimationFrame(() => {
    if (!drag) return;
    const travel = dx;
    canvas.style.setProperty('--drag-x', `${travel}px`);
    canvas.style.setProperty('--drag-y', `${travel * -.18}px`);
  });
});
window.addEventListener('pointerup', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const completed = drag;
  drag = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  clearDrag();
  if (!completed.active) return;
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 300);
  const threshold = Math.min(90, canvas.clientWidth * .14);
  if (Math.abs(completed.dx) > threshold) selectPhoto(selected + (completed.dx < 0 ? 1 : -1));
});
window.addEventListener('pointercancel', () => { drag = null; clearDrag(); });
canvas.addEventListener('dragstart', event => event.preventDefault());
selectPhoto(selected, { announce: false });
viewer.querySelector("[data-close-viewer]").addEventListener("click", closePhoto);
viewer.addEventListener('click', event => {
  if (event.target === viewer || event.target === media) closePhoto();
});
viewer.querySelector("[data-previous-photo]").addEventListener("click", () => showPhoto(selected - 1));
viewer.querySelector("[data-next-photo]").addEventListener("click", () => showPhoto(selected + 1));
viewer.addEventListener("keydown", event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closePhoto();
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    showPhoto(selected + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1));
  }
});
viewer.addEventListener('cancel', event => { event.preventDefault(); closePhoto(); });
viewer.addEventListener('close', () => {
  canvas.classList.remove('is-viewing');
  restoreImage();
  cards()[selected]?.focus({ preventScroll: true });
});

// Start in the middle of the complete collection. A slow API response must
// not move visitors who have already begun browsing.
async function loadUploads() {
  try {
    const response = await fetch("/api/photography/exhibition?all=1");
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return;
    const body = await response.json();
    photoTags = new Map((body.photos ?? []).map(photo => [new URL(photo.src, location.origin).href, photo.tags ?? []]));
    const currentCard = cards()[selected];
    if (body.collection === 'all') {
      const publicSources = new Set(body.photos.map(photo => photo.src));
      for (const card of cards()) {
        if (!publicSources.has(card.getAttribute('href')) && !(hasInteracted && card === currentCard)) card.remove();
      }
    }
    const existing = new Set(cards().map(card => card.getAttribute("href")));
    const photos = (body.photos ?? []).filter(photo => !existing.has(photo.src) && photo.width > 0 && photo.height > 0);
    photos.forEach(photo => {
      const url = new URL(photo.src, location.origin);
      if (!["http:", "https:"].includes(url.protocol)) return;
      const card = document.createElement("a");
      card.className = "photo-page-card";
      card.href = url.href;
      card.setAttribute("aria-label", photo.alt || "Photograph");
      card.innerHTML = photoMarkup(photo, { sizes: "(max-width: 700px) 72vw, (min-width: 1600px) 480px, 30vw", preview: true });
      canvas.append(card);
    });
    // Keep delegation and the viewer's sequence shared across both canvases.
    selectPhoto(hasInteracted ? Math.max(0, cards().indexOf(currentCard)) : Math.floor(cards().length / 2), { announce: false });
    renderCategories();
  } catch { /* The prerendered collection is complete when the API is unavailable. */ }
}
loadUploads().finally(() => {
  if (!hasInteracted && matchMedia('(min-width: 701px)').matches) openPhoto({ initial: true });
});
