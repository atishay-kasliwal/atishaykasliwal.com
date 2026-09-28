import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { setupInfoSheet } from "./info-sheet.js";

const deck = document.querySelector("#photo-deck");
const cards = [...deck.querySelectorAll("[data-photo-index]")];
const counter = document.querySelector("[data-photo-current]");
const motionButton = document.querySelector("[data-photo-motion]");
const content = document.querySelector(".photography-content");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const rotationInterval = 2500;
let current = 0;
let swipeStart;
let suppressClick = false;
let paused = false;
let hovered = false;
let keyboardFocused = false;
let resumeAt = 0;

function select(index, { focus = false, manual = false } = {}) {
  if (manual) resumeAt = performance.now() + rotationInterval;
  current = (index + cards.length) % cards.length;
  cards.forEach((card, position) => {
    let offset = (position - current + cards.length) % cards.length;
    if (offset > cards.length / 2) offset -= cards.length;
    const distance = Math.abs(offset);
    card.style.setProperty("--offset", offset);
    card.style.setProperty("--distance", distance);
    card.style.setProperty("--turn", `${Math.sign(offset) * -24}deg`);
    card.style.zIndex = String(20 - distance);
    card.dataset.near = String(distance <= 4);
    card.classList.toggle("is-current", position === current);
    if (position === current) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
    card.tabIndex = position === current ? 0 : -1;
    if (position === current) card.removeAttribute("aria-hidden");
    else card.setAttribute("aria-hidden", "true");
  });
  // Automatic changes stay silent; deliberate browsing announces the position.
  counter.closest(".photo-page-counter").setAttribute("aria-live", manual ? "polite" : "off");
  counter.textContent = String(current + 1).padStart(2, "0");
  if (focus) cards[current].focus({ preventScroll: true });
}

cards.forEach((card, index) => {
  card.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (suppressClick) { suppressClick = false; return; }
    if (index !== current) select(index, { manual: true });
  });
});
document.querySelector("[data-photo-previous]").addEventListener("click", () => select(current - 1, { manual: true }));
document.querySelector("[data-photo-next]").addEventListener("click", () => select(current + 1, { manual: true }));
deck.addEventListener("keydown", event => {
  if (!["ArrowLeft", "ArrowRight", " "].includes(event.key)) return;
  event.preventDefault();
  if (event.key !== " ") select(current + (event.key === "ArrowRight" ? 1 : -1), { focus: true, manual: true });
});
deck.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  swipeStart = { x: event.clientX, y: event.clientY };
  suppressClick = false;
});
// Keep native image/link dragging from consuming a swipe gesture.
deck.addEventListener("dragstart", event => event.preventDefault());
window.addEventListener("pointerup", event => {
  if (!swipeStart) return;
  const x = event.clientX - swipeStart.x;
  const y = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(x) < 40 || Math.abs(x) < Math.abs(y)) return;
  suppressClick = true;
  select(current + (x < 0 ? 1 : -1), { manual: true });
});
window.addEventListener("pointercancel", () => { swipeStart = null; });

function updateMotionControl() {
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = paused || reducedMotion.matches ? "▷" : "Ⅱ";
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.setAttribute("aria-label", reducedMotion.matches
    ? "Automatic photo changes disabled for reduced motion"
    : paused ? "Resume automatic photo changes" : "Pause automatic photo changes");
}
motionButton.addEventListener("click", () => { paused = !paused; updateMotionControl(); });
reducedMotion.addEventListener("change", updateMotionControl);
deck.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") hovered = true; });
deck.addEventListener("pointerleave", () => { hovered = false; });
content.addEventListener("pointerdown", () => { keyboardFocused = false; });
content.addEventListener("focusin", event => { keyboardFocused = event.target.matches(":focus-visible"); });
content.addEventListener("focusout", () => queueMicrotask(() => {
  keyboardFocused = content.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
}));

select(0);
updateMotionControl();
// Leave time to enjoy each photograph and finish the card transition.
setInterval(() => {
  if (paused || reducedMotion.matches || hovered || keyboardFocused || swipeStart || document.hidden
    || document.querySelector("dialog[open]") || performance.now() < resumeAt) return;
  select(current + 1);
}, rotationInterval);
clearTimeout(window.photographyFallback);
document.documentElement.classList.add("photography-enhancing");
setupInfoSheet();
const time = document.querySelector("#local-time");
const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
function updateTime() { const now = new Date(); time.dateTime = now.toISOString(); time.textContent = formatter.format(now); }
updateTime();
setInterval(updateTime, 10000);
