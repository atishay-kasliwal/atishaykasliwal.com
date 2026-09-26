// Desktop scroll story, after Elliott Mangham's portfolio: the page gets a scroll track while the
// layout stays pinned, and scrolling swaps three statements word by word (each word rises out of
// its own mask). Below 1101px wide (three columns get too narrow), on short landscape screens and
// with reduced motion, the page keeps the single first statement.
const enabled = matchMedia("(min-width: 1101px) and (min-height: 461px) and (prefers-reduced-motion: no-preference)");

// Scroll progress (0–1) at which each statement's words enter and leave.
const windows = [
  { enter: null, leave: [0.06, 0.36] },
  { enter: [0.14, 0.44], leave: [0.56, 0.84] },
  { enter: [0.62, 0.92], leave: null },
];

const easeOut = t => 1 - (1 - t) ** 3;
const easeIn = t => t ** 3;
const clamp = t => Math.min(1, Math.max(0, t));

function splitWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parts = node.textContent.split(/(\s+)/);
    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(" ");
        continue;
      }
      const mask = document.createElement("span");
      mask.className = "word-mask";
      const word = document.createElement("span");
      word.className = "word";
      word.textContent = part;
      mask.append(word);
      fragment.append(mask);
    }
    node.replaceWith(fragment);
  }
  return [...element.querySelectorAll(".word")];
}

// Where word `i` of `n` is within a window: words start one after another and overlap.
function wordProgress(progress, [start, end], i, n) {
  const span = (end - start) * 0.4;
  const from = start + ((end - start - span) * i) / Math.max(1, n - 1);
  return clamp((progress - from) / span);
}

export function setupScrollStory({ onScroll } = {}) {
  const statements = [...document.querySelectorAll(".statement")];
  const cueBar = document.querySelector(".scroll-cue b");
  const root = document.documentElement;
  let words = null;
  let frame = 0;
  let lastY = 0;

  function render() {
    frame = 0;
    const max = root.scrollHeight - innerHeight;
    const progress = max > 0 ? clamp(scrollY / max) : 0;
    cueBar.style.transform = `scaleX(${progress})`;
    words.forEach((list, s) => {
      const { enter, leave } = windows[s];
      list.forEach((word, i) => {
        let y = 0;
        if (enter && progress < (leave ? leave[0] : 1)) y = 105 * (1 - easeOut(wordProgress(progress, enter, i, list.length)));
        else if (leave) y = -105 * easeIn(wordProgress(progress, leave, i, list.length));
        word.style.transform = y ? `translateY(${y.toFixed(2)}%)` : "";
      });
    });
  }

  function handleScroll() {
    const delta = scrollY - lastY;
    lastY = scrollY;
    if (delta) onScroll?.(delta);
    if (!frame) frame = requestAnimationFrame(render);
  }

  function apply() {
    root.classList.toggle("scroll-story", enabled.matches);
    if (enabled.matches) {
      words ??= statements.map(splitWords);
      addEventListener("scroll", handleScroll, { passive: true });
      lastY = scrollY;
      render();
    } else {
      removeEventListener("scroll", handleScroll);
      if (words) words.flat().forEach(word => { word.style.transform = ""; });
      scrollTo(0, 0);
    }
  }

  // Always open on the first statement, not wherever the last visit left off.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  apply();
  enabled.addEventListener("change", apply);
}
