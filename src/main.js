import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { projects } from "./projects.js";
import { startIntro } from "./intro.js";
import { createProjectPreview } from "./project-preview.js";
import { setupInfoSheet } from "./info-sheet.js";

const viewport = document.querySelector("#carousel-viewport");
const track = document.querySelector("#carousel-track");
const work = document.querySelector(".work");
const pauseButton = document.querySelector("#toggle-carousel-motion");
const count = projects.length;
let selected = 0;
let cursor = count + selected;
let step = 0;
let cardWidth = 0;
let offset = 0;
let dragging = false;
let moved = false;
let origin = 0;
let dragStartOffset = 0;
let busy = false;
let hovered = false;
let keyboardFocused = false;
let paused = false;
let lastFrame;
let resumeAt = 0;
let renderedCursor = -1;
// The reference drifts left at approximately 18 CSS pixels per second.
const autoplaySpeed = 18;
let animationTimer;
let clickResetTimer;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Three copies allow a continuous loop. Only the middle copy is exposed to assistive technology.
track.innerHTML = Array.from({ length: 3 }, (_, copy) =>
  projects
    .map(
      (project, index) => `
  <button class="project-card ${project.theme}" data-index="${index}" data-position="${copy * count + index}"
    tabindex="-1" ${copy !== 1 ? 'aria-hidden="true"' : ""}
    aria-label="${project.name}, ${project.category}. Open project preview.">
    <span class="project-art">${project.card ?? project.art}</span>
    <span class="card-tag">${String(index + 1).padStart(2, "0")} / ${project.tag}</span>
  </button>`,
    )
    .join(""),
).join("");

const cards = [...track.querySelectorAll(".project-card")];
const projectPreview = createProjectPreview(projects, viewport);
const hoverCapable = matchMedia("(hover: hover) and (pointer: fine)");
cards.forEach(card => {
  card.addEventListener("pointerenter", event => {
    if (hoverCapable.matches && event.pointerType === "mouse" && !dragging && !busy) {
      projectPreview.hover(Number(card.dataset.index));
    }
  });
  card.addEventListener("pointerleave", () => projectPreview.leave());
});
document.querySelector("#total-count").textContent = String(count).padStart(
  2,
  "0",
);

function draw(animate = false) {
  track.style.transition =
    animate && !reducedMotion.matches
      ? "transform 480ms cubic-bezier(.22,.75,.22,1)"
      : "none";
  const x = viewport.clientWidth / 2 - cardWidth / 2 - cursor * step + offset;
  track.style.transform = `translate3d(${x}px, 0, 0)`;
  if (renderedCursor === cursor) return;
  renderedCursor = cursor;
  cards.forEach((card, position) => {
    const active = position === cursor;
    card.classList.toggle("is-active", active);
    card.tabIndex =
      active && position >= count && position < count * 2 ? 0 : -1;
    if (active) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  });
}

function measure() {
  const oldStep = step;
  // Layout width excludes the decorative scale on inactive cards.
  cardWidth = parseFloat(getComputedStyle(cards[0]).width);
  step = cardWidth + parseFloat(getComputedStyle(track).gap);
  if (oldStep) offset *= step / oldStep;
  draw();
}

function wrap() {
  // Keep the nearest card selected and silently recycle identical copies.
  const crossed = Math.floor((-offset + step / 2) / step);
  cursor += crossed;
  offset += crossed * step;
  const nextSelected = ((cursor % count) + count) % count;
  cursor = count + nextSelected;
  if (selected !== nextSelected) {
    selected = nextSelected;
    updateCaption();
  }
}

function tick(timestamp) {
  const elapsed =
    lastFrame === undefined ? 0 : Math.min(timestamp - lastFrame, 50);
  lastFrame = timestamp;
  const blocked =
    paused ||
    reducedMotion.matches ||
    hovered ||
    keyboardFocused ||
    dragging ||
    busy ||
    document.hidden ||
    timestamp < resumeAt ||
    document.querySelector(".portfolio").inert ||
    document.querySelector("dialog[open]");
  if (!blocked) {
    offset -= (autoplaySpeed * elapsed) / 1000;
    wrap();
    draw();
  }
  requestAnimationFrame(tick);
}

function updateMotionControl() {
  pauseButton.disabled = reducedMotion.matches;
  const stopped = paused || reducedMotion.matches;
  pauseButton.textContent = stopped ? "▷" : "Ⅱ";
  pauseButton.setAttribute(
    "aria-label",
    reducedMotion.matches
      ? "Automatic movement disabled for reduced motion"
      : stopped
        ? "Resume automatic carousel movement"
        : "Pause automatic carousel movement",
  );
  pauseButton.title = pauseButton.getAttribute("aria-label");
}

