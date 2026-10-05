import { colorFromQueryToken } from "./colors.js";
import { publicPhotos } from "./library.js";

export const SEARCH_LIMIT = 60;
export const SEARCH_MAX_QUERY = 80;
export const MIN_SCORE = 0.2;

// Query synonyms map to the vocabulary the Colab tagger uses.
export const SYNONYMS = {
  automobile: "car",
  vehicle: "car",
  dusk: "sunset",
  sunrise: "morning",
  skyscraper: "architecture",
  skyscrapers: "architecture",
  buildings: "architecture",
  building: "architecture",
  tree: "nature",
  trees: "nature",
  forest: "nature",
  person: "people",
  human: "people",
  humans: "people",
};

export function parseQuery(raw) {
  const tokens = String(raw ?? "")
    .toLowerCase()
    .slice(0, SEARCH_MAX_QUERY)
    .split(/[^a-z]+/)
    .filter(Boolean);
  const colors = [];
  const terms = [];
  for (const token of tokens) {
    const color = colorFromQueryToken(token);
    if (color) {
      if (!colors.includes(color)) colors.push(color);
      continue;
    }
    const term = SYNONYMS[token] ?? token;
    if (!terms.includes(term)) terms.push(term);
  }
  return { raw: String(raw ?? "").slice(0, SEARCH_MAX_QUERY), terms, colors };
}

// Scorers are independent functions returning a value in [0, 1] and a weight. A future
// vector-similarity scorer is one more entry here; the ranking loop does not change.
export const scorers = [
  {
    name: "tags",
    weight: 1,
    score: (query, photo) => {
      if (!query.terms.length) return 0;
      const tags = new Set(photo.tags ?? []);
      return query.terms.filter(term => tags.has(term)).length / query.terms.length;
    },
  },
  {
    name: "caption",
    weight: 0.4,
    score: (query, photo) => {
      if (!query.terms.length || !photo.caption) return 0;
      const words = new Set(String(photo.caption).toLowerCase().split(/[^a-z]+/));
      return query.terms.filter(term => words.has(term)).length / query.terms.length;
    },
  },
  {
    name: "color",
    // Explicit colour intent dominates: "green" must rank photos that are actually green
    // above photos that are merely tagged with something related.
    weight: 0,
    score: (query, photo) => {
      if (!query.colors.length) return 0;
      const shares = new Map((photo.colors ?? []).map(entry => [entry.name, entry.share]));
      return query.colors.reduce((sum, color) => sum + Math.min(1, (shares.get(color) ?? 0) / 0.25), 0) / query.colors.length;
    },
  },
];

export function rankPhotos(raw, photos, { limit = SEARCH_LIMIT, scorerList = scorers } = {}) {
  const query = parseQuery(raw);
  if (!query.terms.length && !query.colors.length) return { query, results: [] };
  const hasColorIntent = query.colors.length > 0;
  const results = publicPhotos(photos)
    .map(photo => {
      const colorScore = scorerList.find(s => s.name === "color").score(query, photo);
      const semantic = scorerList
        .filter(s => s.name !== "color")
        .reduce((sum, scorer) => sum + scorer.weight * scorer.score(query, photo), 0);
      // Colour-only queries are judged on colour; mixed queries require some semantic match
      // too, so "green car" needs cars that are green-ish rather than any green photo.
      const requiresSemantic = query.terms.length > 0;
      const score = hasColorIntent
        ? 3 * colorScore + (requiresSemantic ? semantic : 0.5 * semantic)
        : semantic;
      return { id: photo.id, score: round(score), colorScore: round(colorScore) };
    })
    .filter(entry => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit);
  return { query, results };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
