import { hashString, seededRandom } from "./random.js";
import { publicPhotos } from "./library.js";

export const EXHIBITION_MIN = 20;
export const EXHIBITION_MAX = 30;

// Picks today's photographs. Deterministic per date and library contents: the same date
// always yields the same ids. Diversity penalties keep neighbouring picks from clustering
// on one colour, one orientation or one tag; the pass falls back to unpenalised picks
// only when the library is too small to satisfy the caps.
export function dailySelection(photos, dateKey, { min = EXHIBITION_MIN, max = EXHIBITION_MAX } = {}) {
  const pool = publicPhotos(photos);
  if (!pool.length) return [];
  const random = seededRandom(hashString(`select:${dateKey}`));
  const target = Math.min(pool.length, min + Math.floor(random() * (max - min + 1)));
  const order = shuffle(pool, random);

  const chosen = [];
  const counts = { colour: new Map(), orientation: new Map(), tag: new Map() };
  const penalty = photo => {
    const colour = photo.colors?.[0]?.name ?? "none";
    let score = 0;
    score += (counts.colour.get(colour) ?? 0) >= Math.ceil(target / 4) ? 2 : 0;
    score += (counts.orientation.get(photo.orientation) ?? 0) >= Math.ceil(target / 2) ? 1 : 0;
    for (const tag of photo.tags ?? []) score += (counts.tag.get(tag) ?? 0) >= 3 ? 0.5 : 0;
    return score;
  };
  const take = photo => {
    chosen.push(photo);
    const colour = photo.colors?.[0]?.name ?? "none";
    counts.colour.set(colour, (counts.colour.get(colour) ?? 0) + 1);
    counts.orientation.set(photo.orientation, (counts.orientation.get(photo.orientation) ?? 0) + 1);
    for (const tag of photo.tags ?? []) counts.tag.set(tag, (counts.tag.get(tag) ?? 0) + 1);
  };

  const remaining = [...order];
  while (chosen.length < target && remaining.length) {
    const index = remaining.findIndex(photo => penalty(photo) === 0);
    const [photo] = remaining.splice(index >= 0 ? index : 0, 1);
    take(photo);
  }
  return chosen;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
