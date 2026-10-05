export const COLOR_NAMES = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "gray"];

const COLOR_SYNONYMS = {
  grey: "gray",
  navy: "blue",
  teal: "blue",
  cyan: "blue",
  violet: "purple",
  magenta: "pink",
  beige: "brown",
  tan: "brown",
};

export function colorFromQueryToken(token) {
  if (COLOR_NAMES.includes(token)) return token;
  return COLOR_SYNONYMS[token] ?? null;
}

// Classifies one RGB pixel (0-255) into a named colour, or null for pixels that are
// too ambiguous to count (mid-tone, low-saturation gray handled separately).
export function classifyPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 510;
  const chroma = (max - min) / 255;
  if (lightness < 0.12) return "black";
  if (lightness > 0.9 && chroma < 0.12) return "white";
  if (chroma < 0.12) return "gray";
  let hue;
  const delta = max - min;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 40) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 165) return "green";
  if (hue < 255) return "blue";
  if (hue < 290) return "purple";
  return "pink";
}

// Turns classified pixel counts into shares that sum to one, keeping only meaningful colours.
export function colorShares(counts, minimumShare = 0.04) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (!total) return [];
  return Object.entries(counts)
    .map(([name, count]) => ({ name, share: Math.round((count / total) * 1000) / 1000 }))
    .filter(entry => entry.share >= minimumShare)
    .sort((a, b) => b.share - a.share || a.name.localeCompare(b.name));
}
