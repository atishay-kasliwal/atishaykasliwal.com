import { hashString, seededRandom } from "./random.js";

// Symmetric packing: the first photograph is the centre feature, the rest fill a grid around
// it. Each photograph keeps its own aspect ratio and is contained in its cell, so nothing
// overlaps. Sizes and nudges are seeded per photograph, so the arrangement is stable.
export function packPhotos(photos, { width, height, mobile = false }) {
  if (!photos.length || width <= 0 || height <= 0) return [];
  const gap = Math.max(10, Math.min(width, height) * 0.025);
  const [feature, ...rest] = photos;
  const boxes = [];

  const featureRatio = feature.width / feature.height;
  const featureHeight = height * (mobile ? 0.3 : 0.5);
  const featureWidth = Math.min(width * (mobile ? 0.86 : 0.42), featureHeight * featureRatio);
  const featureBox = {
    left: (width - featureWidth) / 2,
    top: mobile ? height * 0.04 : (height - featureHeight) / 2,
    width: featureWidth,
    height: featureWidth / featureRatio,
  };
  boxes.push({ id: feature.id, ...featureBox, z: 30 });

  if (!rest.length) return boxes;
  const rows = mobile ? 8 : 4;
  const featureRect = { left: featureBox.left - gap, top: featureBox.top - gap, right: featureBox.left + featureBox.width + gap, bottom: featureBox.top + featureBox.height + gap };
  let cells = [];
  for (let cols = Math.max(2, Math.ceil(rest.length / rows)); ; cols += 1) {
    const cellW = (width - gap * (cols + 1)) / cols;
    const cellH = (height - gap * (rows + 1)) / rows;
    cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const left = gap + col * (cellW + gap);
        const top = gap + row * (cellH + gap);
        const overlaps = left < featureRect.right && left + cellW > featureRect.left && top < featureRect.bottom && top + cellH > featureRect.top;
        if (!overlaps) cells.push({ left, top, cellW, cellH });
      }
    }
    if (cells.length >= rest.length) break;
  }

  rest.forEach((photo, index) => {
    const slot = cells.length === 1 ? 0 : Math.round((index * (cells.length - 1)) / (rest.length - 1 || 1));
    const cell = cells[Math.min(slot, cells.length - 1)];
    const random = seededRandom(hashString(`pack:${photo.id}`));
    const scale = 0.72 + random() * 0.28;
    const ratio = photo.width / photo.height;
    let w = cell.cellW * scale;
    let h = w / ratio;
    if (h > cell.cellH * scale) {
      h = cell.cellH * scale;
      w = h * ratio;
    }
    const nudgeX = (random() - 0.5) * (cell.cellW - w) * 0.4;
    const nudgeY = (random() - 0.5) * (cell.cellH - h) * 0.4;
    boxes.push({
      id: photo.id,
      left: cell.left + (cell.cellW - w) / 2 + nudgeX,
      top: cell.top + (cell.cellH - h) / 2 + nudgeY,
      width: w,
      height: h,
      z: 10,
    });
  });
  return boxes;
}
