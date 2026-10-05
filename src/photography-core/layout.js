import { hashString, seededRandom } from "./random.js";

// Positions are deterministic per (key, photo, slot). Selection and layout are separate:
// this module only decides where a photo sits, never which photos appear.
//
// Slot spacing uses a golden-angle sequence so neighbouring slots spread across the canvas
// instead of clumping; the seeded jitter keeps it from looking like a grid.
export function layoutFor(photo, { key, slot, mobile = false }) {
  const random = seededRandom(hashString(`layout:${key}:${photo.id}:${mobile ? "m" : "d"}`));
  const golden = 0.6180339887;
  const spread = (slot * golden + random() * 0.18) % 1;
  const band = (slot * 0.37 + random() * 0.21) % 1;
  const portrait = photo.orientation === "portrait";

  if (mobile) {
    const width = portrait ? 34 + random() * 8 : 52 + random() * 12;
    return {
      x: clamp(4 + spread * (92 - width), 0, 100 - width),
      y: clamp(4 + band * 88, 0, 92),
      width,
      rotation: round((random() - 0.5) * 8),
      depth: Math.floor(random() * 5),
    };
  }

  const width = portrait ? 16 + random() * 8 : 26 + random() * 12;
  return {
    x: clamp(3 + spread * (94 - width), 0, 100 - width),
    y: clamp(6 + band * 78, 0, 84),
    width,
    rotation: round((random() - 0.5) * 7),
    depth: Math.floor(random() * 6),
  };
}

export function layoutForSelection(photos, options) {
  return photos.map((photo, slot) => ({ id: photo.id, ...layoutFor(photo, { ...options, slot }) }));
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}
