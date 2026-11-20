// Rotates the homepage's maintainer quotes (index.html, .hero-quotes): one at a time, a new one
// every 7 seconds. Pauses while hovered or focused, and with the pause button; with reduced motion
// it never moves on its own. The dots pick a quote directly.
const ROTATE_MS = 7000;

export function setupHeroQuotes(root = document.querySelector("[data-hero-quotes]")) {
  if (!root) return;
  const quotes = [...root.querySelectorAll(".hero-quote")];
  const dots = [...root.querySelectorAll(".hero-quote-dot")];
  const pause = root.querySelector(".hero-quote-pause");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let paused = reduced;
  let hovered = false;

  const show = next => {
    quotes[index].hidden = true;
    dots[index].removeAttribute("aria-current");
    index = (next + quotes.length) % quotes.length;
    quotes[index].hidden = false;
    dots[index].setAttribute("aria-current", "true");
  };
  const setPaused = value => {
    paused = value;
    pause.textContent = paused ? "▶" : "Ⅱ";
    pause.setAttribute("aria-label", paused ? "Play the quotes" : "Pause the quotes");
  };
  setPaused(paused);

  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
  pause.addEventListener("click", () => setPaused(!paused));
  root.addEventListener("pointerenter", () => { hovered = true; });
  root.addEventListener("pointerleave", () => { hovered = false; });
  setInterval(() => {
    if (paused || hovered || root.contains(document.activeElement) || document.hidden) return;
    show(index + 1);
  }, ROTATE_MS);
}
