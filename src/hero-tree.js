// The homepage's 3D tree (src/magic-tree, MIT, by the Magic Tree contributors). Its plot is a real
// QR code, rotating between the résumé, LinkedIn and GitHub, and each link is a season of the same
// tree: the résumé follows the calendar (Thanksgiving in November, Christmas in December, and so
// on), LinkedIn is winter in LinkedIn blue and frost white, GitHub is spring in contribution greens
// with merged-pull-request purple blossom. The tree keeps its shape; only the code under it changes,
// and its leaves turn to the next season's colours a few at a time, over a few seconds. Tapping the tree drops the
// leaves into the code to scan, and holds it until tapped again. It changes together with the
// maintainer quotes (src/hero-quotes.js), so it pauses whenever they do.
// Loaded by src/main.js only on wide screens, after the page has loaded, without reduced motion.
import { MagicTreeScene } from "./magic-tree/scene/index.ts";
import { SPECIES } from "./magic-tree/scene/species.ts";

// The plot stays pale so the code scans; the slab and rim sit dark on the black page.
const ground = { moduleDark: "#cfcdc4", moduleLight: "#efefec", slab: "#1c1c1a", ground: "#000000" };
const palette = (id, leaf, qrLeaf, hedge, bark = "#6f5540", barkDark = "#4a382a") => ({ id, label: id, leaf, qrLeaf, hedge, bark, barkDark, ...ground });

// The résumé tree for today's date: [first month, first day, last month, last day] (months 1–12).
const SEASONS = [
  { name: "New Year", from: [1, 1], to: [1, 31], species: "birch", palette: palette("new-year", ["#d4af37", "#e8c766", "#c8c8c8", "#f2e3a1"], ["#4a3a0c", "#3d300a", "#2e2e2e"], ["#8a8f96", "#7a7f86", "#9aa0a6"], "#d8d4cc", "#9a958c") },
  { name: "Valentine's", from: [2, 1], to: [2, 14], species: "willow", palette: palette("valentine", ["#f4b8cf", "#efa4c2", "#e35f7a", "#e88fb2"], ["#5e2340", "#4e1c35", "#6b2b4a"], ["#8fbf6a", "#7bad57", "#a2cd7e"], "#8a6a4e", "#5f4733") },
  { name: "Spring", from: [2, 15], to: [5, 31], species: "oak", palette: palette("spring", ["#f4b8cf", "#efa4c2", "#f8cfe0", "#e88fb2"], ["#5e2340", "#4e1c35", "#6b2b4a"], ["#8fbf6a", "#7bad57", "#a2cd7e"], "#8a6a4e", "#5f4733") },
  { name: "Summer", from: [6, 1], to: [8, 31], species: "oak", palette: palette("summer", ["#6ab24a", "#5aa03c", "#84c664", "#4c8f31"], ["#255417", "#1e4512", "#2c631d"], ["#7ec25a", "#6bb047", "#93d06f"], "#8a6a4e", "#5f4733") },
  { name: "Autumn", from: [9, 1], to: [10, 19], species: "oak", palette: palette("autumn", ["#f2a13c", "#e8842a", "#f7c05e", "#d96a1f"], ["#8a400c", "#763409", "#9c4c12"], ["#dcb84a", "#c9a437", "#e8cc6a"]) },
  { name: "Halloween", from: [10, 20], to: [10, 31], species: "willow", palette: palette("halloween", ["#f28c28", "#e36414", "#7b3fa0", "#f2a13c"], ["#5a2508", "#4a1f07", "#3a1650"], ["#5c4a2e", "#4a3b24", "#6e5a38"], "#3d3128", "#2a211b") },
  { name: "Thanksgiving", from: [11, 1], to: [11, 30], species: "oak", palette: palette("thanksgiving", ["#c2581b", "#d97a2b", "#a8431a", "#e3a03a"], ["#5a210a", "#4a1b08", "#6b2a0e"], ["#b8892f", "#9c7426", "#cf9f45"]) },
  { name: "Christmas", from: [12, 1], to: [12, 31], species: "pine", palette: palette("christmas", ["#1f6b3a", "#2a8048", "#17552d", "#236f40", "#1f6b3a", "#b3261e"], ["#0d2e18", "#0a2613", "#11381e"], ["#e8eef0", "#dfe7ea", "#f4f8f9"], "#5a4232", "#3d2c21") },
];

// One two-storey oak (the crown raised on a taller trunk, src/magic-tree/scene/tree.ts) with a fuller
// crown: a fifth larger, half again bigger leaves, packed tighter. The leaf count is fixed by the QR code.
const TREE = (s => ({ ...s, storeys: 2, heightFactor: s.heightFactor * 1.2, leafSize: s.leafSize.map(v => v * 1.5), cluster: s.cluster.map(v => v * 0.8) }))(SPECIES.oak);
// Every link's code at one size (version 6, 41 modules: what the résumé URL needs at level H) and one
// tree shape over all of them, so the ground, the framing and the tree never move.
const SCENE = { qrVersion: 6, treeSeed: "atishaykasliwal.com" };
const BLEND_MS = 3600;
const LABEL_FADE_MS = 350;

