// Draws a PDF as clean paper pages with pdf.js (already used for the upload check), instead of the
// browser's PDF viewer and its toolbar. Pages fit the container width and redraw when it resizes.
import { h } from "../common.js";

const cache = new Map();
let observer = null;

async function loadPdf(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      (async () => {
        const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) throw new Error(`The PDF could not be loaded (${response.status}).`);
        const { getDocumentProxy } = await import("unpdf");
        return getDocumentProxy(new Uint8Array(await response.arrayBuffer()), { isEvalSupported: false, verbosity: 0 });
      })(),
    );
  }
  return cache.get(url);
}

async function draw(pdf, sheet, token) {
  const width = Math.max(240, Math.min(sheet.clientWidth - 48, 860));
  const ratio = window.devicePixelRatio || 1;
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * ratio });
    const canvas = h("canvas", { class: "rz-page", width: Math.floor(viewport.width), height: Math.floor(viewport.height), "aria-label": `Page ${number}` });
    canvas.style.width = `${Math.floor(viewport.width / ratio)}px`;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    if (token !== sheet.dataset.token) return;
    pages.push(canvas);
  }
  sheet.replaceChildren(...pages);
}

// Render `url` into `sheet`. A newer call for the same sheet cancels an older one.
export async function showPdf(sheet, url) {
  const token = `${url}#${Date.now()}`;
  sheet.dataset.token = token;
  sheet.replaceChildren(h("p", { class: "rz-paper-status" }, "Rendering…"));
  observer?.disconnect();
  try {
    const pdf = await loadPdf(url);
    await draw(pdf, sheet, token);
    let width = sheet.clientWidth;
    let timer = null;
    observer = new ResizeObserver(() => {
      if (Math.abs(sheet.clientWidth - width) < 24) return;
      width = sheet.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(() => sheet.dataset.token === token && draw(pdf, sheet, token), 150);
    });
    observer.observe(sheet);
  } catch (error) {
    cache.delete(url);
    if (sheet.dataset.token === token) sheet.replaceChildren(h("p", { class: "rz-paper-status" }, error.message, " ", h("a", { href: url, target: "_blank", rel: "noopener" }, "Open the PDF ", h("span", { class: "arrow", "aria-hidden": "true" }, "↗"))));
  }
}
