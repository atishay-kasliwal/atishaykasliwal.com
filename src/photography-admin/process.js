import { classifyPixel, colorShares } from "../photography-core/colors.js";

const DISPLAY_LONG_EDGE = 2400;
const SAMPLE_EDGE = 96;

// Decodes the file in the browser. Returns the true dimensions, the dominant colours from a
// small sample, and a re-encoded display JPEG with no metadata: canvas output carries no EXIF
// or GPS, so the public copy can never leak them.
export async function processPhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    if (!/\.hei[cf]$/i.test(file.name) && !/^image\/(heic|heif)(-sequence)?$/i.test(file.type)) throw error;
    const { heicTo } = await import("heic-to/csp");
    bitmap = await heicTo({ blob: file, type: "bitmap" });
  }
  const { width, height } = bitmap;
  const sample = scale(width, height, SAMPLE_EDGE);
  const sampleCanvas = new OffscreenCanvas(sample.width, sample.height);
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleContext.drawImage(bitmap, 0, 0, sample.width, sample.height);
  const { data } = sampleContext.getImageData(0, 0, sample.width, sample.height);
  const counts = {};
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const name = classifyPixel(data[i], data[i + 1], data[i + 2]);
    counts[name] = (counts[name] ?? 0) + 1;
  }
  const colors = colorShares(counts);

  const display = scale(width, height, DISPLAY_LONG_EDGE);
  const canvas = new OffscreenCanvas(display.width, display.height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, display.width, display.height);
  const displayBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
  bitmap.close();
  return { width, height, colors, displayBlob };
}

function scale(width, height, longEdge) {
  const ratio = Math.min(1, longEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}
