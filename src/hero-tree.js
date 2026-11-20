// The homepage's 3D tree (src/magic-tree, MIT, by the Magic Tree contributors). Its plot is a real
// QR code, rotating between the résumé, LinkedIn and GitHub, each in its own colours; the résumé
// tree follows the calendar (Thanksgiving in November, Christmas in December, and so on). Tapping
// the tree drops the leaves into the code to scan, and pauses the rotation until tapped again.
// Loaded by src/main.js only on wide screens, after the page has loaded, without reduced motion.
import { MagicTreeScene } from "./magic-tree/scene/index.ts";
import { SPECIES } from "./magic-tree/scene/species.ts";

const ROTATE_MS = 15_000;

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

export function seasonFor(date = new Date()) {
  const key = (date.getMonth() + 1) * 100 + date.getDate();
  return SEASONS.find(s => key >= s.from[0] * 100 + s.from[1] && key <= s.to[0] * 100 + s.to[1]) ?? SEASONS[3];
}

function targets(links) {
  const season = seasonFor();
  return [
    { id: "resume", label: "Résumé", note: season.name, href: links.resume, species: season.species, palette: season.palette, color: season.palette.leaf[0] },
    { id: "linkedin", label: "LinkedIn", note: "Profile", href: links.linkedin, species: "oak", color: "#378fe9",
      palette: palette("linkedin", ["#0a66c2", "#378fe9", "#70b5f9", "#0b4f99"], ["#0a2540", "#0b2e52", "#082036"], ["#2b5d8f", "#24507c", "#3a6fa3"], "#5b6470", "#3c434c") },
    { id: "github", label: "GitHub", note: "Code", href: links.github, species: "birch", color: "#40c463",
      palette: palette("github", ["#9be9a8", "#40c463", "#30a14e", "#216e39"], ["#0e4429", "#0b3a22", "#126633"], ["#26a641", "#006d32", "#39d353"], "#8b949e", "#6e7681") },
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
    scene = new MagicTreeScene(canvas, first.href, first.palette, SPECIES[first.species]);
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

  const next = () => {
    if (scene.mode === "code") return; // Someone is scanning: leave the code up.
    index = (index + 1) % list.length;
    const target = list[index];
    root.classList.add("is-changing");
    setTimeout(() => {
      scene.setPalette(target.palette);
      scene.setSpecies(SPECIES[target.species]);
      scene.setText(target.href);
      show(target);
      root.classList.remove("is-changing");
    }, 260);
  };
  let timer = setInterval(next, ROTATE_MS);

  canvas.addEventListener("click", () => {
    const mode = scene.toggleMode();
    root.classList.toggle("is-code", mode === "code");
    clearInterval(timer);
    if (mode === "tree") timer = setInterval(next, ROTATE_MS);
  });
  new ResizeObserver(() => scene.resize()).observe(canvas);
}