// Colour lists at fixed lengths, so leaf i takes the same slot in every season and can blend.
const LENGTHS = { leaf: 6, qrLeaf: 3, hedge: 3 };
const fit = (list, n) => Array.from({ length: n }, (_, i) => list[i % list.length]);
const even = p => ({ ...p, leaf: fit(p.leaf, LENGTHS.leaf), qrLeaf: fit(p.qrLeaf, LENGTHS.qrLeaf), hedge: fit(p.hedge, LENGTHS.hedge) });
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mixHex = (a, b, t) => `#${rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
function mix(a, b, t) {
  const out = { ...b };
  for (const key of Object.keys(LENGTHS)) out[key] = a[key].map((c, i) => mixHex(c, b[key][i], t));
  for (const key of ["bark", "barkDark", "moduleDark", "moduleLight", "slab"]) out[key] = mixHex(a[key], b[key], t);
  return out;
}

export function seasonFor(date = new Date()) {
  const key = (date.getMonth() + 1) * 100 + date.getDate();
  return SEASONS.find(s => key >= s.from[0] * 100 + s.from[1] && key <= s.to[0] * 100 + s.to[1]) ?? SEASONS[3];
}

function targets(links) {
  const season = seasonFor();
  return [
    { id: "resume", label: "Résumé", note: season.name, href: links.resume, palette: even(season.palette), color: season.palette.leaf[0] },
    { id: "linkedin", label: "LinkedIn", note: "Winter", href: links.linkedin, color: "#378fe9",
      palette: even(palette("linkedin", ["#0a66c2", "#378fe9", "#ffffff", "#70b5f9", "#e8f1fb", "#ffffff"], ["#0a2540", "#0b2e52", "#082036"], ["#dfe7ea", "#cfdae0", "#eef3f5"], "#6b737d", "#454c55")) },
    { id: "github", label: "GitHub", note: "Spring", href: links.github, color: "#40c463",
      palette: even(palette("github", ["#40c463", "#30a14e", "#216e39", "#8957e5", "#a371f7", "#39d353"], ["#0e4429", "#0b3a22", "#3c1e70"], ["#26a641", "#006d32", "#39d353"], "#8b949e", "#6e7681")) },
  ];
}

export function mountHeroTree(root) {
  const canvas = root.querySelector("canvas");
  const link = root.querySelector("[data-tree-link]");
  const name = root.querySelector("[data-tree-name]");
  const note = root.querySelector("[data-tree-note]");
  const dot = root.querySelector("[data-tree-dot]");
  const list = targets({ resume: link.dataset.resume, linkedin: link.dataset.linkedin, github: link.dataset.github });
  let index = 0;
  let scene;
  try {
    const first = list[0];
    scene = new MagicTreeScene(canvas, first.href, first.palette, TREE, SCENE);
    scene.codeZoomOut = 2.15; // The tapped code at about the size of the ground, not filling the canvas,
    scene.codeAtBottom = true; // and down where the ground is, just above the label.
    scene.setFallingLeaves({ count: 80, size: 3.6 }); // Leaf-sized, breaking off the crown.
  } catch {
    return; // No WebGL: the side column keeps only the quotes.
  }
  root.hidden = false;
  const show = target => {
    link.href = target.href;
    name.textContent = target.label;
    note.textContent = target.note ? ` · ${target.note}` : "";
    dot.style.background = target.color;
    link.setAttribute("aria-label", `${target.label}: ${target.href}`);
  };
  show(list[0]);
  requestAnimationFrame(() => scene.resize());
  // The label fades out, changes, and fades back in (style.css, .is-fading).
  let labelTimer = 0;
  const fadeTo = target => {
    clearTimeout(labelTimer);
    link.classList.add("is-fading");
    labelTimer = setTimeout(() => {
      show(target);
      link.classList.remove("is-fading");
    }, LABEL_FADE_MS);
  };

  // The code switches at once (the tree over it stays the same); the colours follow over BLEND_MS.
  let shown = list[0].palette;
  let blend = 0;
  const next = () => {
    if (scene.mode === "code") return; // Someone is scanning: leave the code up.
    index = (index + 1) % list.length;
    const target = list[index];
    scene.setText(target.href);
    fadeTo(target);
    cancelAnimationFrame(blend);
    const from = shown;
    const start = performance.now();
    let frame = 0;
    const step = now => {
      const t = Math.min(1, (now - start) / BLEND_MS);
      const eased = t * t * (3 - 2 * t);
      // Every other frame is smooth enough for a colour change and halves the repainting.
      // The leaves turn a few at a time (canopy.ts, turnLeaves); everything else blends evenly.
      if (t === 1 || frame++ % 2 === 0) scene.setPaletteTurn(from, target.palette, t, (shown = mix(from, target.palette, eased)));
      if (t < 1) blend = requestAnimationFrame(step);
    };
    blend = requestAnimationFrame(step);
  };
  document.addEventListener("hero-side:advance", next);

  canvas.addEventListener("click", () => {
    const mode = scene.toggleMode();
    root.classList.toggle("is-code", mode === "code");
  });
  new ResizeObserver(() => scene.resize()).observe(canvas);
}
