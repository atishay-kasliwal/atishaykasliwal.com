// Rotates the homepage's maintainer quotes (index.html, .hero-quotes): one at a time, a new one
// every 5 seconds, cross-fading. Pauses while hovered or focused, and with the pause button; with
// reduced motion it never moves on its own. The dots pick a quote directly. Each automatic change
// fires "hero-side:advance" on the page, which moves the QR tree on with it (src/hero-tree.js).
const ROTATE_MS = 5000;

export function setupHeroQuotes(root = document.querySelector("[data-hero-quotes]")) {
  if (!root) return;
  const quotes = [...root.querySelectorAll(".hero-quote")];
  const dots = [...root.querySelectorAll(".hero-quote-dot")];
  const pause = root.querySelector(".hero-quote-pause");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let paused = reduced;
  let hovered = false;

  // All quotes share one spot (style.css, .is-crossfade), so the card keeps the height of the
  // longest and one fades into the next. The ones not showing can't be reached or read out.
  const setActive = (quote, active) => {
    quote.hidden = false;
    quote.classList.toggle("is-active", active);
    quote.inert = !active;
    if (active) quote.removeAttribute("aria-hidden");
    else quote.setAttribute("aria-hidden", "true");
  };
  quotes.forEach((quote, i) => setActive(quote, i === index));
  quotes[0].parentElement.classList.add("is-crossfade");

  const show = next => {
    setActive(quotes[index], false);
    dots[index].removeAttribute("aria-current");
    index = (next + quotes.length) % quotes.length;
    setActive(quotes[index], true);
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
    root.dispatchEvent(new CustomEvent("hero-side:advance", { bubbles: true }));
  }, ROTATE_MS);
}