pauseButton.addEventListener("click", () => {
  paused = !paused;
  updateMotionControl();
});
reducedMotion.addEventListener("change", updateMotionControl);
work.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse" || event.pointerType === "pen")
    hovered = true;
});
work.addEventListener("pointerleave", () => {
  hovered = false;
});
work.addEventListener("pointerdown", () => {
  keyboardFocused = false;
});
work.addEventListener("focusin", (event) => {
  keyboardFocused = event.target.matches(":focus-visible");
  document
    .querySelector(".project-counter")
    .setAttribute("aria-live", keyboardFocused ? "polite" : "off");
});
work.addEventListener("focusout", () => {
  queueMicrotask(() => {
    if (!work.contains(document.activeElement)) {
      keyboardFocused = false;
      document
        .querySelector(".project-counter")
        .setAttribute("aria-live", "off");
    }
  });
});

function updateCaption() {
  document.querySelector("#current-index").textContent = String(
    selected + 1,
  ).padStart(2, "0");
  const caption = document.querySelector("#selected-project");
  caption.replaceChildren(
    document.createTextNode(projects[selected].name + " "),
  );
  const category = document.createElement("span");
  category.textContent = `— ${projects[selected].category}`;
  caption.append(category);
}

function finishMovement() {
  clearTimeout(animationTimer);
  cursor = count + selected;
  busy = false;
  draw();
}

function moveBy(delta) {
  if (busy || !delta) return;
  projectPreview.close({ immediate: true });
  busy = true;
  resumeAt = performance.now() + 1000;
  cursor += delta;
  selected = ((cursor % count) + count) % count;
  offset = 0;
  updateCaption();
  draw(true);
  animationTimer = setTimeout(finishMovement, reducedMotion.matches ? 0 : 500);
}

track.addEventListener("transitionend", (event) => {
  if (event.target === track && event.propertyName === "transform")
    finishMovement();
});
document.querySelector("#previous").addEventListener("click", () => moveBy(-1));
document.querySelector("#next").addEventListener("click", () => moveBy(1));
viewport.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    keyboardFocused = true;
    // Keep keyboard focus on the carousel as its active project changes.
    viewport.focus({ preventScroll: true });
    moveBy(event.key === "ArrowLeft" ? -1 : 1);
  }
  if (event.key === "Enter" && event.target === viewport) {
    event.preventDefault();
    projectPreview.open(selected, viewport);
  }
});

viewport.addEventListener("pointerdown", (event) => {
  if ((event.pointerType === "mouse" && event.button !== 0) || busy) return;
  clearTimeout(clickResetTimer);
  projectPreview.close({ immediate: true });
  dragging = true;
  moved = false;
  origin = event.clientX;
  dragStartOffset = offset;
});
viewport.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const distance = event.clientX - origin;
  offset = dragStartOffset + distance;
  if (Math.abs(distance) > 6) {
    moved = true;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
  }
  // Restrict each gesture to the available buffer of cards.
  offset = Math.max(-step * 3, Math.min(step * 3, offset));
  if (moved) draw();
});
function endDrag(event, cancelled = false) {
  if (!dragging) return;
  dragging = false;
  resumeAt = performance.now() + 1200;
  viewport.classList.remove("is-dragging");
  if (viewport.hasPointerCapture(event.pointerId))
    viewport.releasePointerCapture(event.pointerId);
  if (moved) {
    const dragDistance = offset - dragStartOffset;
    const delta = cancelled
      ? 0
      : Math.abs(dragDistance) > step * 0.15
        ? -Math.sign(dragDistance) *
          Math.max(1, Math.round(Math.abs(dragDistance) / step))
        : 0;
    offset = 0;
    if (delta) moveBy(delta);
    else draw(true);
  }
  clickResetTimer = setTimeout(() => {
    moved = false;
  }, 0);
}
viewport.addEventListener("pointerup", (event) => endDrag(event));
viewport.addEventListener("pointercancel", (event) => endDrag(event, true));
viewport.addEventListener("pointerleave", (event) => {
  if (dragging && !viewport.hasPointerCapture(event.pointerId))
    endDrag(event, true);
});
viewport.addEventListener("click", (event) => {
  if (moved || busy) return;
  const card = event.target.closest(".project-card");
  if (!card) return;
  projectPreview.open(Number(card.dataset.index), card);
});

viewport.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey || busy || dragging) return;
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    projectPreview.close({ immediate: true });
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? viewport.clientWidth
          : 1;
    offset -= delta * unit;
    resumeAt = performance.now() + 1200;
    wrap();
    draw();
  },
  { passive: false },
);

document
  .querySelector("#open-project")
  .addEventListener("click", event => projectPreview.open(selected, event.currentTarget));
// Shows the time where Atishay is, not the visitor's local time.
const time = document.querySelector("#local-time");
const newYorkTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
function updateTime() {
  const now = new Date();
  time.dateTime = now.toISOString();
  time.textContent = newYorkTime.format(now);
}
updateTime();
setInterval(updateTime, 10000);
new ResizeObserver(measure).observe(viewport);
document.querySelector(".project-counter").setAttribute("aria-live", "off");
updateCaption();
measure();
updateMotionControl();
setupInfoSheet();
startIntro();
requestAnimationFrame(tick);
